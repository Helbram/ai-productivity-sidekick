import OpenAI from "openai";
import { getGoogleClient } from "./googleClient";
import { storeBriefing } from "./storeBriefing";
import { supabase } from "./supabaseClient";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function setGoogleConnection(email, connected) {
    const { error } = await supabase
        .from("profiles")
        .update({ google_connected: connected })
        .eq("email", email);
    if (error) console.error("Failed to update google_connected:", error);
}

export async function generateBriefing(req, res, session) {
    // Try to build Google clients; if tokens are invalid, this can fail
    let gmail, calendar;
    try {
        const clients = await getGoogleClient(req, res);
        gmail = clients.gmail;
        calendar = clients.calendar;
    } catch (err) {
        // Most common: refresh token invalid -> "invalid_grant"
        const msg = (err && err.message) || "";
        if (msg.includes("invalid_grant")) {
            await setGoogleConnection(session.user.email, false);
            // Throw a special error string the API route can recognize
            const e = new Error("GOOGLE_DISCONNECTED");
            e.code = "GOOGLE_DISCONNECTED";
            throw e;
        }
        throw err;
    }

    // Gmail
    let messages = [];
    const emailSnippets = [];
    try {
        const gmailRes = await gmail.users.messages.list({
            userId: "me",
            maxResults: 5,
        });
        messages = gmailRes.data.messages || [];

        for (const message of messages) {
            const fullMsg = await gmail.users.messages.get({
                userId: "me",
                id: message.id,
                format: "metadata",
                metadataHeaders: ["Subject", "From"],
            });

            const headers = fullMsg.data.payload.headers;
            const subject = headers.find((h) => h.name === "Subject")?.value;
            const from = headers.find((h) => h.name === "From")?.value;
            emailSnippets.push(`From: ${from}, Subject: ${subject}`);
        }
    } catch (err) {
        const msg = (err && err.message) || "";
        if (msg.includes("invalid_grant") || msg.includes("unauthorized")) {
            await setGoogleConnection(session.user.email, false);
            const e = new Error("GOOGLE_DISCONNECTED");
            e.code = "GOOGLE_DISCONNECTED";
            throw e;
        }
        throw err;
    }

    // Calendar
    let events = [];
    try {
        const calRes = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 5,
            singleEvents: true,
            orderBy: "startTime",
        });

        events = (calRes.data.items || []).map((event) => {
            const title = event.summary || "(No Title)";
            const time = event.start?.dateTime || event.start?.date;
            return `Event ${title} at ${time}`;
        });
    } catch (err) {
        const msg = (err && err.message) || "";
        if (msg.includes("invalid_grant") || msg.includes("unauthorized")) {
            await setGoogleConnection(session.user.email, false);
            const e = new Error("GOOGLE_DISCONNECTED");
            e.code = "GOOGLE_DISCONNECTED";
            throw e;
        }
        throw err;
    }

    // If we reached here, Google calls succeeded - mark connected (in case it was false before)
    await setGoogleConnection(session.user.email, true);

    // Create AI prompt
    const prompt = `
    You're a personal assistant. Summarize today's priorities based on:
    
    Emails:
    ${emailSnippets.join("\n")}
    
    Calendar:
    ${events.join("\n")}
    
    Give a concise summary with key tasks, time-sensitive items, and any high-priority issues.
    `;

    const chatResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
    });

    if (
        !chatResponse ||
        !Array.isArray(chatResponse.choices) ||
        chatResponse.choices.length === 0
    ) {
        throw new Error("No choices returned from OpenAI");
    }

    const summary = chatResponse.choices[0].message.content;

    await storeBriefing({
        userEmail: session.user.email,
        summary,
        emailSnippets,
        events
    });

    return {
        summary,
        emailSnippets,
        events,
    };
}
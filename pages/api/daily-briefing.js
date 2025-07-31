import { getGoogleClient } from "@/lib/googleClient";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    try {
        const { gmail, calendar } = await getGoogleClient(req, res);

        // Get emails
        const gmailRes = await gmail.users.messages.list({
            userId: "me",
            maxResults: 5,
        });

        const messages = gmailRes.data.messages || [];

        let emailSnippets = [];

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

        // Get calendar events
        const calRes = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 5,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = calRes.data.items.map((event) => {
            const title = event.summary || "(No Title)";
            const time = event.start?.dateTime || event.start?.date;
            return `Event ${title} at ${time}`;
        });

        // Create AI prompt
        const prompt = `
        You're a personal assistant. Summarize today's priorities based on:
        
        Emails:
        ${emailSnippets.join("\n")}
        
        Calendar:
        ${events.join("\n")}
        
        Give a concise summary with key tasks, time-sensitive items, and any high-priority issues.
        `;

        let chatResponse;
        try {
            const chatResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
            });

            console.log("OpenAI response data:", chatResponse);

            // Defensive check
            if (
                !chatResponse ||
                !Array.isArray(chatResponse.choices) ||
                chatResponse.choices.length === 0
            ) {
                throw new Error("No choices returned from OpenAI");
            }

            const summary = chatResponse.choices[0].message.content;

            res.status(200).json({
                summary,
                emailSnippets,
                events,
            });
        } catch (openaiErr) {
            console.error("OpenAI error:", openaiErr);
            throw new Error("Failed to call OpenAI");
        }
    } catch (err) {
        console.error("Briefing error:", err);
        res.status(500).json({ error: "Failed to generate daily briefing" });
    }
}
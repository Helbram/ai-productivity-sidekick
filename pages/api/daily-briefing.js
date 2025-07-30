import { getGoogleClient } from "@/lib/googleClient";
import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(
    new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

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

        const aiResponse = await openai.createChatCompletion({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
        });

        const summary = aiResponse.data.choices[0].message.content;

        res.status(200).json({ summary });
    } catch (err) {
        console.error("Briefing error:", err);
        res.status(500).json({ error: "Failed to generate daily briefing" });
    }
}
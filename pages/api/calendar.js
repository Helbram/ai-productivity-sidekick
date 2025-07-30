import { getGoogleClient } from "@/lib/googleClient";
import { eventarc } from "googleapis/build/src/apis/eventarc";

export default async function handler(req, res) {
    try {
        const { calendar } = await getGoogleClient(req, res);

        const calendarResponse = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 5,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = calendarResponse.data.items.map((event) => ({
            summary: event.summary || "(No Title)",
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
        }));

        res.status(200).json({ events });
    } catch (error) {
        console.error("Google Calendar API Error:", error);
        res.status(500).json({ error: "Failed to fetch calendar events" });
    }
}
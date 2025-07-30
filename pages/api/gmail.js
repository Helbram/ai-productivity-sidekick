import { getGoogleClient } from "@/lib/googleClient";

export default async function handler(req, res) {
    try {
        const { gmail } = await getGoogleClient(req, res);

        // List the latest 5 email message IDs
        const listResponse = await gmail.users.messages.list({
            userId: "me",
            maxResults: 5,
            labelIds: ["INBOX"],
        });

        const messages = listResponse.data.messages || [];

        // Fetch full message content for each message ID
        const fullMessages = await Promise.all(
            messages.map(async (msg) => {
                const messageData = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id,
                    labelIds: "full",
                });

                const snippet = messageData.data.snippet;
                const subjectHeader = messageData.data.payload.headers.find(
                    (h) => h.name === "Subject"
                );
                const subject = subjectHeader ? subjectHeader.value : "(No Subject)";

                return { subject, snippet };
            })
        );

        res.status(200).json({ messages: fullMessages });
    } catch (error) {
        console.error("Gmail API Error:", error);
        res.status(500).json({ error: "Failed to fetch Gmail messages" });
    }
}
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { generateBriefing } from "@/lib/generateBriefing";

let cachedBriefing = null;
let lastGeneratedAt = null;

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const newBriefing = await generateBriefing(req, res);

        cachedBriefing = newBriefing;
        lastGeneratedAt = new Date();

        return res.status(200).json(newBriefing);
    } catch (err) {
        console.error("Refresh briefing failed:", err.stack || err);
        return res.status(500).json({ error: "Failed to refresh briefing." });
    }
}
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { generateBriefing } from "@/lib/generateBriefing";

// ✅ Local in-memory cache
let cachedBriefing = null;
let lastGeneratedAt = null;

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // ✅ Return existing cache if available
    if (cachedBriefing) {
        console.log("Returning cached briefing");
        return res.status(200).json(cachedBriefing);
    }

    try {
        // ✅ First time load (or after server restart)
        const newBriefing = await generateBriefing(req, res);
        cachedBriefing = newBriefing;
        lastGeneratedAt = new Date();

        return res.status(200).json(newBriefing);
    } catch (err) {
        console.error("Daily briefing failed:", err);
        return res.status(500).json({ error: "Failed to load daily briefing." });
    }
}
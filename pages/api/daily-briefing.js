import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { generateBriefing } from "@/lib/generateBriefing";
import { supabase } from "@/lib/supabaseClient";

// Local in-memory cache
let cachedBriefing = null;
let lastGeneratedAt = null;

// Refresh limits
const REFRESH_LIMITS = { free: 1, pro: 5 };
const userRefreshTracker = new Map();

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = session.user.email;

    // Determine refresh info
    const userData = userRefreshTracker.get(userEmail) || {
        count: 0,
        lastRefresh: null,
        plan: "free", // Default plan
    };

    const now = new Date();
    const last = userData.lastRefresh ? new Date(userData.lastRefresh) : null;
    const hoursSince = last ? (now - last) / (1000 * 60 * 60) : Infinity;
    const limit = REFRESH_LIMITS[userData.plan];
    const remaining = hoursSince >= 24 ? limit : Math.max(limit - userData.count, 0);

    // Return existing cache if available
    if (cachedBriefing) {
        console.log("Returning cached briefing");
        return res.status(200).json({
            ...cachedBriefing,
            refreshInfo: { remaining, limit }, // Add refresh info here
        });
    }

    try {
        // First time load (or after server restart)
        const newBriefing = await generateBriefing(req, res, session);
        cachedBriefing = newBriefing;
        lastGeneratedAt = new Date();

        return res.status(200).json({
            ...newBriefing,
            refreshInfo: { remaining, limit } // Include refresh info
        });
    } catch (err) {
        console.error("Daily briefing failed:", err);
        return res.status(500).json({ error: "Failed to load daily briefing." });
    }
}
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { generateBriefing } from "@/lib/generateBriefing";
import { supabase } from "@/lib/supabaseClient";

let cachedBriefing = null;
let lastGeneratedAt = null;

// Simple in-memory tracking
const userRefreshTracker = new Map();
const REFRESH_LIMITS = {
    free: 1,
    pro: 5, // extend later
};

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = session.user.email;
    const userData = userRefreshTracker.get(userEmail) || {
        count: 0,
        lastRefresh: null,
        plan: "free",
    };

    const now = new Date();
    const last = userData.lastRefresh ? new Date(userData.lastRefresh) : null;
    const hoursSince = last ? (now - last) / (1000 * 60 * 60) : Infinity;
    const limit = REFRESH_LIMITS[userData.plan];

    // Block if over limit
    if (hoursSince < 24 && userData.count >= limit) {
        return res.status(200).json({
            limitReached: true,
            remaining: 0,
        });
    }

    // Check if refresh limit reached
    // if (hoursSince < 24 && userData.count >= limit) {
    //     return res.status(429).json({
    //         error: `Daily refresh limit reached (${limit}). Try again later.`,
    //     });
    // }

    try {
        const newBriefing = await generateBriefing(req, res, session);

        cachedBriefing = newBriefing;
        lastGeneratedAt = new Date();

        userRefreshTracker.set(userEmail, {
            count: hoursSince >= 24 ? 1 : userData.count + 1,
            lastRefresh: now.toISOString(),
            plan: userData.plan,
        });

        const remaining = limit - (hoursSince >= 24 ? 1 : userData.count + 1)

        return res.status(200).json({
            ...newBriefing,
            limitReached: false,
            remaining,
        });
    } catch (err) {
        console.error("Refresh briefing failed:", err.stack || err);
        return res.status(500).json({ error: "Failed to refresh briefing." });
    }
}
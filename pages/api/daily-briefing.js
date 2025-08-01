import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { generateBriefing } from "@/lib/generateBriefing";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateUserProfile } from "@/lib/profileUtils";

// In-memory cache
let cachedBriefing = null;
let lastGeneratedAt = null;

const REFRESH_LIMITS = { free: 1, pro: 5 };

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = session.user.email;

    try {
        // Get user profile
        const profile = await getOrCreateUserProfile(userEmail);
        const plan = profile.plan || "free";
        const limit = REFRESH_LIMITS[plan];

        const now = new Date();
        const last = profile.last_refresh ? new Date(profile.last_refresh) : null;
        const hoursSince = last ? (now - last) / (1000 * 60 * 60) : Infinity;
        const count = hoursSince >= 24 ? 0 : profile.refresh_count || 0;
        const remaining = Math.max(limit - count, 0);

        // Use cached version if available
        if (cachedBriefing) {
            console.log("Returning cached briefing");
            return res.status(200).json({
                ...cachedBriefing,
                refreshInfo: { remaining, limit },
            });
        }

        // First-time generation
        const newBriefing = await generateBriefing(req, res, session);
        cachedBriefing = newBriefing;
        lastGeneratedAt = new Date();

        return res.status(200).json({
            ...newBriefing,
            refreshInfo: { remaining, limit },
        });
    } catch (err) {
        console.error("Daily briefing failed:", err.stack || err);
        return res.status(500).json({ error: "Failed to load daily briefing." });
    }
}
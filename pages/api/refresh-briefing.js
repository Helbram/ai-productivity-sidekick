import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { generateBriefing } from "@/lib/generateBriefing";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateUserProfile } from "@/lib/profileUtils";

const REFRESH_LIMITS = {
    free: 1,
    pro: 5,
};

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = session.user.email;

    try {
        // Fetch or create profile
        const profile = await getOrCreateUserProfile(userEmail);
        const plan = profile.plan || "free";
        const limit = REFRESH_LIMITS[plan];

        const now = new Date();
        const last = profile.last_refresh ? new Date(profile.last_refresh) : null;
        const hoursSince = last ? (now - last) / (1000 * 60 * 60) : Infinity;
        const count = hoursSince >= 24 ? 0 : profile.refresh_count || 0;

        if (count >= limit) {
            return res.status(200).json({
                limitReached: true,
                remaining: 0,
            });
        }

        // Generate new briefing
        const newBriefing = await generateBriefing(req, res, session);

        // Update profile with new refresh count and timestamp
        await supabase
            .from("profiles")
            .update({
                refresh_count: count + 1,
                last_refresh: now.toISOString(),
            })
            .eq("email", userEmail);

        const remaining = limit - (count + 1);

        return res.status(200).json({
            ...newBriefing,
            limitReached: false,
            remaining,
        });
    } catch (err) {
        if (err?.code === "GOOGLE_DISCONNECTED" || err?.message === "GOOGLE_DISCONNECTED") {
            return sendError(res, 401, "GOOGLE_DISCONNECTED", "Google account disconnected");
        }
        console.error("Refresh briefing failed:", err.stack || err);
        return sendError(res, 500, "REFRESH_BRIEFING_FAILED", "Failed to refresh briefing.");
    }
}
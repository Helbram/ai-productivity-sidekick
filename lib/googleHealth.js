import { getGoogleClient } from "./googleClient";
import { supabase } from "./supabaseClient";

export async function markGoogleConnection(email, connected) {
    const { error } = await supabase
        .from("profiles")
        .update({ google_connected: connected })
        .eq("email", email);
    if (error) console.error("Failed to update google_connected", error);
}

export async function checkGoogleConnection(req, res, email) {
    try {
        const { gmail, calendar } = await getGoogleClient(req, res);

        await gmail.users.getProfile({ userId: "me" });
        await calendar.calendarList.list({ maxResults: 1 });

        await markGoogleConnection(email, true);
        return { ok: true };
    } catch (err) {
        const msg = (err && err.message) || "";
        if (msg.includes("invalid_grant") || msg.includes("unauthorized")) {
            await markGoogleConnection(email, false);
            return { ok: false, errorCode: "GOOGLE_DISCONNECTED" };
        }
        console.error("Google health check failed:", err);
        return { ok: false, errorCode: "GOOGLE_HEALTH_UNKNOWN" };
    }
}
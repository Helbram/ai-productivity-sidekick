import { supabase } from "./supabaseClient";

export async function storeBriefing({ userEmail, summary, emailSnippets, events }) {
    const { error } = await supabase
        .from("briefings")
        .insert({
            userEmail: userEmail,
            summary,
            email_snippets: JSON.stringify(emailSnippets),
            events: JSON.stringify(events),
            generated_at: new Date().toISOString(),
        });

    if (error) {
        console.error("Error saving briefing:", error);
        throw new Error("Failed to store briefing");
    }
}
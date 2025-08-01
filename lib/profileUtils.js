import { supabase } from "./supabaseClient";

export async function getOrCreateUserProfile(email) {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
        throw new Error("Failed to load user profile");
    }

    if (data) return data;

    // Insert if not found
    const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({ email })
        .select()
        .single();

    if (insertError) {
        console.error("Error creating profile:", insertError);
        throw new Error("Failed to create user profile");
    }

    return newProfile;
}

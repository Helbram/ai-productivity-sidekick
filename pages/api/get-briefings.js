import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabase
        .from("briefings")
        .select("*")
        .eq("userEmail", session.user.email)
        .order("generated_at", { ascending: false });

    if (error) {
        console.error("Supabase error fetching briefings:", error);
        return res.status(500).json({ error: "Failed to load briefings." });
    }

    res.status(200).json(data);
}
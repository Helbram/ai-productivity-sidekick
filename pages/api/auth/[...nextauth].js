import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabaseClient";

export default NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly",
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Save the accessToken to the token
            //console.log("JWT callback: token before", token);
            if (account) {
                //console.log("Account:", account);
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;
            }
            //console.log("JWT callback: token after", token);
            return token;
        },
        async session({ session, token }) {
            // Pass accessToken to the client session
            //console.log("Session callback: token", token);
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            //console.log("Session callback: session", session);
            return session;
        },
        async signIn({ user }) {
            try {
                const { supabase } = await import("@/lib/supabaseClient");

                const { error } = await supabase
                    .from("profiles")
                    .upsert({
                        email: user.email,
                        name: user.name || null,
                        // plan: 'free' - optional, defaults via supabase schema
                    }, {
                        onConflict: "email", // prevent duplicate rows
                    });

                if (error) {
                    console.error("Error inserting into profiles:", error);
                    // Optionally: return false to block login
                }
            } catch (err) {
                console.error("Unexpected error in signIn callback:", err);
            }

            return true; // Always allow sign in
        }
    },
});
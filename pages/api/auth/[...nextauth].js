import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
    },
});
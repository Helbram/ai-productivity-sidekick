import { getToken } from "next-auth/jwt";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { calendar } from "googleapis/build/src/apis/calendar";

/**
 * Returns an authenticated Google API client using the user's session.
 */
export async function getGoogleClient(req, res, scopes = []) {
    const token = await getToken({ req });

    //console.log("Access token from session:", token.accessToken);

    if (!token) throw new Error("No token found.");

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refresh_token,
    });

    // Return the Google API clients you need
    return {
        gmail: google.gmail({ version: "v1", auth: oauth2Client }),
        calendar: google.calendar({ version: "v3", auth: oauth2Client }),
    };
}
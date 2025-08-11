import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { checkGoogleConnection } from "@/lib/googleHealth";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
        return res.status(401).json({ errorCode: "UNAUTHORIZED", message: "Unauthorized" });

    }
    const result = await checkGoogleConnection(req, res, session.user.email);
    if (!result.ok) {
        const code = result.errorCode || "GOOGLE_HEALTH_UNKNOWN";
        return res.status(200).json({ ok: false, errorCode: code });
    }
    return res.status(200).json({ ok: true });
}
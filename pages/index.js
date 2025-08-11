import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Layout from "@/components/Layout";

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [summary, setSummary] = useState('');
    const [emailSnippets, setEmailSnippets] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [refreshLimitReached, setRefreshLimitReached] = useState(false);
    const [remainingRefreshes, setRemainingRefreshes] = useState(null);
    const [showReconnect, setShowReconnect] = useState(false);

    const fetchBriefing = async () => {
        try {
            const res = await fetch('/api/daily-briefing');
            const data = await res.json();

            if (!res.ok) {
                if (data?.error === "google_disconnected") {
                    setError("Your Google account is disconnected. Please reconnect.");
                    setShowReconnect(true);
                    return;
                }
                throw new Error(data.error || 'Failed to fetch daily briefing');
            }

            setSummary(data.summary);
            setEmailSnippets(data.emailSnippets);
            setEvents(data.events);

            if (data.refreshInfo) {
                setRemainingRefreshes(data.refreshInfo.remaining);
                setRefreshLimitReached(data.refreshInfo.remaining === 0);
            }

            setError('');
            setShowReconnect(false);
        } catch (err) {
            console.error("Failed to load briefing:", err);
            setError('Failed to load briefing.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchBriefing();
        }
    }, [status]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/refresh-briefing');
            const data = await res.json();

            if (res.status !== 200) {
                if (data?.error === "google_disconnected") {
                    setError("Your Google account is disconnected. Please reconnect.");
                    setShowReconnect(true);
                    return;
                }
                throw new Error(data.error || "Failed to refresh briefing.");
            }

            if (data.limitReached) {
                setRefreshLimitReached(true);
                setRemainingRefreshes(0);
                return;
            }

            setRefreshLimitReached(false);
            setRemainingRefreshes(data.remaining);
            setSummary(data.summary);
            setEmailSnippets(data.emailSnippets);
            setEvents(data.events);
            setShowReconnect(false);
        } catch (err) {
            console.error("Failed to refresh briefing:", err);
            setError('Failed to refresh briefing.');
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }

    if (status === "loading") {
        return <Layout><p>Checking authentication...</p></Layout>;
    }

    if (status === "unauthenticated") {
        return (
            <Layout>
                <h1>Please Sign In</h1>
                <p>You must be logged in to access your daily briefing.</p>
                <button onClick={() => signIn()}>Sign In</button>
            </Layout>
        );
    }

    return (
        <Layout>
            <h1>Daily Briefing</h1>

            <button onClick={handleRefresh} disabled={refreshing || loading || refreshLimitReached}>
                {refreshing ? "Refreshing..." : "Refresh Briefing"}
            </button>
            {remainingRefreshes != null && !loading && (
                <p>
                    Refreshes left today:{" "}
                    <strong>{remainingRefreshes}</strong>
                </p>
            )}
            {refreshLimitReached && (
                <p style={{ color: 'orange' }}>
                    You&apos;ve used all your daily refreshes. Try again tomorrow or upgrade your plan.
                </p>
            )}
            {showReconnect && (
                <div style={{ marginTop: 12 }}>
                    <p style={{ color: 'orange' }}>
                        Your Google account is disconnected. Please reconnect to continue.
                    </p>
                    <button onClick={() => signIn("google")}>Reconnect to Google</button>
                </div>
            )}

            <h2>Summary</h2>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && (
                <pre style={{ whiteSpace: 'pre-wrap' }}>{summary}</pre>
            )}

            {!loading && !error && (
                <>
                    <h2>Emails</h2>
                    <ul>
                        {emailSnippets.map((snippet, index) => (
                            <li key={index}>{snippet}</li>
                        ))}
                    </ul>

                    <h2>Calendar Events</h2>
                    <ul>
                        {events.map((event, index) => (
                            <li key={index}>{event}</li>
                        ))}
                    </ul>
                </>
            )}
        </Layout>
    );
}
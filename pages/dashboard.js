import { useEffect, useState } from "react";

export default function Dashboard() {
    const [summary, setSummary] = useState('');
    const [emailSnippets, setEmailSnippets] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBriefing = async () => {
            try {
                const res = await fetch('/api/daily-briefing');
                if (!res.ok) throw new Error('Failed to fetch daily briefing');
                const data = await res.json();
                setSummary(data.summary);
                setEmailSnippets(data.emailSnippets);
                setEvents(data.events);
            } catch (err) {
                console.error(err);
                setError('Failed to load briefing.');
            } finally {
                setLoading(false);
            }
        };

        fetchBriefing();
    }, []);

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
            <h1>Daily Briefing</h1>
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
        </div>
    );
}
import { useEffect, useState } from "react";

export default function Dashboard() {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBriefing = async () => {
            try {
                const res = await fetch('/api/daily-briefing');
                if (!res.ok) throw new Error('Failed to fetch daily briefing');
                const data = await res.json();
                setSummary(data.summary);
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
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && (
                <pre style={{ whiteSpace: 'pre-wrap' }}>{summary}</pre>
            )}
        </div>
    );
}
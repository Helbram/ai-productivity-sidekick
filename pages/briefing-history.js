import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";

export default function BriefingHistory() {
    const [briefings, setBriefings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBriefings = async () => {
            try {
                const res = await fetch('/api/get-briefings');
                console.log("Response status:", res.status);
                const data = await res.json();
                console.log("Response data:", data);
    
                if (!res.ok) throw new Error(data.error || 'Unknown error');
                setBriefings(data);
            } catch (err) {
                console.error("Briefing history fetch failed:", err);
                setError('Failed to load briefing history.');
            }
        };
    
        fetchBriefings();
    }, []);
    

    return (
        <Layout>
            <h1>Briefing History</h1>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && briefings.length === 0 && <p>No briefings yet.</p>}
            <ul>
                {briefings.map((b, i) => (
                    <li key={i} style={{ marginBottom: "1.5rem" }}>
                        <h3>{new Date(b.generated_at).toLocaleString()}</h3>
                        <pre style={{ whiteSpace: 'pre-wrap' }}>{b.summary}</pre>
                        <details>
                            <summary>Emails</summary>
                            <ul>
                                {JSON.parse(b.email_snippets).map((e, idx) => (
                                    <li key={idx}>{e}</li>
                                ))}
                            </ul>
                        </details>
                        <details>
                            <summary>Calendar Events</summary>
                            <ul>
                                {JSON.parse(b.events).map((e, idx) => (
                                    <li key={idx}>{e}</li>
                                ))}
                            </ul>
                        </details>
                    </li>
                ))}
            </ul>
        </Layout>
    );
}
import Link from "next/link";

export default function Layout({ children }) {
    return (
        <div style={{ fontFamily: 'sans-serif', padding: '1rem' }}>
            <header style={{ borderBottom: '1px solid gray', marginBottom: '2rem' }}>
                <h1>AI Productivity Sidekick</h1>
                <p style={{ fontStyle: 'italic', marginTop: '1rem' }}>Your personalized daily assistant</p>
                <Link href="/briefing-history">
                    <button>View Briefing History</button>
                </Link>
            </header>

            <main>{children}</main>
        </div>
    );
}
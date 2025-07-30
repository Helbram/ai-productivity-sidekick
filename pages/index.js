import { useState, useEffect } from "react";

export default function Home() {
  const [emailText, setEmailText] = useState("Hi John, just a reminder that we need the budget report by Thursday. Also, make sure to send the slides to the client before 2 PM meeting.");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const today = new Date().toDateString();

  // Load from cache on first render
  useEffect(() => {
    const cached = localStorage.getItem("ai_summary_cache");
    const cachedDate = localStorage.getItem("ai_summary_date");

    if (cached && cachedDate === today) {
      setResult(cached);
      setMessage("Loaded cached summary.");
    }
  }, []);

  // Handle refresh button logic
  const handleRefresh = async () => {
    const refreshCount = parseInt(localStorage.getItem("ai_refresh_count") || "0");
    const refreshDate = localStorage.getItem("ai_summary_date");

    // Enforce 1 refresh per day (for free users)
    if (refreshDate === today && refreshCount >= 1) {
      setMessage("You've used your 1 free refresh today. Upgrade for more!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });

      const data = await response.json();

      if (data.result) {
        setResult(data.result);

        // Cache result and count refresh
        localStorage.setItem("ai_summary_cache", data.result);
        localStorage.setItem("ai_summary_date", today);
        localStorage.setItem("ai_refresh_count", refreshDate === today ? refreshCount + 1 : 1);

        setMessage("Summary refreshed successfully.");
      } else {
        setMessage("OpenAI returned an unexpected response.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong during refresh.");
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial", color: "white", backgroundColor: "#1a1a1a", minHeight: "100vh" }}>
      <h1>Email Summarizer</h1>

      <textarea
        rows={6}
        value={emailText}
        onChange={(e) => setEmailText(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", fontSize: "1rem" }}
      />

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <button onClick={handleRefresh} disabled={loading}>
          {loading ? "Summarizing..." : "Refresh Priorities"}
        </button>
        <button onClick={() => {
          localStorage.clear();
          setResult("");
          setMessage("Cache cleared.");
        }}>
          Clear Cache
        </button>
      </div>

      {message && <p style={{ color: "#ccc" }}>{message}</p>}

      <div style={{ marginTop: "1.5rem", whiteSpace: "pre-wrap" }}>
        {result && (
          <>
            <h3>AI Output</h3>
            <p>{result}</p>
          </>
        )}
      </div>
    </div>
  );
}
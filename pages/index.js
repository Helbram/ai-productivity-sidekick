import { useState } from "react";

export default function Home() {
  const [emailText, setEmailText] = useState("Hi John, just a reminder that we need the budget report by Thursday. Also, make sure to send the slides to the client before 2 PM meeting.");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailText }),
    });
    const data = await response.json();
    setResult(data.result);
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Email Summarizer</h1>
      <textarea
        rows={6}
        value={emailText}
        onChange={(e) => setEmailText(e.target.value)}
        style={{ width: "100%", padding: "0.5rem" }}
      />
      <button onClick={handleSummarize} disabled={loading}>
        {loading ? "Summarizing..." : "Summarize"}
      </button>
      <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
        {result && (
          <>
            <h3>AI Output:</h3>
            <p>{result}</p>
          </>
        )}
      </div>
    </div>
  );
}
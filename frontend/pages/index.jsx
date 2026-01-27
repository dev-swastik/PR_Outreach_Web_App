import { useState } from "react";

export default function Home() {
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const startCampaign = async () => {
    setLoading(true);

    const res = await fetch("http://localhost:5000/start-campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, topic })
    });

    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>PR Outreach Demo</h1>

      <input
        placeholder="Company Name"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />
      <br />

      <input
        placeholder="Topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <br />

      <button onClick={startCampaign} disabled={loading}>
        {loading ? "Running..." : "Start Campaign"}
      </button>

      <hr />

      {results.map((r, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <b>{r.name}</b> — {r.publication} <br />
          {r.email}
          <pre>{r.emailBody}</pre>
        </div>
      ))}
    </div>
  );
}

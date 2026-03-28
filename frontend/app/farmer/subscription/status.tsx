"use client";
import { useEffect, useState } from "react";

export default function FarmerSubscriptionStatus() {
  const [status, setStatus] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/subscription/me")
      .then(async (res) => {
        const data = await res.json();
        if (data.status === "success" && data.data) {
          setStatus(data.data.status);
          setEndDate(data.data.endDate ? new Date(data.data.endDate).toLocaleDateString() : null);
        } else {
          setStatus(null);
        }
      })
      .catch(() => setError("Could not fetch subscription status."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>Subscription Status</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <>
          {status === "active" ? (
            <p style={{ color: "green", fontWeight: "bold" }}>Active until {endDate}</p>
          ) : status === "expired" ? (
            <p style={{ color: "orange", fontWeight: "bold" }}>Expired</p>
          ) : (
            <p style={{ color: "red", fontWeight: "bold" }}>No active subscription</p>
          )}
        </>
      )}
    </div>
  );
}

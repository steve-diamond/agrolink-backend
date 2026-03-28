"use client";
import { useState } from "react";

export default function FarmerSubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Replace with actual user email and callback_url in real app
      const email = "farmer@example.com";
      const callback_url = `${window.location.origin}/farmer/subscription/verify`;
      const res = await fetch("/api/subscription/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callback_url }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.message || "Failed to initialize subscription payment");
      }
      window.location.href = data.authorization_url;
    } catch (err: any) {
      setError(err.message || "Subscription payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>Farmer Subscription</h2>
      <p>Pay a monthly fee to list your products on the marketplace.</p>
      <p style={{ fontWeight: "bold" }}>₦2,000 / month</p>
      <button onClick={handleSubscribe} disabled={loading} style={{ padding: "10px 24px", fontSize: 16, background: "#08c", color: "#fff", border: "none", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Redirecting..." : "Subscribe Now"}
      </button>
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      {success && <p style={{ color: "green", marginTop: 12 }}>{success}</p>}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifySubscriptionPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<null | "success" | "failed">(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reference) return;
    setLoading(true);
    fetch(`/api/subscription/verify/${reference}`)
      .then(async (res) => {
        const data = await res.json();
        setStatus(data.status === "success" ? "success" : "failed");
        setMessage(data.message || (data.status === "success" ? "Subscription activated!" : "Subscription failed."));
      })
      .catch(() => {
        setStatus("failed");
        setMessage("Could not verify subscription payment.");
      })
      .finally(() => setLoading(false));
  }, [reference]);

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 32, border: "1px solid #eee", borderRadius: 12, textAlign: "center", background: "#fafcff" }}>
      <h2>Subscription Verification</h2>
      {loading && <p>Verifying payment...</p>}
      {!loading && status === "success" && (
        <>
          <p style={{ color: "green", fontWeight: "bold", fontSize: 20, margin: "24px 0 8px" }}>Subscription Activated</p>
          <p>You can now list your products!</p>
        </>
      )}
      {!loading && status === "failed" && (
        <>
          <p style={{ color: "red", fontWeight: "bold", fontSize: 20, margin: "24px 0 8px" }}>Subscription Failed</p>
          <p>If you were charged, please contact support.</p>
        </>
      )}
    </div>
  );
}

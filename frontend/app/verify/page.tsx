"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<null | "success" | "failed">(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reference) return;
    setLoading(true);
    fetch(`/api/payment/verify/${reference}`)
      .then(async (res) => {
        const data = await res.json();
        setStatus(data.status === "success" ? "success" : "failed");
      })
      .catch(() => {
        setStatus("failed");
      })
      .finally(() => setLoading(false));
  }, [reference]);

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 32, border: "1px solid #eee", borderRadius: 12, textAlign: "center", background: "#fafcff" }}>
      <h2>Payment Verification</h2>
      {loading && <p>Verifying payment...</p>}
      {!loading && status === "success" && (
        <>
          <p style={{ color: "green", fontWeight: "bold", fontSize: 20, margin: "24px 0 8px" }}>Payment Successful</p>
          <p>Thank you for your purchase!</p>
        </>
      )}
      {!loading && status === "failed" && (
        <>
          <p style={{ color: "red", fontWeight: "bold", fontSize: 20, margin: "24px 0 8px" }}>Payment Failed</p>
          <p>If you were charged, please contact support.</p>
        </>
      )}
    </div>
  );
}

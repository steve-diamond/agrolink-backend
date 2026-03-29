"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import API from "@/services/api";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const reference = params.get("reference");

    if (!reference) {
      setStatus("failed");
      setMessage("No payment reference found.");
      return;
    }

    API.get(`/api/payment/verify/${reference}`)
      .then((res) => {
        const data = (res as { data: { status: string } }).data;
        if (data.status === "success") {
          setStatus("success");
          setMessage("Payment verified! Your order is confirmed.");
        } else {
          setStatus("failed");
          setMessage("Payment was not successful. Please try again.");
        }
      })
      .catch(() => {
        setStatus("failed");
        setMessage("Verification failed. Please contact support.");
      });
  }, [params]);

  const colorMap = { loading: "#555", success: "#16a34a", failed: "#dc2626" };

  return (
    <main style={{ padding: "3rem", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ color: colorMap[status] }}>
        {status === "loading" && "Processing Payment..."}
        {status === "success" && "Payment Successful!"}
        {status === "failed" && "Payment Failed"}
      </h1>
      <p style={{ color: "#444", marginTop: "1rem" }}>{message}</p>
      {status !== "loading" && (
        <a
          href="/marketplace"
          style={{
            display: "inline-block",
            marginTop: "2rem",
            padding: "10px 20px",
            background: "#16a34a",
            color: "white",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Back to Marketplace
        </a>
      )}
    </main>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

"use client";
import { useState } from "react";

// Dummy product for demonstration
const product = {
  _id: "order123",
  name: "Sample Product",
  price: 5000,
  description: "A great product for demonstration purposes.",
};

export default function MarketplacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuyNow = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace with actual user email and callback_url in real app
      const email = "buyer@example.com";
      const callback_url = `${window.location.origin}/payment/callback`;
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: product.price,
          orderId: product._id,
          callback_url,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.message || "Failed to initialize payment");
      }
      window.location.href = data.authorization_url;
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <p style={{ fontWeight: "bold" }}>₦{product.price.toLocaleString()}</p>
      <button onClick={handleBuyNow} disabled={loading} style={{ padding: "10px 24px", fontSize: 16, background: "#08c", color: "#fff", border: "none", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Redirecting..." : "Buy Now"}
      </button>
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getProducts, Product } from "@/services/productService";
import API from "@/services/api";

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (productId: string, price: number) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user._id) {
      alert("Please login first");
      return;
    }

    try {
      // 1. Create order
      const orderRes = await API.post("/api/orders", {
        productId,
        buyerId: user._id,
        quantity: 1,
      });

      const order = orderRes.data;

      // 2. Initialize Paystack payment
      const paymentRes = await API.post("/api/payment/initialize", {
        email: user.email,
        amount: order.totalPrice,
        orderId: order._id,
        callback_url: `${window.location.origin}/payment-success`,
      });

      // 3. Redirect to Paystack checkout
      window.location.href = paymentRes.data.data.authorization_url;
    } catch (error) {
      console.error(error);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Marketplace</h1>
      <p style={{ color: "#555" }}>Fresh farm produce directly from farmers.</p>

      {loading && <p>Loading products...</p>}
      {fetchError && <p style={{ color: "red" }}>Error: {fetchError}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {products.map((product: any) => (
          <div
            key={product._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <h3>{product.name}</h3>
            <p>₦{product.price}</p>
            <p>{product.quantity} units</p>
            <p>{product.location}</p>

            <button
              style={{
                marginTop: "10px",
                padding: "8px",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={() => handleBuy(product._id, product.price)}
            >
              Buy
            </button>
          </div>
        ))}

        {!loading && products.length === 0 && !fetchError && (
          <p>No products listed yet.</p>
        )}
      </div>
    </main>
  );
}

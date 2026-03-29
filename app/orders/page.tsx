"use client";

import { useEffect, useState } from "react";
import API from "@/services/api";

type OrderProduct = {
  _id: string;
  name: string;
  price: number;
  location: string;
  farmer?: string;
};

type OrderBuyer = {
  _id: string;
  name: string;
  email: string;
};

type Order = {
  _id: string;
  productId: OrderProduct;
  buyerId: OrderBuyer;
  quantity: number;
  totalPrice: number;
  status: "pending" | "paid" | "delivered";
  createdAt: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get<Order[]>("/api/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load orders."))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    pending: "#f59e0b",
    paid: "#3b82f6",
    delivered: "#22c55e",
  };

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Orders</h1>
      <p style={{ color: "#555" }}>All placed orders.</p>

      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && orders.length === 0 && !error && (
        <p>No orders found.</p>
      )}

      <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
        {orders.map((order) => (
          <div
            key={order._id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>{order.productId?.name ?? "Unknown Product"}</h2>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  background: statusColor[order.status] ?? "#ccc",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  textTransform: "capitalize",
                }}
              >
                {order.status}
              </span>
            </div>

            <p style={{ margin: "8px 0 0" }}>
              Buyer: <strong>{order.buyerId?.name}</strong> ({order.buyerId?.email})
            </p>
            <p style={{ margin: "4px 0" }}>Quantity: {order.quantity}</p>
            <p style={{ margin: "4px 0" }}>
              Total: <strong>₦{order.totalPrice.toLocaleString()}</strong>
            </p>
            <p style={{ margin: "4px 0", color: "#888", fontSize: "13px" }}>
              Placed: {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

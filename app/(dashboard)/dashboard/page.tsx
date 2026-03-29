"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/services/api";

export default function Dashboard() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: "",
    location: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const token = localStorage.getItem("token") || "";
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    try {
      await API.post(
        "/api/products",
        {
          name: form.name,
          price: Number(form.price),
          quantity: Number(form.quantity),
          location: form.location,
          farmer: user.name,
        },
        {
          headers: { Authorization: token },
        }
      );

      alert("Product added successfully");
      setForm({ name: "", price: "", quantity: "", location: "" });
    } catch (error: any) {
      alert(error?.response?.data?.error || "Failed to add product");
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      router.push("/login");
    }
  }, [router]);

  return (
    <main style={{ padding: "20px" }}>
      <h1>Farmer Dashboard</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required />
        <input name="price" placeholder="Price" value={form.price} onChange={handleChange} required />
        <input name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} required />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required />

        <button
          style={{
            background: "#16a34a",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Add Product
        </button>
      </form>
    </main>
  );
}
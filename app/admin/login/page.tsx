"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/services/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      type LoginResponse = { data: { token: string; user: { role?: string; [key: string]: unknown } } };
      const res = await API.post("/api/auth/login", form) as LoginResponse;
      const user = res.data.user;

      if (user?.role !== "admin") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setError("Access denied. Admin account required.");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(user));
      router.push("/admin");
    } catch (err: unknown) {
      const errMsg =
        (err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null) ?? "Admin login failed";
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ padding: "20px", maxWidth: "420px", margin: "0 auto" }}>
      <h1>Admin Login</h1>
      <p style={{ color: "#666" }}>Sign in with an admin account to access the admin dashboard.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <input
          name="email"
          type="email"
          placeholder="Admin email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "12px", border: "1px solid #ccc", borderRadius: "6px" }}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "12px", border: "1px solid #ccc", borderRadius: "6px" }}
        />

        {error ? <p style={{ color: "red", marginBottom: "12px" }}>{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "10px 14px",
            border: "none",
            borderRadius: "6px",
            background: isSubmitting ? "#999" : "#111827",
            color: "#fff",
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Signing in..." : "Login as Admin"}
        </button>
      </form>
    </main>
  );
}

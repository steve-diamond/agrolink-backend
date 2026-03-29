"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/services/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DateRange = 30 | 90 | 365;

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  approved?: boolean;
};

type AdminProduct = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
};

type AdminOrder = {
  _id: string;
  totalPrice: number;
  status: string;
  createdAt?: string;
  buyerId?: {
    name?: string;
    email?: string;
  };
  productId?: {
    name?: string;
  };
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<DateRange>(90);

  const getToken = () => localStorage.getItem("token") ?? "";

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    Promise.all([
      API.get("/api/admin/users", { headers: { Authorization: token } }),
      API.get("/api/admin/products", { headers: { Authorization: token } }),
      API.get("/api/admin/orders", { headers: { Authorization: token } }),
    ])
      .then(([usersRes, productsRes, ordersRes]) => {
        setUsers(usersRes.data);
        setProducts(productsRes.data);
        setOrders(ordersRes.data);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || "Failed to load admin dashboard.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (type: "users" | "products" | "orders", id: string) => {
    if (!confirm(`Delete this ${type.slice(0, -1)}? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await API.delete(`/api/admin/${type}/${id}`, { headers: { Authorization: getToken() } });
      if (type === "users") setUsers((prev) => prev.filter((u) => u._id !== id));
      if (type === "products") setProducts((prev) => prev.filter((p) => p._id !== id));
      if (type === "orders") setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || `Failed to delete ${type.slice(0, -1)}.`);
    } finally {
      setDeleting(null);
    }
  };

  const deleteUser = (id: string) => handleDelete("users", id);
  const deleteProduct = (id: string) => handleDelete("products", id);

  const approveFarmer = async (id: string) => {
    try {
      await API.patch(`/api/admin/users/${id}/approve`, null, {
        headers: { Authorization: getToken() },
      });
      setUsers((prev) =>
        prev.map((user) => (user._id === id ? { ...user, approved: true } : user))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve farmer.");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!order.createdAt) return false;
    const created = new Date(order.createdAt);
    if (Number.isNaN(created.getTime())) return false;
    const now = new Date();
    const ageMs = now.getTime() - created.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays <= rangeDays;
  });

  const totalUsers = users.length;
  const totalProducts = products.length;
  const totalOrders = filteredOrders.length;

  const totalRevenue = filteredOrders.reduce(
    (sum: number, order: any) => sum + order.totalPrice,
    0
  );
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const farmerCount = users.filter((user) => user.role === "farmer").length;
  const approvedFarmerCount = users.filter(
    (user) => user.role === "farmer" && user.approved
  ).length;

  const roleDistributionData = [
    { name: "Farmers", value: users.filter((user) => user.role === "farmer").length },
    { name: "Buyers", value: users.filter((user) => user.role === "buyer").length },
    { name: "Admins", value: users.filter((user) => user.role === "admin").length },
  ];

  const approvalData = [
    { name: "Approved", value: approvedFarmerCount },
    { name: "Pending", value: Math.max(0, farmerCount - approvedFarmerCount) },
  ];
  const approvalRate = farmerCount > 0 ? (approvedFarmerCount / farmerCount) * 100 : 0;

  const orderStatusData = Object.values(
    filteredOrders.reduce((acc: Record<string, { name: string; count: number }>, order) => {
      const key = (order.status || "unknown").toLowerCase();
      if (!acc[key]) {
        acc[key] = { name: key, count: 0 };
      }
      acc[key].count += 1;
      return acc;
    }, {})
  );

  const topProductPriceData = [...products]
    .sort((a, b) => b.price - a.price)
    .slice(0, 6)
    .map((product) => ({ name: product.name, price: product.price }));

  const revenueTrendData = (() => {
    const monthMap: Record<string, number> = {};

    filteredOrders.forEach((order) => {
      const date = order.createdAt ? new Date(order.createdAt) : null;
      if (!date || Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + Number(order.totalPrice || 0);
    });

    return Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, revenue]) => ({
        month: key,
        revenue,
      }));
  })();

  const orderStatusTrendData = (() => {
    const bucketMap: Record<string, { label: string; pending: number; paid: number; delivered: number; unknown: number }> = {};

    filteredOrders.forEach((order) => {
      const date = order.createdAt ? new Date(order.createdAt) : null;
      if (!date || Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!bucketMap[key]) {
        bucketMap[key] = {
          label: key,
          pending: 0,
          paid: 0,
          delivered: 0,
          unknown: 0,
        };
      }

      const status = (order.status || "unknown").toLowerCase();
      if (status === "pending" || status === "paid" || status === "delivered") {
        bucketMap[key][status] += 1;
      } else {
        bucketMap[key].unknown += 1;
      }
    });

    return Object.values(bucketMap)
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-6);
  })();

  const currencyFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });

  const compactFormatter = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  const exportAnalyticsCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Date Range (days)", String(rangeDays)],
      ["Total Users", String(totalUsers)],
      ["Total Products", String(totalProducts)],
      ["Total Orders", String(totalOrders)],
      ["Total Revenue", String(totalRevenue)],
      ["Average Order Value", String(averageOrderValue)],
      ["Farmer Approval Rate", `${approvalRate.toFixed(1)}%`],
      [],
      ["Order ID", "Product", "Buyer", "Status", "Total Price", "Created At"],
      ...filteredOrders.map((order) => [
        order._id,
        order.productId?.name || "Unknown",
        order.buyerId?.email || "Unknown",
        order.status || "unknown",
        String(order.totalPrice || 0),
        order.createdAt || "",
      ]),
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    link.href = url;
    link.setAttribute("download", `agrolink-investor-report-${rangeDays}d-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printInvestorReport = () => {
    window.print();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/admin/login");
  };

  return (
    <main
      className="admin-board"
      style={{
        padding: "20px",
        background: "radial-gradient(circle at top right, #fde68a 0%, #f8fafc 45%)",
        minHeight: "100vh",
      }}
    >
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .admin-board {
            background: #ffffff !important;
          }
        }
      `}</style>

      <section
        className="print-card"
        style={{
          background: "linear-gradient(120deg, #0f172a, #1e293b)",
          color: "#f8fafc",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "16px",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "#cbd5e1", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "12px" }}>
              Investor Control Room
            </p>
            <h1 style={{ margin: "8px 0 0", fontSize: "30px" }}>AgroLink Executive Dashboard</h1>
            <p style={{ margin: "8px 0 0", color: "#cbd5e1" }}>
              Live market intelligence, operations, and approval performance.
            </p>
          </div>

          <div className="no-print" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={exportAnalyticsCsv}
              style={{
                border: "1px solid #22d3ee",
                background: "#155e75",
                color: "#ecfeff",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              Export CSV
            </button>
            <button
              onClick={printInvestorReport}
              style={{
                border: "1px solid #facc15",
                background: "#854d0e",
                color: "#fef9c3",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              Print Report
            </button>
            <button
              onClick={handleLogout}
              style={{
                border: "1px solid #fca5a5",
                background: "#7f1d1d",
                color: "#fee2e2",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </section>

      <div style={{
        background: "#f1f5f9",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px"
      }}>
        <h2>Platform Stats</h2>
        <div style={{ display: "flex", gap: "20px" }}>
          <div>Total Users: {totalUsers}</div>
          <div>Total Products: {totalProducts}</div>
          <div>Total Orders: {totalOrders}</div>
          <div>Total Revenue: ₦{totalRevenue}</div>
        </div>
      </div>

      <section className="print-card" style={{ marginTop: "20px" }}>
        <h2>Investor Analytics</h2>
        <div className="no-print" style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          {[30, 90, 365].map((value) => (
            <button
              key={value}
              onClick={() => setRangeDays(value as DateRange)}
              style={{
                border: "1px solid #cbd5e1",
                background: rangeDays === value ? "#0f172a" : "#ffffff",
                color: rangeDays === value ? "#ffffff" : "#0f172a",
                borderRadius: "8px",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              Last {value} days
            </button>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
            <p style={{ margin: 0, color: "#64748b" }}>Total Revenue</p>
            <h3 style={{ margin: "8px 0 0" }}>{currencyFormatter.format(totalRevenue)}</h3>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
            <p style={{ margin: 0, color: "#64748b" }}>Average Order Value</p>
            <h3 style={{ margin: "8px 0 0" }}>{currencyFormatter.format(averageOrderValue)}</h3>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
            <p style={{ margin: 0, color: "#64748b" }}>Farmer Approval Rate</p>
            <h3 style={{ margin: "8px 0 0" }}>{approvalRate.toFixed(1)}%</h3>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
            <p style={{ margin: 0, color: "#64748b" }}>Approved Farmers</p>
            <h3 style={{ margin: "8px 0 0" }}>{compactFormatter.format(approvedFarmerCount)} / {compactFormatter.format(farmerCount)}</h3>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px",
              height: "320px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>User Role Distribution</h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={roleDistributionData} dataKey="value" nameKey="name" outerRadius={90}>
                  {roleDistributionData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={["#2563eb", "#0f766e", "#7c3aed"][index % 3]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px",
              height: "320px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Farmer Approval Status</h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={approvalData} dataKey="value" nameKey="name" outerRadius={90}>
                  {approvalData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={["#16a34a", "#dc2626"][index % 2]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px",
              height: "320px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Order Status Volume</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px",
              height: "320px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Top Product Prices</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={topProductPriceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₦${value ?? 0}`, "Price"]} />
                <Bar dataKey="price" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px",
              height: "320px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Revenue Trend (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [currencyFormatter.format(Number(value ?? 0)), "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px",
              height: "320px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Status Trend (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={orderStatusTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending" stackId="status" fill="#f59e0b" />
                <Bar dataKey="paid" stackId="status" fill="#0ea5e9" />
                <Bar dataKey="delivered" stackId="status" fill="#22c55e" />
                <Bar dataKey="unknown" stackId="status" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <hr />

      <section>
        <h2>Users</h2>
        {users.map((u: any) => (
          <div key={u._id}>
            {u.email} - {u.role}
            {u.role === "farmer" ? ` - ${u.approved ? "Approved" : "Pending"}` : ""}
            {u.role === "farmer" && !u.approved ? (
              <button onClick={() => approveFarmer(u._id)}>Approve</button>
            ) : null}
            <button onClick={() => deleteUser(u._id)}>Delete</button>
          </div>
        ))}
      </section>

      <hr />

      <section>
        <h2>Products</h2>
        {products.map((p: any) => (
          <div key={p._id}>
            {p.name} - ₦{p.price}
            <button onClick={() => deleteProduct(p._id)}>Delete</button>
          </div>
        ))}
      </section>

      <hr />

      <section>
        <h2>Orders</h2>
        {orders.map((o: any) => (
          <div key={o._id}>
            {o.productId?.name} - {o.buyerId?.email} - ₦{o.totalPrice}
          </div>
        ))}
      </section>
    </main>
  );
}

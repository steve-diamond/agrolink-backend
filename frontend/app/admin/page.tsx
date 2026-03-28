"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import type { Withdrawal } from "./withdrawalTypes";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  approved?: boolean;
  createdAt?: string;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  location: string;
  approved?: boolean;
  createdAt?: string;
};

type Order = {
  _id: string;
  quantity?: number;
  totalPrice?: number;
  status?: string;
  createdAt?: string;
  buyerId?: { name?: string; email?: string };
  productId?: { name?: string };
};

const thClass = "py-2 pr-4 text-left text-slate-500";
const tdClass = "py-2 pr-4 text-slate-700";

const fmtCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value || 0);

const fmtDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : "-");

// Helper to group by date (YYYY-MM-DD)
function groupByDate(arr: { createdAt?: string }[]) {
  const map: { [date: string]: number } = {};
  arr.forEach(item => {
    if (item.createdAt) {
      const d = new Date(item.createdAt).toISOString().slice(0, 10);
      map[d] = (map[d] || 0) + 1;
    }
  });
  return Object.entries(map).map(([date, count]) => ({ date, count }));
}

// Helper to sum withdrawal amounts by date
function sumWithdrawalsByDate(arr: { createdAt?: string, amount: number }[]) {
  const map: { [date: string]: number } = {};
  arr.forEach(item => {
    if (item.createdAt) {
      const d = new Date(item.createdAt).toISOString().slice(0, 10);
      map[d] = (map[d] || 0) + (item.amount || 0);
    }
  });
  return Object.entries(map).map(([date, amount]) => ({ date, amount }));
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const getToken = () => localStorage.getItem("token") || localStorage.getItem("agrolink_token") || "";

  const fetchData = async () => {
    try {
      if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

      const token = getToken();
      const headers = { Authorization: token ? `Bearer ${token}` : "" };

      const [usersRes, productsRes, ordersRes, withdrawalsRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/users`, { headers, cache: "no-store" }),
        fetch(`${baseUrl}/api/admin/products`, { headers, cache: "no-store" }),
        fetch(`${baseUrl}/api/admin/orders`, { headers, cache: "no-store" }),
        fetch(`${baseUrl}/api/withdrawals`, { headers, cache: "no-store" }),
      ]);

      if (!usersRes.ok || !productsRes.ok || !ordersRes.ok || !withdrawalsRes.ok) {
        throw new Error("Failed to fetch admin resources");
      }

      const usersJson = await usersRes.json();
      const productsJson = await productsRes.json();
      const ordersJson = await ordersRes.json();
      const withdrawalsJson = await withdrawalsRes.json();

      setUsers(Array.isArray(usersJson) ? usersJson : usersJson.users || []);
      setProducts(Array.isArray(productsJson) ? productsJson : productsJson.products || []);
      setOrders(Array.isArray(ordersJson) ? ordersJson : ordersJson.orders || []);
      setWithdrawals(Array.isArray(withdrawalsJson) ? withdrawalsJson : withdrawalsJson.data || []);
      setError(null);
      setSuccess(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
  // Approve, reject, mark as paid, refund, add note
  const handleWithdrawalAction = async (id: string, action: "approved" | "rejected" | "paid" | "refunded") => {
    try {
      if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
      setBusyId(id + action);
      const token = getToken();
      let url = "";
      let method = "PATCH";
      if (action === "approved") url = `/api/withdrawals/admin/${id}/approve`;
      else if (action === "rejected") url = `/api/withdrawals/admin/${id}`; // fallback, or add a reject endpoint
      else if (action === "paid") url = `/api/withdrawals/admin/${id}/mark-paid`;
      else if (action === "refunded") url = `/api/withdrawals/admin/${id}/refund`;
      else return;
      const res = await fetch(`${baseUrl}${url}`, {
        method,
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to update withdrawal status");
      const data = await res.json();
      setWithdrawals((prev) =>
        prev.map((w) => (w._id === id ? { ...w, status: action } : w))
      );
      setSuccess(`Withdrawal ${action}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  // Add admin note/comment
  const handleAddNote = async (id: string, note: string) => {
    try {
      if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
      setBusyId(id + "note");
      const token = getToken();
      const res = await fetch(`${baseUrl}/api/withdrawals/admin/${id}/note`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      setWithdrawals((prev) =>
        prev.map((w) => (w._id === id ? { ...w, adminNote: note } : w))
      );
      setSuccess("Note added.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  };
  // Render withdrawal requests table with new actions
  const [noteInput, setNoteInput] = useState<{ [id: string]: string }>({});
  const renderWithdrawalsTable = () =>
    React.createElement(
      "section",
      { className: "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5" },
      React.createElement("h2", { className: "mb-3 text-lg font-semibold text-slate-900" }, "Withdrawal Requests"),
      React.createElement(
        "div",
        { className: "overflow-x-auto" },
        React.createElement(
          "table",
          { className: "min-w-full text-sm" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              { className: "border-b border-slate-200" },
              React.createElement("th", { className: thClass }, "User"),
              React.createElement("th", { className: thClass }, "Amount"),
              React.createElement("th", { className: thClass }, "Bank Details"),
              React.createElement("th", { className: thClass }, "Status"),
              React.createElement("th", { className: thClass }, "Requested At"),
              React.createElement("th", { className: thClass }, "Action"),
              React.createElement("th", { className: thClass }, "Note")
            )
          ),
          React.createElement(
            "tbody",
            null,
            ...withdrawals.map((w) =>
              React.createElement(
                "tr",
                { key: w._id, className: "border-b border-slate-100" },
                React.createElement("td", { className: tdClass }, typeof w.user === "string" ? w.user : w.user.name),
                React.createElement("td", { className: tdClass }, fmtCurrency(w.amount)),
                React.createElement(
                  "td",
                  { className: tdClass },
                  `${w.bankDetails.accountName} (${w.bankDetails.accountNumber}, ${w.bankDetails.bankName})`
                ),
                React.createElement("td", { className: tdClass + " capitalize" }, w.status),
                React.createElement("td", { className: tdClass }, fmtDate(w.createdAt)),
                React.createElement(
                  "td",
                  { className: tdClass },
                  w.status === "pending"
                    ? React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleWithdrawalAction(w._id, "approved"),
                            disabled: busyId === w._id + "approved",
                            className:
                              "mr-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50",
                          },
                          busyId === w._id + "approved" ? "Approving..." : "Approve"
                        ),
                        React.createElement(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleWithdrawalAction(w._id, "rejected"),
                            disabled: busyId === w._id + "rejected",
                            className:
                              "rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50",
                          },
                          busyId === w._id + "rejected" ? "Rejecting..." : "Reject"
                        )
                      )
                    : w.status === "approved"
                    ? React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleWithdrawalAction(w._id, "paid"),
                            disabled: busyId === w._id + "paid",
                            className:
                              "mr-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50",
                          },
                          busyId === w._id + "paid" ? "Marking..." : "Mark as Paid"
                        ),
                        React.createElement(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleWithdrawalAction(w._id, "refunded"),
                            disabled: busyId === w._id + "refunded",
                            className:
                              "rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-yellow-700 disabled:opacity-50",
                          },
                          busyId === w._id + "refunded" ? "Refunding..." : "Refund"
                        )
                      )
                    : w.status.charAt(0).toUpperCase() + w.status.slice(1)
                ),
                React.createElement(
                  "td",
                  { className: tdClass },
                  React.createElement(
                    "div",
                    { className: "flex flex-col gap-1" },
                    React.createElement(
                      "input",
                      {
                        type: "text",
                        value: noteInput[w._id] ?? w.adminNote ?? "",
                        onChange: (e) => setNoteInput((prev) => ({ ...prev, [w._id]: e.target.value })),
                        placeholder: "Add note...",
                        className: "w-32 rounded border px-2 py-1 text-xs",
                        disabled: busyId === w._id + "note",
                      }
                    ),
                    React.createElement(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleAddNote(w._id, noteInput[w._id] ?? ""),
                        disabled: busyId === w._id + "note" || (noteInput[w._id] ?? "") === (w.adminNote ?? ""),
                        className:
                          "rounded bg-slate-600 px-2 py-1 text-xs text-white hover:bg-slate-700 disabled:opacity-50",
                      },
                      busyId === w._id + "note" ? "Saving..." : "Save Note"
                    )
                  )
                )
              )
            )
          )
        )
      )
    );

  useEffect(() => {
    fetchData();
  }, []);

  const approveProduct = async (productId: string) => {
    try {
      if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
      setBusyId(productId);
      const token = getToken();
      const res = await fetch(`${baseUrl}/api/admin/products/${productId}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to approve product");

      setProducts((prev: Product[]) => prev.map((p: Product) => (p._id === productId ? { ...p, approved: true } : p)));
      setSuccess("Product approved successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
      setBusyId(userId);
      const token = getToken();
      const res = await fetch(`${baseUrl}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) throw new Error("Failed to delete user");

      setUsers((prev: User[]) => prev.filter((u: User) => u._id !== userId));
      setSuccess("User deleted successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const markOrderDelivered = async (orderId: string) => {
    try {
      if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
      setBusyId(orderId);
      const token = getToken();
      const res = await fetch(`${baseUrl}/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "delivered" }),
      });

      if (!res.ok) throw new Error("Failed to update order status");

      setOrders((prev: Order[]) => prev.map((o: Order) => (o._id === orderId ? { ...o, status: "delivered" } : o)));
      setSuccess("Order marked as delivered.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const usersView = users.filter((user: User) => {
    const haystack = `${user.name} ${user.email} ${user.role}`.toLowerCase();
    return haystack.includes(userQuery.toLowerCase());
  });

  const productsView = products.filter((product: Product) => {
    const haystack = `${product.name} ${product.location}`.toLowerCase();
    return haystack.includes(productQuery.toLowerCase());
  });

  const ordersView = orders.filter((order: Order) => {
    const haystack = `${order.productId?.name || ""} ${order.buyerId?.name || ""} ${order.buyerId?.email || ""} ${
      order.status || ""
    }`.toLowerCase();
    return haystack.includes(orderQuery.toLowerCase());
  });

  const renderUsersTable = () =>
    React.createElement(
      "section",
      { className: "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5" },
      React.createElement("h2", { className: "mb-3 text-lg font-semibold text-slate-900" }, "Users List"),
      React.createElement(
        "div",
        { className: "mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" },
        React.createElement("p", { className: "text-xs text-slate-500" }, `Showing ${usersView.length} user(s)`),
        React.createElement("input", {
          value: userQuery,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUserQuery(e.target.value),
          placeholder: "Search users...",
          className: "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring sm:w-72",
        })
      ),
      React.createElement(
        "div",
        { className: "overflow-x-auto" },
        React.createElement(
          "table",
          { className: "min-w-full text-sm" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              { className: "border-b border-slate-200" },
              React.createElement("th", { className: thClass }, "Name"),
              React.createElement("th", { className: thClass }, "Email"),
              React.createElement("th", { className: thClass }, "Role"),
              React.createElement("th", { className: thClass }, "Joined"),
              React.createElement("th", { className: thClass }, "Action")
            )
          ),
          React.createElement(
            "tbody",
            null,
            ...usersView.map((user: User) =>
              React.createElement(
                "tr",
                { key: user._id, className: "border-b border-slate-100" },
                React.createElement("td", { className: tdClass + " font-medium text-slate-900" }, user.name),
                React.createElement("td", { className: tdClass }, user.email),
                React.createElement("td", { className: tdClass + " capitalize" }, user.role),
                React.createElement("td", { className: tdClass }, fmtDate(user.createdAt)),
                React.createElement(
                  "td",
                  { className: tdClass },
                  React.createElement(
                    "button",
                    {
                      type: "button",
                      onClick: () => deleteUser(user._id),
                      disabled: busyId === user._id || user.role === "admin",
                      className:
                        "rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50",
                    },
                    busyId === user._id ? "Deleting..." : "Delete User"
                  )
                )
              )
            )
          )
        )
      )
    );

  const renderProductsTable = () =>
    React.createElement(
      "section",
      { className: "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5" },
      React.createElement("h2", { className: "mb-3 text-lg font-semibold text-slate-900" }, "Products List"),
      React.createElement(
        "div",
        { className: "mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" },
        React.createElement("p", { className: "text-xs text-slate-500" }, `Showing ${productsView.length} product(s)`),
        React.createElement("input", {
          value: productQuery,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setProductQuery(e.target.value),
          placeholder: "Search products...",
          className: "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring sm:w-72",
        })
      ),
      React.createElement(
        "div",
        { className: "overflow-x-auto" },
        React.createElement(
          "table",
          { className: "min-w-full text-sm" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              { className: "border-b border-slate-200" },
              React.createElement("th", { className: thClass }, "Name"),
              React.createElement("th", { className: thClass }, "Price"),
              React.createElement("th", { className: thClass }, "Quantity"),
              React.createElement("th", { className: thClass }, "Location"),
              React.createElement("th", { className: thClass }, "Approved"),
              React.createElement("th", { className: thClass }, "Action")
            )
          ),
          React.createElement(
            "tbody",
            null,
            ...productsView.map((product: Product) =>
              React.createElement(
                "tr",
                { key: product._id, className: "border-b border-slate-100" },
                React.createElement("td", { className: tdClass + " font-medium text-slate-900" }, product.name),
                React.createElement("td", { className: tdClass }, fmtCurrency(product.price)),
                React.createElement("td", { className: tdClass }, String(product.quantity)),
                React.createElement("td", { className: tdClass }, product.location),
                React.createElement("td", { className: tdClass }, product.approved ? "Yes" : "No"),
                React.createElement(
                  "td",
                  { className: tdClass },
                  React.createElement(
                    "button",
                    {
                      type: "button",
                      onClick: () => approveProduct(product._id),
                      disabled: busyId === product._id || !!product.approved,
                      className:
                        "rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50",
                    },
                    product.approved ? "Approved" : busyId === product._id ? "Approving..." : "Approve Product"
                  )
                )
              )
            )
          )
        )
      )
    );

  const renderOrdersTable = () =>
    React.createElement(
      "section",
      { className: "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5" },
      React.createElement("h2", { className: "mb-3 text-lg font-semibold text-slate-900" }, "Orders List"),
      React.createElement(
        "div",
        { className: "mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" },
        React.createElement("p", { className: "text-xs text-slate-500" }, `Showing ${ordersView.length} order(s)`),
        React.createElement("input", {
          value: orderQuery,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setOrderQuery(e.target.value),
          placeholder: "Search orders...",
          className: "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring sm:w-72",
        })
      ),
      React.createElement(
        "div",
        { className: "overflow-x-auto" },
        React.createElement(
          "table",
          { className: "min-w-full text-sm" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              { className: "border-b border-slate-200" },
              React.createElement("th", { className: thClass }, "Product"),
              React.createElement("th", { className: thClass }, "Buyer"),
              React.createElement("th", { className: thClass }, "Quantity"),
              React.createElement("th", { className: thClass }, "Total"),
              React.createElement("th", { className: thClass }, "Status"),
              React.createElement("th", { className: thClass }, "Date"),
              React.createElement("th", { className: thClass }, "Action")
            )
          ),
          React.createElement(
            "tbody",
            null,
            ...ordersView.map((order: Order) =>
              React.createElement(
                "tr",
                { key: order._id, className: "border-b border-slate-100" },
                React.createElement("td", { className: tdClass }, order.productId?.name || "-"),
                React.createElement("td", { className: tdClass }, order.buyerId?.name || order.buyerId?.email || "-"),
                React.createElement("td", { className: tdClass }, String(order.quantity ?? 0)),
                React.createElement("td", { className: tdClass }, fmtCurrency(order.totalPrice ?? 0)),
                React.createElement("td", { className: tdClass + " capitalize" }, order.status || "-"),
                React.createElement("td", { className: tdClass }, fmtDate(order.createdAt)),
                React.createElement(
                  "td",
                  { className: tdClass },
                  React.createElement(
                    "button",
                    {
                      type: "button",
                      onClick: () => markOrderDelivered(order._id),
                      disabled: busyId === order._id || order.status === "delivered",
                      className:
                        "rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50",
                    },
                    order.status === "delivered" ? "Delivered" : busyId === order._id ? "Updating..." : "Mark Delivered"
                  )
                )
              )
            )
          )
        )
      )
    );

  // Summary cards data
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === "paid").reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalPendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;

  // Chart data
  const usersByDate = groupByDate(users);
  const ordersByDate = groupByDate(orders);
  const withdrawalsByDate = sumWithdrawalsByDate(withdrawals);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl bg-[#f5ecd7] p-5 shadow-sm ring-1 ring-[#bfa76a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image src="/dos-agrolink-logo.png" alt="DOS Agrolink Nigeria Logo" width={80} height={80} style={{ borderRadius: 16, background: '#fff' }} />
            <div>
              <h1 className="text-2xl font-bold text-[#2d4c2a] sm:text-3xl tracking-tight">DOS Agrolink Nigeria</h1>
              <p className="mt-1 text-sm text-[#7a5c2e]">Admin Dashboard</p>
            </div>
          </div>
          <div className="hidden sm:block text-[#2d4c2a] font-semibold text-lg tracking-wide">Empowering Nigerian Agriculture</div>
        </header>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
        )}
        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">Loading dashboard data...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-[#f5ecd7] p-4 shadow-sm ring-1 ring-[#bfa76a]">
                <p className="text-sm text-[#7a5c2e]">Users</p>
                <p className="mt-1 text-2xl font-semibold text-[#2d4c2a]">{users.length}</p>
              </div>
              <div className="rounded-2xl bg-[#f5ecd7] p-4 shadow-sm ring-1 ring-[#bfa76a]">
                <p className="text-sm text-[#7a5c2e]">Products</p>
                <p className="mt-1 text-2xl font-semibold text-[#2d4c2a]">{products.length}</p>
              </div>
              <div className="rounded-2xl bg-[#f5ecd7] p-4 shadow-sm ring-1 ring-[#bfa76a]">
                <p className="text-sm text-[#7a5c2e]">Orders</p>
                <p className="mt-1 text-2xl font-semibold text-[#2d4c2a]">{orders.length}</p>
              </div>
              <div className="rounded-2xl bg-[#f5ecd7] p-4 shadow-sm ring-1 ring-[#bfa76a]">
                <p className="text-sm text-[#7a5c2e]">Total Revenue</p>
                <p className="mt-1 text-2xl font-semibold text-[#2d4c2a]">{fmtCurrency(totalRevenue)}</p>
              </div>
              <div className="rounded-2xl bg-[#f5ecd7] p-4 shadow-sm ring-1 ring-[#bfa76a]">
                <p className="text-sm text-[#7a5c2e]">Total Withdrawn</p>
                <p className="mt-1 text-2xl font-semibold text-[#2d4c2a]">{fmtCurrency(totalWithdrawn)}</p>
              </div>
              <div className="rounded-2xl bg-[#f5ecd7] p-4 shadow-sm ring-1 ring-[#bfa76a]">
                <p className="text-sm text-[#7a5c2e]">Pending Withdrawals</p>
                <p className="mt-1 text-2xl font-semibold text-[#2d4c2a]">{totalPendingWithdrawals}</p>
              </div>
            </section>

            {/* Analytics Charts */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <h3 className="mb-2 text-base font-semibold text-slate-900">Users Over Time</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={usersByDate} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <h3 className="mb-2 text-base font-semibold text-slate-900">Orders Over Time</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ordersByDate} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:col-span-2">
                <h3 className="mb-2 text-base font-semibold text-slate-900">Withdrawals Over Time</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={withdrawalsByDate} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={fmtCurrency} />
                    <Line type="monotone" dataKey="amount" stroke="#f59e42" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {renderUsersTable()}
            {renderProductsTable()}
            {renderOrdersTable()}
            {renderWithdrawalsTable()}
          </>
        )}
      </div>
    </main>
  );
}

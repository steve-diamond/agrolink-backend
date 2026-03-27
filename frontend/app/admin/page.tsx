"use client";

import React, { useEffect, useState } from "react";

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

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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

      const [usersRes, productsRes, ordersRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/users`, { headers, cache: "no-store" }),
        fetch(`${baseUrl}/api/admin/products`, { headers, cache: "no-store" }),
        fetch(`${baseUrl}/api/admin/orders`, { headers, cache: "no-store" }),
      ]);

      if (!usersRes.ok || !productsRes.ok || !ordersRes.ok) {
        throw new Error("Failed to fetch admin resources");
      }

      const usersJson = await usersRes.json();
      const productsJson = await productsRes.json();
      const ordersJson = await ordersRes.json();

      setUsers(Array.isArray(usersJson) ? usersJson : usersJson.users || []);
      setProducts(Array.isArray(productsJson) ? productsJson : productsJson.products || []);
      setOrders(Array.isArray(ordersJson) ? ordersJson : ordersJson.orders || []);
      setError(null);
      setSuccess(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
              React.createElement("th", { className: thClass }, "Date")
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
                React.createElement("td", { className: tdClass }, fmtDate(order.createdAt))
              )
            )
          )
        )
      )
    );

  return React.createElement(
    "main",
    { className: "min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl space-y-6" },
      React.createElement(
        "header",
        { className: "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" },
        React.createElement("h1", { className: "text-2xl font-bold text-slate-900 sm:text-3xl" }, "Admin Dashboard"),
        React.createElement(
          "p",
          { className: "mt-1 text-sm text-slate-600" },
          "Manage users, products, and orders from one place."
        )
      ),
      error
        ? React.createElement(
            "div",
            { className: "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" },
            error
          )
        : null,
      success
        ? React.createElement(
            "div",
            { className: "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" },
            success
          )
        : null,
      loading
        ? React.createElement(
            "div",
            { className: "rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200" },
            "Loading dashboard data..."
          )
        : React.createElement(
            React.Fragment,
            null,
            React.createElement(
              "section",
              { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" },
              React.createElement(
                "div",
                { className: "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" },
                React.createElement("p", { className: "text-sm text-slate-500" }, "Users"),
                React.createElement("p", { className: "mt-1 text-2xl font-semibold text-slate-900" }, String(users.length))
              ),
              React.createElement(
                "div",
                { className: "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" },
                React.createElement("p", { className: "text-sm text-slate-500" }, "Products"),
                React.createElement("p", { className: "mt-1 text-2xl font-semibold text-slate-900" }, String(products.length))
              ),
              React.createElement(
                "div",
                { className: "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" },
                React.createElement("p", { className: "text-sm text-slate-500" }, "Orders"),
                React.createElement("p", { className: "mt-1 text-2xl font-semibold text-slate-900" }, String(orders.length))
              )
            ),
            renderUsersTable(),
            renderProductsTable(),
            renderOrdersTable()
          )
    )
  );
}

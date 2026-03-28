"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState("NGN");
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("agrolink_token") || ""
      : "";

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
        const token = getToken();
        const res = await fetch(`${baseUrl}/api/wallet/me`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.ok) throw new Error("Failed to fetch wallet");
        const data = await res.json();
        setBalance(data.balance || 0);
        setCurrency(data.currency || "NGN");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    const fetchEarnings = async () => {
      try {
        if (!baseUrl) return;
        const token = getToken();
        const res = await fetch(`${baseUrl}/api/wallet/deposits`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.ok) return;
        const data = await res.json();
        const total = (data.data || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);
        setEarnings(total);
      } catch {}
    };
    fetchWallet();
    fetchEarnings();
  }, [baseUrl]);

  const handleWithdraw = () => {
    // TODO: Open withdraw modal or redirect
    alert("Withdraw feature coming soon!");
  };

  return (
    <main className="min-h-screen bg-[#f5ecd7] p-4 sm:p-8">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="rounded-2xl bg-[#f5ecd7] p-5 shadow-sm ring-1 ring-[#bfa76a] flex items-center gap-4">
          <Image src="/dos-agrolink-logo.png" alt="DOS Agrolink Nigeria Logo" width={56} height={56} style={{ borderRadius: 12, background: '#fff' }} />
          <div>
            <h1 className="text-2xl font-bold text-[#2d4c2a] sm:text-3xl tracking-tight">DOS Agrolink Nigeria</h1>
            <p className="mt-1 text-sm text-[#7a5c2e]">My Wallet</p>
          </div>
        </header>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-[#7a5c2e] shadow-sm ring-1 ring-[#bfa76a]">Loading...</div>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#fff] p-4 shadow-sm ring-1 ring-[#bfa76a]">
              <p className="text-sm text-[#7a5c2e]">Balance</p>
              <p className="mt-1 text-2xl font-semibold text-[#2d4c2a]">
                {new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(balance)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#fff] p-4 shadow-sm ring-1 ring-[#bfa76a]">
              <p className="text-sm text-[#7a5c2e]">Total Earnings</p>
              <p className="mt-1 text-2xl font-semibold text-[#2d4c2a]">
                {new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(earnings)}
              </p>
            </div>
          </section>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleWithdraw}
            className="rounded-lg bg-[#2d4c2a] px-5 py-2 text-base font-medium text-white transition hover:bg-[#1e331a] disabled:opacity-50"
          >
            Withdraw
          </button>
        </div>
      </div>
    </main>
  );
}

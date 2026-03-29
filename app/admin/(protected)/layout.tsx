"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userRaw || !token) {
      router.replace("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role !== "admin") {
        setDenied(true);
        return;
      }

      setAuthorized(true);
    } catch {
      router.replace("/admin/login");
    }
  }, [router]);

  if (denied) {
    return <div>Access Denied</div>;
  }

  if (!authorized) {
    return <main style={{ padding: "20px" }}>Checking admin access...</main>;
  }

  return <>{children}</>;
}

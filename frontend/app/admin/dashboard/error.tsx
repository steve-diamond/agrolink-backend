"use client";

import React, { useEffect } from "react";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Admin dashboard route error:", error);
  }, [error]);

  return React.createElement(
    "main",
    { className: "min-h-screen bg-slate-50 p-6" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-2xl rounded-xl border border-red-200 bg-white p-6 shadow-sm" },
      React.createElement("h1", { className: "text-xl font-semibold text-red-700" }, "Dashboard failed to load"),
      React.createElement(
        "p",
        { className: "mt-2 text-sm text-slate-600" },
        "Something went wrong while loading the admin dashboard."
      ),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: reset,
          className: "mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700",
        },
        "Try again"
      )
    )
  );
}

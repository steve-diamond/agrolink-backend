import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            padding: "15px",
            background: "#0f172a",
            color: "white",
            display: "flex",
            gap: "20px",
          }}
        >
          <Link href="/">Home</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/login">Login</Link>
        </nav>

        <div style={{ padding: "20px" }}>{children}</div>
      </body>
    </html>
  );
}

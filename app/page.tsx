import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "20px" }}>
      <h1>AgroLink Nigeria</h1>

      <nav>
        <ul>
          <li>
            <Link href="/marketplace">Marketplace</Link>
          </li>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/admin">Admin</Link>
          </li>
          <li>
            <Link href="/admin/login">Admin Login</Link>
          </li>
          <li>
            <Link href="/admin">Admin Dashboard</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}

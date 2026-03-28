import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ minHeight: "80vh", background: "#f5ecd7", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "#fff",
        borderRadius: 24,
        boxShadow: "0 6px 32px rgba(45,76,42,0.08)",
        padding: 40,
        maxWidth: 480,
        width: "100%",
        textAlign: "center",
        border: "2px solid #bfa76a"
      }}>
        <Image src="/dos-agrolink-logo.png" alt="DOS Agrolink Nigeria Logo" width={96} height={96} style={{ borderRadius: 16, background: '#fff', marginBottom: 16 }} />
        <h1 style={{ color: "#2d4c2a", fontWeight: 800, fontSize: 32, marginBottom: 8, letterSpacing: 1 }}>DOS Agrolink Nigeria</h1>
        <div style={{ color: "#7a5c2e", fontSize: 18, marginBottom: 18 }}>Empowering Nigerian Agriculture</div>
        <p style={{ color: "#2d4c2a", fontSize: 16, marginBottom: 24 }}>
          Welcome to the leading platform for agricultural commerce, farmer empowerment, and digital marketplace solutions in Nigeria.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <Link href="/marketplace" style={{ background: "#2d4c2a", color: "#fff", padding: "12px 0", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 16 }}>Visit Marketplace</Link>
          <Link href="/wallet" style={{ background: "#bfa76a", color: "#2d4c2a", padding: "12px 0", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 16 }}>My Wallet</Link>
          <Link href="/farmer/subscription" style={{ background: "#fff", color: "#2d4c2a", border: "2px solid #bfa76a", padding: "12px 0", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 16 }}>Farmer Subscription</Link>
        </div>
        <div style={{ color: "#7a5c2e", fontSize: 13, marginTop: 12 }}>
          Need help? <Link href="/contact" style={{ color: "#2d4c2a", textDecoration: "underline" }}>Contact Support</Link>
        </div>
      </div>
    </main>
  );
}

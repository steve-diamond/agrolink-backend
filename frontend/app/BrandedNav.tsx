import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/wallet", label: "Wallet" },
  { href: "/admin", label: "Admin" },
  { href: "/farmer/subscription", label: "Subscription" },
];

export default function BrandedNav() {
  return (
    <nav style={{
      background: "#2d4c2a",
      color: "#fff",
      padding: "12px 0",
      borderBottom: "4px solid #bfa76a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 32,
      fontWeight: 600,
      fontSize: 16,
      letterSpacing: 1
    }}>
      <Image src="/dos-agrolink-logo.png" alt="DOS Agrolink Nigeria Logo" width={36} height={36} style={{ borderRadius: 6, background: '#fff', marginRight: 16 }} />
      {navLinks.map(link => (
        <Link key={link.href} href={link.href} style={{ color: "#fff", textDecoration: "none", margin: "0 12px" }}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

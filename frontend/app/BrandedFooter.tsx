import Image from "next/image";

export default function BrandedFooter() {
  return (
    <footer style={{
      background: "#2d4c2a",
      color: "#fff",
      padding: "32px 0 16px 0",
      marginTop: 40,
      borderTop: "4px solid #bfa76a",
      textAlign: "center"
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Image src="/dos-agrolink-logo.png" alt="DOS Agrolink Nigeria Logo" width={48} height={48} style={{ borderRadius: 8, background: '#fff' }} />
        <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>DOS Agrolink Nigeria</div>
        <div style={{ fontSize: 14, color: "#e6d7b0", marginBottom: 8 }}>Empowering Nigerian Agriculture</div>
        <div style={{ fontSize: 13, color: "#bfa76a" }}>
          &copy; {new Date().getFullYear()} DOS Agrolink Nigeria. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

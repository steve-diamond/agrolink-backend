import "./admin/page.module.css";
import BrandedNav from "./BrandedNav";
import BrandedFooter from "./BrandedFooter";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="page">
        <BrandedNav />
        <div style={{ minHeight: "80vh" }}>{children}</div>
        <BrandedFooter />
      </body>
    </html>
  );
}

import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer>
      <span>PLOT-LV © 2026 · Design tools for building services</span>
      <span className="footer-links">
        <Link href="/cctv-field-of-view-calculator">CCTV field of view calculator</Link>
        <Link href="/cctv-cameras">Camera library</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/#contact">Contact</Link>
      </span>
      <span>FOV (preview) · FLAME (not on sale) · LUX (in development)</span>
    </footer>
  );
}

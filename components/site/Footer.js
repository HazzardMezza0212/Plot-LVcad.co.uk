"use client";

import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/site";
import { COMPANY_LINE } from "@/lib/legal";

export default function Footer() {
  return (
    <footer className="foot">
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/site/plv-icon.png" alt="" width={24} height={24} />
        © 2026 Plot-LV · Design tools for building services
      </span>
      <nav aria-label="Footer">
        <Link href="/cctv-cameras">Camera library</Link>
        <Link href="/getting-started">Getting started</Link>
        <Link href="/legal#privacy">Privacy</Link>
        <Link href="/legal#terms">Terms</Link>
        <Link href="/legal#cookies">Cookies</Link>
        <button type="button" className="linkbtn" onClick={() => window.dispatchEvent(new Event("plv:open-consent"))}>
          Cookie settings
        </button>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </nav>
      <p className="co">{COMPANY_LINE}</p>
    </footer>
  );
}

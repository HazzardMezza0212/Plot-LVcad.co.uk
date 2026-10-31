"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import OpenPlanner from "./OpenPlanner";

// Supabase keeps the session in a cookie named sb-<project>-auth-token
// (sometimes split into .0/.1 chunks). Checking for it lets the header show
// "Your account" without loading the Supabase client on marketing pages.
function hasSessionCookie() {
  return /(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=/.test(document.cookie);
}

const LINKS = [
  ["Product", "/#features"],
  ["Camera library", "/cctv-cameras"],
  ["Getting started", "/getting-started"],
  ["Pricing", "/#pricing"],
];

export default function Header() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  // Reading document.cookie has to wait until the page is in the browser.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSignedIn(hasSessionCookie()), []);

  return (
    <header className="nav">
      <Link className="brand" href="/">
        <img src="/site/plv-icon.png" alt="" width={40} height={40} />
        <span className="disp">Plot-LV</span>
      </Link>
      <nav className="links" aria-label="Main">
        {LINKS.map(([label, href]) => (
          <Link
            key={href}
            className="t"
            href={href}
            aria-current={!href.includes("#") && pathname.startsWith(href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
        <Link className="t" href={signedIn ? "/account" : "/login"}>
          {signedIn ? "Your account" : "Log in"}
        </Link>
        <OpenPlanner small label="Open planner" />
      </nav>
    </header>
  );
}

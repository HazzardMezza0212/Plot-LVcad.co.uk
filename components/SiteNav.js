"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Supabase keeps the session in a cookie named sb-<project>-auth-token
// (sometimes split into .0/.1 chunks). Checking for it lets the nav show
// "Your account" without loading the Supabase client on marketing pages.
// If the session has expired, /account sends the visitor to /login anyway.
function hasSessionCookie() {
  return /(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=/.test(document.cookie);
}

export default function SiteNav({ tag, links = [] }) {
  const [signedIn, setSignedIn] = useState(false);
  // Reading document.cookie has to wait until the page is in the browser.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSignedIn(hasSessionCookie()), []);

  return (
    <nav>
      <Link href="/" className="logo">
        PLOT-LV {tag && <span className="tag">{tag}</span>}
      </Link>
      <div className="nav-links">
        {links.map(([label, href]) =>
          href.startsWith("#") ? (
            <a key={href} href={href}>{label}</a>
          ) : (
            <Link key={href} href={href}>{label}</Link>
          )
        )}
      </div>
      <div className="nav-right">
        {signedIn ? (
          <Link href="/account" className="nav-cta">
            Your account →
          </Link>
        ) : (
          <>
            <Link href="/login" className="nav-login">
              Log in
            </Link>
            <Link href="/signup" className="nav-cta">
              Create account
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

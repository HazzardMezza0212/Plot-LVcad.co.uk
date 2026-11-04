"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { readConsent, saveConsent, startAnalytics, stopAnalytics } from "@/lib/posthog";

// Asks before any analytics run. "Reject all" and "Accept all" carry equal
// weight, as the ICO expects. "Cookie settings" in the footer reopens it by
// dispatching the "plv:open-consent" event.
export const OPEN_CONSENT_EVENT = "plv:open-consent";

export default function ConsentBanner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const saved = readConsent();
    // Reading localStorage has to wait until the page is in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!saved) setOpen(true);
    else setAnalytics(saved.analytics === true);

    function reopen() {
      setReopened(true);
      setManage(true);
      setOpen(true);
    }
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!open) return null;

  function choose(on) {
    saveConsent(on);
    setAnalytics(on);
    if (on) startAnalytics();
    else stopAnalytics();
    setOpen(false);
    setManage(false);
  }

  // The home page plays a short intro first; wait for it before sliding in.
  const delayed = pathname === "/" && !reopened;

  return (
    <div className={`v2-ck${delayed ? " delay" : ""}`} role="dialog" aria-modal="false" aria-labelledby="ck-title">
      <h2 id="ck-title">Your privacy choices</h2>
      <p>
        We&apos;d like to count visits and clicks so we can see which pages help. It&apos;s off unless you say
        yes, and your floor plans never leave your device either way.{" "}
        <a href="/legal#cookies">Cookie policy</a>
      </p>
      {manage && (
        <>
          <div className="ckrow">
            <span>
              <b>Essential</b>
              <br />
              <small>Sign-in, and remembering this choice.</small>
            </span>
            <span style={{ fontSize: 12, color: "#14653F" }}>Always on</span>
          </div>
          <div className="ckrow">
            <span>
              <b>Analytics</b>
              <br />
              <small>Anonymous page and click stats (PostHog).</small>
            </span>
            <button
              type="button"
              role="switch"
              className="sw"
              aria-checked={analytics}
              aria-label="Analytics"
              onClick={() => setAnalytics((v) => !v)}
            >
              <i />
            </button>
          </div>
        </>
      )}
      <div className="ckbtns">
        <button type="button" className="g" onClick={() => choose(false)}>
          Reject all
        </button>
        {manage ? (
          <button type="button" className="g" onClick={() => choose(analytics)}>
            Save choices
          </button>
        ) : (
          <button type="button" className="g" onClick={() => setManage(true)}>
            Manage
          </button>
        )}
        <button type="button" className="p" onClick={() => choose(true)}>
          Accept all
        </button>
      </div>
    </div>
  );
}

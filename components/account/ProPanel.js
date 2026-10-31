"use client";

import { useState } from "react";
import Link from "next/link";
import { PRO_PLANS } from "@/lib/plans";

// FOV Pro on the account page.
// Not Pro: choose monthly/yearly, tick the two required boxes, go to Stripe.
// Pro: show the plan and renewal, and open Stripe's billing page to cancel,
// change plan, update the card or download invoices.
export default function ProPanel({ pro, open, initialPlan = "yearly", sub, missing = [], vatNote }) {
  const [plan, setPlan] = useState(initialPlan === "monthly" ? "monthly" : "yearly");
  const [startNow, setStartNow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function post(url, body) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setError(data.error || "Something went wrong. Please try again.");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  if (pro) {
    return (
      <div className="pro-panel">
        <p className="pp-desc" style={{ margin: 0 }}>
          <b>FOV Pro{sub?.plan ? ` · ${sub.plan === "year" ? "Yearly" : "Monthly"}` : ""}</b>
          <br />
          {sub?.cancelAtPeriodEnd
            ? `Cancelled. Pro stays on until ${sub.periodEnd}, then your account moves to Free. No further payments.`
            : sub?.periodEnd
              ? `Renews on ${sub.periodEnd}${sub.amount ? ` for ${sub.amount}` : ""}.${sub.plan === "year" ? " We'll email you before it renews." : ""}`
              : "Active."}
        </p>
        {sub ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <button type="button" className="gbtn" disabled={busy} onClick={() => post("/api/pro/portal")}>
              {busy ? "Opening…" : "Plan & billing: cancel, change card, invoices"}
            </button>
          </div>
        ) : (
          <p className="small">Pro was added to your account by hand, so there&apos;s no billing to manage.</p>
        )}
        {error && <p className="err" role="alert">{error}</p>}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="pro-panel">
        <p className="pp-desc" style={{ margin: 0 }}>
          FOV Pro is coming soon: DXF import, walls from your CAD layer, pixel density per camera, coverage per room and
          a PDF report. <Link href="/#pricing" className="inline-a">Get told when it launches</Link>.
        </p>
        {missing.length > 0 && (
          <p className="small mono">Preview only — missing settings: {missing.join(", ")}</p>
        )}
      </div>
    );
  }

  const p = PRO_PLANS[plan];
  return (
    <div className="pro-panel">
      <div className="bill" role="group" aria-label="Billing period">
        <button type="button" aria-pressed={plan === "monthly"} onClick={() => setPlan("monthly")}>Monthly · £19</button>
        <button type="button" aria-pressed={plan === "yearly"} onClick={() => setPlan("yearly")}>Yearly · £199</button>
      </div>
      <div className="price">{p.label}<small> / {p.per}</small></div>
      <p className="small" style={{ marginTop: 2 }}>{p.note} {vatNote}</p>

      <label className="chk">
        <input type="checkbox" checked={startNow} onChange={(e) => setStartNow(e.target.checked)} />
        <span>
          Start Pro now. I understand that if I cancel within 14 days, I&apos;ll pay for the days I&apos;ve already used.{" "}
          <Link href="/legal#pro" target="_blank">Cancellation rights</Link>
        </span>
      </label>
      <label className="chk">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          I agree to the <Link href="/legal#terms" target="_blank">Terms of use</Link>, including automatic renewal every{" "}
          {plan === "yearly" ? "year" : "month"} until I cancel.
        </span>
      </label>

      <button
        type="button"
        className="pbtn"
        disabled={!startNow || !agree || busy}
        onClick={() => post("/api/pro/checkout", { plan, startNow, agreeTerms: agree })}
      >
        {busy ? "Opening secure payment…" : "Continue to secure payment →"}
      </button>
      <p className="small" style={{ textAlign: "center" }}>
        Payment by Stripe. We never see your card. Cancel any time from this page.
      </p>
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}

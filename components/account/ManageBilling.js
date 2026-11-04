"use client";

import { useState } from "react";

// Sends the signed-in user to the Stripe Billing Portal to change or cancel their plan.
export default function ManageBilling() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Could not open billing.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err.message || "Could not open billing.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn-secondary small" onClick={openPortal} disabled={busy}>
        {busy ? "Opening…" : "Manage subscription"}
      </button>
      {error && <p className="pp-desc small-note" role="alert">{error}</p>}
    </div>
  );
}

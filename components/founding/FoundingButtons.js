"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

async function postAndGo(url, setState, setError, onFail) {
  setState("busy");
  setError("");
  try {
    const res = await fetch(url, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      window.location.assign(data.url);
      return;
    }
    if (onFail && onFail(res.status, data)) return;
    throw new Error(data.error || "Something went wrong. Please try again.");
  } catch (err) {
    setError(err.message);
    setState("idle");
  }
}

// "Become a Founding member": asks the server for a Stripe Checkout page and
// goes there. Sends nothing about price; the server decides everything.
export function FoundingCheckoutButton({ label = "Become a Founding member" }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  function start() {
    track("founding_checkout_started", {}, { beforeLeaving: true });
    postAndGo("/api/founding/checkout", setState, setError, (status, data) => {
      if (status === 401 || data.login) {
        window.location.assign("/login?next=/founding");
        return true;
      }
      if (data.full || data.member) {
        window.location.reload();
        return true;
      }
      return false;
    });
  }

  return (
    <div className="founding-cta">
      <button type="button" className="btn-primary" onClick={start} disabled={state === "busy"}>
        {state === "busy" ? "Opening secure payment…" : label}
      </button>
      {error && <p className="error-msg" role="alert">{error}</p>}
    </div>
  );
}

// "Manage billing": opens Stripe's billing page (card, invoices, cancel).
export function ManageBillingButton({ className = "btn-secondary small" }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  return (
    <div>
      <button type="button" className={className} onClick={() => postAndGo("/api/founding/portal", setState, setError)} disabled={state === "busy"}>
        {state === "busy" ? "Opening…" : "Manage billing & invoices"}
      </button>
      {error && <p className="error-msg" role="alert">{error}</p>}
    </div>
  );
}

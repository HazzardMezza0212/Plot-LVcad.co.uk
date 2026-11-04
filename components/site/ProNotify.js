"use client";

import { useRef, useState } from "react";
import Turnstile from "@/components/Turnstile";
import { track } from "@/lib/analytics";

// "Tell me when Pro launches": joins the FOV Pro early-access list
// (POST /api/early-access, saved privately in Supabase).
export default function ProNotify() {
  const [email, setEmail] = useState("");
  const [updates, setUpdates] = useState(false);
  const [token, setToken] = useState("");
  const [state, setState] = useState("idle"); // idle | busy | done | error
  const [error, setError] = useState("");
  const captcha = useRef(null);

  async function submit(e) {
    e.preventDefault();
    setState("busy");
    setError("");
    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, updates, source: "landing", turnstileToken: token, company: e.target.company?.value || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't add you just now. Please try again.");
      track("pro_notify_joined", { updates });
      setState("done");
    } catch (err) {
      setError(err.message);
      setState("error");
      captcha.current?.reset();
    }
  }

  if (state === "done") {
    return (
      <div className="notify-done" role="status">
        <b>You&apos;re on the list.</b> We&apos;ll email you once when FOV Pro opens.
      </div>
    );
  }

  return (
    <form className="notify" onSubmit={submit}>
      <label className="sr" htmlFor="pro-email">Work email</label>
      <div className="notify-row">
        <input id="pro-email" type="email" required placeholder="you@company.co.uk" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="btn btn-o" disabled={state === "busy"}>
          {state === "busy" ? "Adding…" : "Tell me when it launches"}
        </button>
      </div>
      <input type="text" name="company" className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="notify-chk">
        <input type="checkbox" checked={updates} onChange={(e) => setUpdates(e.target.checked)} />
        <span>Also email me other Plot-LV product updates (optional).</span>
      </label>
      <Turnstile ref={captcha} onToken={setToken} />
      {error && <p className="notify-err" role="alert">{error}</p>}
      <p className="notify-small">One email when Pro opens. <a href="/legal#privacy">Privacy notice</a></p>
    </form>
  );
}

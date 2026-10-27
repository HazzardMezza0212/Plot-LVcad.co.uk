"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import Turnstile, { TURNSTILE_SITE_KEY } from "./Turnstile";

// FOV Pro early access signup on the landing page. Posts to /api/early-access.
const ROLES = ["Installer", "Consultant / designer", "Integrator", "End user / facilities", "Other"];

export default function ProEarlyAccess() {
  const [state, setState] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const captcha = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !token) {
      setError("Please complete the check below first.");
      return;
    }
    setState("sending");
    setError("");
    const f = new FormData(e.target);
    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          role: f.get("role"),
          wants: f.get("wants"),
          updates: f.get("updates") === "on",
          company: f.get("extra_info"),
          source: "landing",
          turnstileToken: token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      track("pro_signup_completed", { source: "landing", role: f.get("role") || "" });
      setState("done");
    } catch (err) {
      setError(err.message);
      setState("idle");
      captcha.current?.reset();
    }
  }

  return (
    <section className="pro-access" id="pro">
      <div className="pro-inner">
        <div className="pro-copy">
          <div className="ptag mono">FOV Pro · coming soon</div>
          <h2 className="display">Pro is for real jobs</h2>
          <p>
            The free version handles image and PDF plans. Pro adds the parts that
            save time on every project:
          </p>
          <ul className="pro-list">
            <li>CAD import: open DXF drawings with sharp lines and layers, scale set automatically</li>
            <li>Walls taken straight from your CAD wall layer, no tracing</li>
            <li>A coverage report to hand to your client</li>
            <li>Pixel density and DORI calculations per camera, no camera limits</li>
          </ul>
          <p className="pro-note">Early members get a founding price and a say in what gets built first.</p>
        </div>

        {state === "done" ? (
          <div className="pro-done" role="status">
            <p className="mono pro-done-tag">● YOU&apos;RE ON THE LIST</p>
            <h3>Thanks, you&apos;re in.</h3>
            <p>I&apos;ll be in touch personally before Pro opens, with the founding price.</p>
          </div>
        ) : (
          <form className="pro-form" onSubmit={onSubmit}>
            <input type="text" name="extra_info" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
            <label htmlFor="pro-name">Name</label>
            <input id="pro-name" name="name" autoComplete="name" maxLength={120} />
            <label htmlFor="pro-email">Work email</label>
            <input id="pro-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" />
            <label htmlFor="pro-role">What do you do?</label>
            <select id="pro-role" name="role" defaultValue="">
              <option value="">Choose one</option>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <label htmlFor="pro-wants">What would make FOV worth paying for? <span className="opt">(optional)</span></label>
            <textarea id="pro-wants" name="wants" rows={3} maxLength={1000} placeholder="e.g. DWG import, a client report, cable lengths…" />
            <label className="pro-check" htmlFor="pro-updates">
              <input id="pro-updates" name="updates" type="checkbox" /> Also email me Plot-LV product updates
            </label>
            <Turnstile ref={captcha} onToken={setToken} />
            <button className="btn-primary" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Joining…" : "Join early access"}
            </button>
            {error && <p className="error-msg" role="alert">{error}</p>}
            <p className="form-privacy">
              I&apos;ll only use this to contact you about FOV Pro early access. <Link href="/privacy">Privacy notice</Link>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

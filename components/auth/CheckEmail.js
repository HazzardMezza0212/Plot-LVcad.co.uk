"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { friendlyError } from "./fields";

// "Check your inbox" state shown after sign-up (when Supabase requires email
// confirmation) and after a password-reset request.
export default function CheckEmail({ email, kind, onBack }) {
  const [cooldown, setCooldown] = useState(30);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (cooldown > 0) return;
    setCooldown(30); // start the wait straight away so a double-click sends one email
    const supabase = getBrowserClient();
    setMessage("");
    const origin = window.location.origin;
    const { error } =
      kind === "signup"
        ? await supabase.auth.resend({
            type: "signup",
            email,
            options: { emailRedirectTo: `${origin}/auth/confirm?next=%2Faccount%3Fwelcome%3D1` },
          })
        : await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/confirm?next=/account/password`,
          });
    setMessage(error ? friendlyError(error) : "Sent again. It can take a minute to arrive.");
  }

  return (
    <div className="check-email">
      <div className="envelope" aria-hidden="true">
        <svg viewBox="0 0 64 48">
          <rect className="env-body" x="2" y="6" width="60" height="40" rx="4" />
          <path className="env-flap" d="M4 9 L32 30 L60 9" />
        </svg>
        <span className="env-ping" />
      </div>
      <h2 className="display">Check your inbox</h2>
      <p>
        {kind === "signup"
          ? "We've sent a confirmation link to "
          : "If there's an account for that address, we've sent a reset link to "}
        <strong>{email}</strong>.{" "}
        {kind === "signup"
          ? "Open it in this browser to finish setting up your account."
          : "Open it in this browser to choose a new password."}
      </p>
      <div className="check-actions">
        <button type="button" className="btn-secondary" onClick={resend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
        </button>
        <button type="button" className="btn-ghost" onClick={onBack}>
          Use a different email
        </button>
      </div>
      {message && <p className="check-msg mono">{message}</p>}
      <p className="check-tip">Not there? Check your spam folder.</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase/client";
import { TextField, PasswordField, SubmitButton, Notice, friendlyError } from "./fields";
import { track } from "@/lib/analytics";

export default function LoginForm({ next }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [unconfirmed, setUnconfirmed] = useState("");
  const [resent, setResent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const supabase = getBrowserClient();
    const email = String(new FormData(e.target).get("email")).trim();
    setError("");
    setUnconfirmed("");
    setState("loading");

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(friendlyError(err));
      if ((err.message || "").toLowerCase().includes("not confirmed")) setUnconfirmed(email);
      setState("idle");
      return;
    }
    setState("done");
    track("login_completed", { going_to_tool: next.startsWith("/cctv") }, { beforeLeaving: true });
    // Full navigation so the server sees the new session cookie straight away.
    setTimeout(() => window.location.assign(next), 650);
  }

  async function resendConfirmation() {
    if (resent) return;
    setResent(true); // hide the link straight away so a double-click sends one email
    const supabase = getBrowserClient();
    await supabase.auth.resend({
      type: "signup",
      email: unconfirmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Faccount%3Fwelcome%3D1` },
    });
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <TextField id="email" label="Email" type="email" autoComplete="email" required autoFocus />
      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="auth-row">
        <Link href="/forgot" className="auth-link">Forgot password?</Link>
      </div>
      {error && (
        <Notice tone="error">
          {error}
          {unconfirmed && !resent && (
            <>
              {" "}
              <button type="button" className="inline-link" onClick={resendConfirmation}>
                Resend the link
              </button>
            </>
          )}
          {resent && " A new link is on its way."}
        </Notice>
      )}
      <SubmitButton state={state} idle="Log in" loading="Checking…" done="Signed in" />
      <p className="auth-alt">
        New to Plot-LV? <Link href="/signup">Create a free account</Link>
      </p>
    </form>
  );
}

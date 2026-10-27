"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase/client";
import { TextField, PasswordField, SubmitButton, Notice, friendlyError } from "./fields";
import { track } from "@/lib/analytics";
import Turnstile, { TURNSTILE_SITE_KEY } from "@/components/Turnstile";

export default function LoginForm({ next }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [unconfirmed, setUnconfirmed] = useState("");
  const [resent, setResent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captcha = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    const supabase = getBrowserClient();
    const email = String(new FormData(e.target).get("email")).trim();
    setError("");
    setUnconfirmed("");
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the check below first.");
      return;
    }
    setState("loading");

    const { error: err } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: captchaToken || undefined } });
    if (err) {
      captcha.current?.reset();
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
    const supabase = getBrowserClient();
    await supabase.auth.resend({
      type: "signup",
      email: unconfirmed,
      options: { captchaToken: captchaToken || undefined, emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Faccount%3Fwelcome%3D1` },
    });
    setResent(true);
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
      <Turnstile ref={captcha} onToken={setCaptchaToken} />
      <SubmitButton state={state} idle="Log in" loading="Checking…" done="Signed in" />
      <p className="auth-alt">
        New to Plot-LV? <Link href="/signup">Create a free account</Link>
      </p>
    </form>
  );
}

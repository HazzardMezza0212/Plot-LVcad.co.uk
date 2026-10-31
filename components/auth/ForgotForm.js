"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase/client";
import { TextField, SubmitButton, Notice, friendlyError } from "./fields";
import CheckEmail from "./CheckEmail";
import Turnstile, { TURNSTILE_SITE_KEY } from "@/components/Turnstile";

export default function ForgotForm() {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captcha = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    const supabase = getBrowserClient();
    const email = String(new FormData(e.target).get("email")).trim();
    setError("");
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the check below first.");
      return;
    }
    setState("loading");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/account/password`,
      captchaToken: captchaToken || undefined,
    });
    captcha.current?.reset();
    if (err) {
      setError(friendlyError(err));
      setState("idle");
      return;
    }
    setSentTo(email);
  }

  if (sentTo) {
    return <CheckEmail email={sentTo} kind="reset" onBack={() => { setSentTo(""); setState("idle"); }} />;
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <TextField id="email" label="Email" type="email" autoComplete="email" required autoFocus />
      {error && <Notice tone="error">{error}</Notice>}
      <Turnstile ref={captcha} onToken={setCaptchaToken} />
      <SubmitButton state={state} idle="Send reset link" loading="Sending…" done="Sent" />
      <p className="auth-alt">
        Remembered it? <Link href="/login">Back to log in</Link>
      </p>
    </form>
  );
}

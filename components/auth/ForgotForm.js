"use client";

import { useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase/client";
import { TextField, SubmitButton, Notice, friendlyError } from "./fields";
import CheckEmail from "./CheckEmail";

export default function ForgotForm() {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const supabase = getBrowserClient();
    const email = String(new FormData(e.target).get("email")).trim();
    setError("");
    setState("loading");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/account/password`,
    });
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
      <SubmitButton state={state} idle="Send reset link" loading="Sending…" done="Sent" />
      <p className="auth-alt">
        Remembered it? <Link href="/login">Back to log in</Link>
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase/client";
import { PasswordField, SubmitButton, Notice, friendlyError } from "./fields";

export default function NewPasswordForm() {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setError("");
    setState("loading");
    const { error: err } = await getBrowserClient().auth.updateUser({ password });
    if (err) {
      setError(friendlyError(err));
      setState("idle");
      return;
    }
    setState("done");
    setTimeout(() => window.location.assign("/account?password=1"), 800);
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <PasswordField
        id="password"
        label="New password"
        autoComplete="new-password"
        required
        minLength={8}
        showStrength
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordField
        id="confirm"
        label="Confirm new password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && <Notice tone="error">{error}</Notice>}
      <SubmitButton state={state} idle="Save new password" loading="Saving…" done="Password saved" />
      <p className="auth-alt">
        <Link href="/account">Back to your account</Link>
      </p>
    </form>
  );
}

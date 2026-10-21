"use client";

import { useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase/client";
import { TextField, PasswordField, SubmitButton, Notice, friendlyError } from "./fields";
import CheckEmail from "./CheckEmail";

export default function SignupForm() {
  const [state, setState] = useState("idle"); // idle | loading | done
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [sentTo, setSentTo] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const supabase = getBrowserClient();
    const form = new FormData(e.target);
    const email = String(form.get("email")).trim();
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setError("");
    setState("loading");

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: String(form.get("name")).trim(),
          company: String(form.get("company") || "").trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Faccount%3Fwelcome%3D1`,
      },
    });

    if (err) {
      setError(friendlyError(err));
      setState("idle");
      return;
    }

    if (data.session) {
      // Email confirmation is off in Supabase: signed in straight away.
      setState("done");
      setTimeout(() => window.location.assign("/account?welcome=1"), 900);
    } else {
      // Email confirmation is on: ask them to click the link.
      setSentTo(email);
    }
  }

  if (sentTo) {
    return <CheckEmail email={sentTo} kind="signup" onBack={() => { setSentTo(""); setState("idle"); }} />;
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate={false}>
      <TextField id="name" label="Full name" autoComplete="name" required autoFocus />
      <TextField id="email" label="Work email" type="email" autoComplete="email" required />
      <TextField id="company" label="Company" hint="optional" autoComplete="organization" />
      <PasswordField
        id="password"
        label="Password"
        autoComplete="new-password"
        required
        minLength={8}
        showStrength
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <Notice tone="error">{error}</Notice>}
      <SubmitButton
        state={state}
        idle="Create account"
        loading="Creating your account…"
        done="Account created"
      />
      <p className="auth-alt">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}

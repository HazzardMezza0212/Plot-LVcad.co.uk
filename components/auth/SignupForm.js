"use client";

import { useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase/client";
import { TextField, PasswordField, Checkbox, SubmitButton, Notice, friendlyError } from "./fields";
import { MARKETING_WORDING, TERMS_VERSION, PRIVACY_VERSION } from "@/lib/legal";
import CheckEmail from "./CheckEmail";
import { track } from "@/lib/analytics";

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
    if (!form.get("terms")) {
      setError("Please agree to the terms of use to create an account.");
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
          // Only an explicit tick counts as consent. The database records
          // this choice, with the wording shown, in the consent log.
          marketing_opt_in: form.get("marketing") === "on",
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Faccount%3Fwelcome%3D1`,
      },
    });

    if (err) {
      setError(friendlyError(err));
      setState("idle");
      return;
    }

    // Supabase answers a sign-up for an email that already has an account
    // with a user that has no identities, and sends no email (so it doesn't
    // reveal which addresses are registered). Say so, instead of showing
    // "check your inbox" for an email that will never arrive.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError("There's already an account for this email. Log in, or use “Forgot password” to reset it.");
      setState("idle");
      return;
    }

    track("signup_completed", { marketing_opt_in: form.get("marketing") === "on" }, { beforeLeaving: Boolean(data.session) });

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
      <div className="consent-group">
        <Checkbox id="marketing">{MARKETING_WORDING}</Checkbox>
        <Checkbox id="terms" required>
          I agree to the{" "}
          <Link href="/terms" target="_blank">terms of use</Link>{" "}
          and have read the{" "}
          <Link href="/privacy" target="_blank">privacy notice</Link>.
        </Checkbox>
      </div>
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

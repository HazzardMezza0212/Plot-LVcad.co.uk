"use client";

import { useState } from "react";

export function TextField({ id, label, hint, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </label>
      <input id={id} name={id} {...props} />
    </div>
  );
}

// Password input with a show/hide toggle and an optional strength meter.
export function PasswordField({ id, label, showStrength = false, value, onChange, ...props }) {
  const [visible, setVisible] = useState(false);
  const score = passwordScore(value || "");
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw-wrap">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          {...props}
        />
        <button
          type="button"
          className="pw-toggle mono"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {showStrength && (
        <div className={`pw-meter s${score.level}`} aria-live="polite">
          <div className="pw-bars">
            <i /><i /><i /><i />
          </div>
          <span className="mono">{value ? score.label : "At least 8 characters"}</span>
        </div>
      )}
    </div>
  );
}

export function passwordScore(pw) {
  if (!pw) return { level: 0, label: "" };
  if (pw.length < 8) return { level: 1, label: "Too short" };
  let level = 2;
  if (pw.length >= 12) level++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) level++;
  return { level, label: ["", "Too short", "Okay", "Good", "Strong"][level] };
}

// Submit button with idle / loading / done states.
export function SubmitButton({ state, idle, loading, done, disabled }) {
  return (
    <button
      type="submit"
      className={`submit-btn auth-submit ${state}`}
      disabled={disabled || state === "loading" || state === "done"}
    >
      {state === "loading" && <span className="spinner" aria-hidden="true" />}
      {state === "done" && (
        <svg className="tick" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      )}
      <span>{state === "loading" ? loading : state === "done" ? done : idle}</span>
    </button>
  );
}

export function Notice({ tone = "info", children }) {
  return <div className={`auth-notice ${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

// Friendlier wording for Supabase auth errors.
export function friendlyError(error) {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "That email and password don't match. Check them and try again.";
  if (msg.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the link we sent.";
  if (msg.includes("already registered") || msg.includes("already exists")) return "There's already an account with that email. Try logging in instead.";
  if (msg.includes("rate limit") || msg.includes("too many") || error?.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  if (msg.includes("password") && (msg.includes("least") || msg.includes("weak") || msg.includes("short"))) return "That password is too weak. Use at least 8 characters with a mix of letters and numbers.";
  if (msg.includes("same password") || msg.includes("different from the old")) return "Your new password must be different from your current one.";
  if (msg.includes("fetch") || msg.includes("network")) return "Couldn't reach the server. Check your connection and try again.";
  return error?.message || "Something went wrong. Please try again.";
}

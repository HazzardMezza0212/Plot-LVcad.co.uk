"use client";

import { useState } from "react";
import { MARKETING_WORDING } from "@/lib/legal";

function formatDate(iso) {
  return iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
}

// Switch for product-update emails. Saves through /api/account/email-preferences,
// which logs the change and updates the mailing list.
export default function EmailPreferences({ initialOptIn, updatedAt }) {
  const [optIn, setOptIn] = useState(initialOptIn);
  const [changedAt, setChangedAt] = useState(updatedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !optIn;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/account/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optIn: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOptIn(next);
      setChangedAt(data.updatedAt);
    } catch (err) {
      setError(err.message || "Couldn't save your choice. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pref">
      <div className="pref-row">
        <div>
          <div className="pref-title">Product updates by email</div>
          <p className="pref-desc">{MARKETING_WORDING}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={optIn}
          aria-label="Product updates by email"
          className={`switch${optIn ? " on" : ""}`}
          onClick={toggle}
          disabled={saving}
        >
          <span className="knob" />
        </button>
      </div>
      <p className="pref-meta mono">
        {saving
          ? "Saving…"
          : `${optIn ? "On" : "Off"}${changedAt ? ` · changed ${formatDate(changedAt)}` : ""}`}
      </p>
      {error && <p className="error-msg">{error}</p>}
      <p className="pref-note">
        Account and security emails (like password resets) are always sent.
      </p>
    </div>
  );
}

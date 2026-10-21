"use client";

import { useState } from "react";

// "Download my data" and "Delete my account".
export default function DataControls() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function deleteAccount(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.assign("/?deleted=1");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="data-controls">
      <a className="btn-secondary small" href="/api/account/export" download>
        Download my data
      </a>
      {!confirming ? (
        <button type="button" className="danger-link" onClick={() => setConfirming(true)}>
          Delete my account
        </button>
      ) : (
        <form className="delete-confirm" onSubmit={deleteAccount}>
          <p>
            This permanently deletes your account, your email preferences and
            your consent history, and removes you from our mailing list. It
            can&apos;t be undone. Your FOV project files on your computer are
            not affected.
          </p>
          <label htmlFor="delete-typed" className="mono">Type DELETE to confirm</label>
          <input
            id="delete-typed"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoFocus
          />
          <div className="delete-actions">
            <button type="submit" className="danger-btn" disabled={typed !== "DELETE" || busy}>
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
            <button type="button" className="btn-ghost small" onClick={() => { setConfirming(false); setTyped(""); setError(""); }}>
              Cancel
            </button>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </form>
      )}
    </div>
  );
}

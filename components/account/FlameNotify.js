"use client";

import { useState } from "react";

// One-click "notify me" for Flame, using the account's own email.
export default function FlameNotify({ email, name }) {
  const [state, setState] = useState("idle");
  async function notify() {
    setState("loading");
    const res = await fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    }).catch(() => null);
    setState(res?.ok ? "done" : "error");
  }
  if (state === "done") {
    return <p className="notify-done mono">● You&apos;ll get an email when Flame opens</p>;
  }
  return (
    <>
      <button type="button" className="btn-secondary small" onClick={notify} disabled={state === "loading"}>
        {state === "loading" ? "Adding you…" : "Notify me when it opens"}
      </button>
      {state === "error" && <p className="error-msg">Couldn&apos;t add you just now. Try again later.</p>}
    </>
  );
}

"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

// "Launch FOV": a red ring grows from the button and fills the screen, then
// the browser goes to /cctv, where the tool's own loading screen picks up on
// the same white background. The overlay is portalled to <body> so no
// card styling (overflow, transforms) can clip it.
export default function LaunchButton({
  label = "Launch FOV",
  className = "btn-primary launch-btn",
  href = "/cctv",
  icon = true,
}) {
  const [origin, setOrigin] = useState(null);

  function launch(e) {
    if (origin) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => window.location.assign(href), reduce ? 50 : 820);
  }

  return (
    <>
      <button type="button" className={className} onClick={launch} disabled={Boolean(origin)}>
        {icon && (
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
        {origin ? "Opening…" : label}
      </button>
      {origin && createPortal(
        <div className="launch-overlay" style={{ "--lx": `${origin.x}px`, "--ly": `${origin.y}px` }} aria-hidden="true">
          <span className="launch-ring" />
          <span className="launch-fill" />
          <span className="launch-text mono">PLOT-LV · FOV</span>
        </div>,
        document.body
      )}
    </>
  );
}

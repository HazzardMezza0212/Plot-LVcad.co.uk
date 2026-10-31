"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { track } from "@/lib/analytics";

// "Open the planner": shows a short loading card, then goes to /guest, which
// lets the browser into the free planner at /cctv without an account (it sets
// a small guest cookie). Pass `camera` to ask the planner to start with that
// model (the planner reads ?camera=<slug> once that is supported there).
export default function OpenPlanner({ label = "Open the planner — free", small = false, ghost = false, accent = false, large = false, camera, arrow = false }) {
  const [opening, setOpening] = useState(false);

  function go() {
    if (opening) return;
    setOpening(true);
    const href = camera ? `/guest?camera=${encodeURIComponent(camera)}` : "/guest";
    track("launch_clicked", { mode: "guest", camera: camera || null }, { beforeLeaving: true });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => window.location.assign(href), reduce ? 50 : 1150);
  }

  const cls = `btn ${ghost ? "btn-g" : accent ? "btn-o glow" : "btn-p"}${small ? " sm" : ""}${large ? " lg" : ""}`;
  return (
    <>
      <button type="button" className={cls} onClick={go} disabled={opening}>
        {!ghost && !accent && <span className="in" />}
        {label}
        {arrow && <span className="ar" aria-hidden="true">→</span>}
      </button>
      {opening &&
        createPortal(
          <div className="v2-launch" role="status" aria-live="polite">
            <div className="lbox">
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <img src="/site/plv-icon.png" alt="" width={44} height={44} />
                <div>
                  <div style={{ fontFamily: '"Bricolage Grotesque Variable",sans-serif', fontSize: 22, fontWeight: 600 }}>
                    Opening Plot-LV FOV
                  </div>
                  <div style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, color: "#AFB9CC" }}>
                    Runs in your browser · nothing uploaded
                  </div>
                </div>
              </div>
              {["Loading the planner", camera ? "Adding your camera" : "Loading the camera library", "Ready"].map((t) => (
                <div className="lrow" key={t}>
                  <span className="tick">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M2 6.5 5 9l5-6" fill="none" stroke="#fff" strokeWidth="2" />
                    </svg>
                  </span>
                  {t}
                </div>
              ))}
              <div className="lbar"><i /></div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

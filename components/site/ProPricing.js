"use client";

import { useState } from "react";
import Link from "next/link";
import OpenPlanner from "./OpenPlanner";
import { PRO_PLANS, PRO_LIVE } from "@/lib/plans";
import ProNotify from "./ProNotify";
import { VAT_NOTE } from "@/lib/legal";

function Tick({ pro }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill={pro ? "#FF7A45" : "#DCE2FF"} />
      <path d="M5 9.3 7.8 12 13 6" fill="none" stroke={pro ? "#2A1206" : "#3D4FE0"} strokeWidth="2" />
    </svg>
  );
}

export default function ProPricing() {
  const [plan, setPlan] = useState("yearly");
  const p = PRO_PLANS[plan];

  return (
    <div className="pg2">
      <div className="pc">
        <h3>Free</h3>
        <div className="amt disp">£0</div>
        <span style={{ color: "var(--mute)" }}>Quick layouts, surveys and sanity checks.</span>
        <ul>
          <li><Tick />PDF, PNG and JPG plans</li>
          <li><Tick />Place cameras and see each field of view</li>
          <li><Tick />Camera library</li>
          <li><Tick />No account needed</li>
        </ul>
        <OpenPlanner ghost label="Open the planner" />
      </div>

      <div className="pc pro">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}>FOV Pro {!PRO_LIVE && <span className="badge">Coming soon</span>}</h3>
          <div className="bill" role="group" aria-label="Billing period">
            <button type="button" aria-pressed={plan === "monthly"} onClick={() => setPlan("monthly")}>Monthly</button>
            <button type="button" aria-pressed={plan === "yearly"} onClick={() => setPlan("yearly")}>Yearly</button>
          </div>
        </div>
        <div className="amt disp">
          {p.label}
          <small> / {p.per}</small>
        </div>
        <span className="muted" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {p.note}
          {plan === "yearly" && <span className="badge">Save £29</span>}
        </span>
        <span className="muted" style={{ marginTop: 14 }}>
          For installers, consultants and integrators who hand designs to clients.
        </span>
        <ul>
          <li><Tick pro />Everything in Free</li>
          <li><Tick pro />DXF import, scale read from the drawing (DWG coming soon)</li>
          <li><Tick pro />Walls from your CAD layer block each camera&apos;s view</li>
          <li><Tick pro />Pixel density and DORI per camera, coverage per room</li>
          <li><Tick pro />PDF coverage report under your logo, plus exports</li>
          <li><Tick pro />Your own custom cameras</li>
        </ul>
        {PRO_LIVE ? (
          <>
            <Link className="btn btn-o" href={`/account?upgrade=${plan}#pro`}>
              Get FOV Pro <span className="ar" aria-hidden="true">→</span>
            </Link>
            <span className="muted mono" style={{ fontSize: 12, marginTop: 12, textAlign: "center" }}>
              {VAT_NOTE} · secure checkout by Stripe · cancel any time
            </span>
          </>
        ) : (
          <ProNotify />
        )}
      </div>
    </div>
  );
}

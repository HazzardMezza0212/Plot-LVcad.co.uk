"use client";

import { useState } from "react";
import OpenPlanner from "./OpenPlanner";

// The interactive top of a camera model page: pick a lens setting, see the
// identify distance and a 3D coverage wedge coloured by DORI level, and drag
// a distance slider to read off scene width and pixel density.
// `variants` come from lib/fov/cameraPages.js (same maths as the planner).

const MAXM = 40; // the wedge is drawn out to 40 m
const CX = 350, CY = 360, K = 330 / MAXM;
const COLOURS = { Identify: "var(--acc)", Recognise: "#7C8CFF", Observe: "#B9C3FF", Detect: "#E6EAFF" };

const pt = (r, a) => `${(CX + r * Math.sin(a)).toFixed(1)} ${(CY - r * Math.cos(a)).toFixed(1)}`;
function sector(m0, m1, deg) {
  const h = ((Math.min(deg, 170) / 2) * Math.PI) / 180;
  const r0 = Math.min(m0, MAXM) * K, r1 = Math.min(m1, MAXM) * K;
  if (r1 <= r0) return "";
  if (r0 < 0.5) return `M${CX} ${CY} L${pt(r1, -h)} A${r1} ${r1} 0 0 1 ${pt(r1, h)} Z`;
  return `M${pt(r0, -h)} L${pt(r1, -h)} A${r1} ${r1} 0 0 1 ${pt(r1, h)} L${pt(r0, h)} A${r0} ${r0} 0 0 0 ${pt(r0, -h)} Z`;
}
function arc(m, deg) {
  const h = ((Math.min(deg, 170) / 2) * Math.PI) / 180, r = Math.min(m, MAXM) * K;
  return `M${pt(r, -h)} A${r} ${r} 0 0 1 ${pt(r, h)}`;
}
const fmt = (m) => (m < 10 ? m.toFixed(1) : String(Math.round(m)));
const fmtDeg = (d) => (Number.isInteger(d) ? String(d) : d.toFixed(1)) + "°";

export default function ModelExplorer({ model, brand, variants, specLine }) {
  const [i, setI] = useState(0);
  const [dist, setDist] = useState(10);
  const v = variants[i];
  const by = Object.fromEntries(v.dori.map((d) => [d.level, d.metres]));

  const width = 2 * dist * Math.tan((v.hfovDeg / 2) * (Math.PI / 180));
  const ppm = v.horizontalPixels / width;
  const level = ppm >= 250 ? "identify" : ppm >= 125 ? "recognise" : ppm >= 62 ? "observe" : ppm >= 25 ? "detect" : "see movement only";

  return (
    <>
      <section className="mhero">
        <div>
          <span className="brandtag mono">{brand}</span>
          <h1 className="pageh disp" style={{ fontSize: "clamp(44px,6.4vw,92px)", marginTop: 10 }}>{model}</h1>
          <p className="spec mono">{specLine}</p>
          {variants.length > 1 && (
            <div className="seg" role="group" aria-label="Lens setting">
              {variants.map((x, n) => (
                <button key={x.id} type="button" aria-pressed={n === i} onClick={() => setI(n)}>
                  {x.lens.charAt(0).toUpperCase() + x.lens.slice(1)}
                </button>
              ))}
            </div>
          )}
          <div className="bignum">
            <div className="k1 mono">IDENTIFY A STRANGER UP TO</div>
            <div className="v disp">{fmt(by.Identify)}<small>m</small></div>
            <div className="k1" style={{ fontSize: 15, marginTop: 6 }}>
              Horizontal field of view <b style={{ color: "#0F1A2E" }}>{fmtDeg(v.hfovDeg)}</b>
              {v.fovSource === "calculated" && " (calculated from sensor and lens)"} · detects a person out to{" "}
              <b style={{ color: "#0F1A2E" }}>{fmt(by.Detect)} m</b>
            </div>
          </div>
          <div className="ctas" style={{ justifyContent: "flex-start" }}>
            <OpenPlanner camera={v.id} label="Plan this camera — free" arrow />
            {v.source && (
              <a className="btn btn-g" href={v.source} target="_blank" rel="nofollow noopener noreferrer">Datasheet ↗</a>
            )}
          </div>
          <div className={`ver ${v.verified ? "ok" : "warn"}`}>
            {v.verified ? "✓ Checked against the manufacturer's datasheet" : "! Not yet checked against the datasheet — confirm before relying on it"}
          </div>
        </div>

        <div className="mstage" aria-label="Top-down view of the camera's coverage, coloured by DORI level">
          <div className="plane">
            <svg viewBox="0 0 700 380" role="img" aria-label={`Coverage wedge for the ${model}: identify to ${fmt(by.Identify)} m, recognise to ${fmt(by.Recognise)} m, observe to ${fmt(by.Observe)} m, detect to ${fmt(by.Detect)} m`}>
              <path d={sector(by.Observe, by.Detect, v.hfovDeg)} fill={COLOURS.Detect} />
              <path d={sector(by.Recognise, by.Observe, v.hfovDeg)} fill={COLOURS.Observe} />
              <path d={sector(by.Identify, by.Recognise, v.hfovDeg)} fill={COLOURS.Recognise} />
              <path d={sector(0, by.Identify, v.hfovDeg)} fill={COLOURS.Identify} />
              <path d={arc(dist, v.hfovDeg)} fill="none" stroke="#0F1A2E" strokeWidth="2" strokeDasharray="6 6" />
            </svg>
          </div>
          <div className="morb" aria-hidden="true" />
          <div className="leg mono">
            {["Identify", "Recognise", "Observe", "Detect"].map((l) => (
              <span key={l}>
                <i style={{ background: COLOURS[l], boxShadow: l === "Detect" ? "inset 0 0 0 1px #B9C3FF" : undefined }} />
                {l} · {fmt(by[l])} m
              </span>
            ))}
            <span style={{ color: "#5B667A" }}>Drawn to {MAXM} m · dashed line = {dist} m</span>
          </div>
        </div>
      </section>

      <section className="explore">
        <span className="kicker">Drag the distance</span>
        <p className="sent disp" aria-live="polite">
          At <span className="p">{dist} m</span> {variants.length > 1 ? `the ${v.lens}` : "this camera"} sees a scene{" "}
          <span className="p">{fmt(width)} m</span> wide at <span className="p">{Math.round(ppm)} px/m</span> — enough to{" "}
          <span className="p lv">{level}</span>.
        </p>
        <label className="sr" htmlFor="dist">Distance from camera in metres</label>
        <input id="dist" className="range" type="range" min="1" max="40" step="1" value={dist} onChange={(e) => setDist(Number(e.target.value))} />
        <div className="rl mono"><span>1 m</span><span>10 m</span><span>20 m</span><span>30 m</span><span>40 m</span></div>
      </section>
    </>
  );
}

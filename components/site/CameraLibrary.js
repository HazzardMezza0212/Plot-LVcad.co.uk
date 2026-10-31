"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { wedgePath } from "@/lib/fov/wedge";

// Searchable, filterable list of camera models. `cams` is prepared on the
// server from lib/fov/cameraPages.js, so every number matches the model pages.
export default function CameraLibrary({ cams, total }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("All");
  const [sort, setSort] = useState("az");

  const brands = useMemo(() => ["All", ...new Set(cams.map((c) => c.brand))], [cams]);
  const maxId = useMemo(() => Math.max(...cams.map((c) => c.identify)), [cams]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = cams.filter((c) => (brand === "All" || c.brand === brand) && (!q || `${c.brand} ${c.model}`.toLowerCase().includes(q)));
    if (sort === "id") out = [...out].sort((a, b) => b.identify - a.identify);
    else if (sort === "wide") out = [...out].sort((a, b) => b.fovMax - a.fovMax);
    return out;
  }, [cams, query, brand, sort]);

  return (
    <>
      <div className="tools">
        <div className="search">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="#5B667A" strokeWidth="2" /><path d="m13 13 5 5" stroke="#5B667A" strokeWidth="2" /></svg>
          <label className="sr" htmlFor="q">Search cameras</label>
          <input id="q" type="search" placeholder="Search a model, e.g. Q1656 or 2CD2087" value={query} onChange={(e) => setQuery(e.target.value)} />
          <label className="sr" htmlFor="srt">Sort</label>
          <select id="srt" className="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="az">A–Z</option>
            <option value="id">Longest identify</option>
            <option value="wide">Widest view</option>
          </select>
        </div>
        <div className="chips" role="group" aria-label="Filter by manufacturer">
          {brands.map((b) => (
            <button key={b} type="button" className="chipb" aria-pressed={b === brand} onClick={() => setBrand(b)}>{b}</button>
          ))}
        </div>
      </div>

      <div className="meta">
        <span className="mono" aria-live="polite">{list.length} of {total} models</span>
        <span className="mono">Widest lens dashed · narrowest filled</span>
      </div>

      <div className="grid3">
        {list.map((c, i) => (
          <Link key={c.slug} className="card" href={`/cctv-cameras/${c.slug}`} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
            <div className="viz">
              <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                <path className="wide" d={wedgePath(c.fovMax, 50)} />
                <path className="tele" d={wedgePath(c.fovMin, 50)} />
                <circle cx="50" cy="56" r="2.6" fill="#FF7A45" />
              </svg>
              <span className="fovtag mono">{c.fovLabel}</span>
            </div>
            <span className="brandtag mono">{c.brand}</span>
            <h3 className="disp">{c.model}</h3>
            <div className="row"><span>Horizontal resolution</span><b>{c.px.toLocaleString("en-GB")} px</b></div>
            <div className="row" style={{ borderBottom: "1px solid rgba(15,26,46,.07)" }}><span>Identify up to</span><b>{c.identifyLabel} m</b></div>
            <div className="idbar"><i style={{ width: `${Math.max(6, Math.min(100, Math.sqrt(c.identify / maxId) * 100)).toFixed(0)}%` }} /></div>
            <div className="go"><span>View DORI distances</span><span className="ar" aria-hidden="true">→</span></div>
          </Link>
        ))}
        {list.length === 0 && (
          <div className="empty">
            <div className="disp" style={{ fontSize: 26, fontWeight: 600, color: "#0F1A2E", marginBottom: 8 }}>No match yet.</div>
            Can&apos;t find your camera? Add it as a custom camera in FOV Pro, or email us and we&apos;ll add it to the library.
          </div>
        )}
      </div>
    </>
  );
}

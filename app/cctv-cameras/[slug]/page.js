import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import OpenPlanner from "@/components/site/OpenPlanner";
import ModelExplorer from "@/components/site/ModelExplorer";
import { wedgePath } from "@/lib/fov/wedge";
import { CANONICAL_URL } from "@/lib/site";
import { MODELS, getModel, fmtMetres, fmtDeg } from "@/lib/fov/cameraPages";

// One page per camera model in the FOV library, generated at build time.
// Numbers come only from the library (lib/fov/cameras.json); nothing here is
// typed in by hand.

export const dynamicParams = false;

export function generateStaticParams() {
  return MODELS.map((m) => ({ slug: m.slug }));
}

function hfovRange(m) {
  const v = m.variants.map((x) => x.hfovDeg);
  const lo = Math.min(...v), hi = Math.max(...v);
  return lo === hi ? fmtDeg(lo) : `${fmtDeg(lo)}–${fmtDeg(hi)}`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const m = getModel(slug);
  if (!m) return {};
  const best = fmtMetres(Math.max(...m.variants.map((v) => v.dori[3].metres)));
  return {
    title: `${m.model} field of view (${hfovRange(m)}) & DORI distances`,
    description: `${m.model}: horizontal field of view ${hfovRange(m)}, scene width and pixel density at distance, and how far it can detect, observe, recognise and identify (up to about ${best} m for identification). Plan it on your own floor plan, free.`,
    alternates: { canonical: `/cctv-cameras/${m.slug}` },
  };
}

const DOT = { Identify: "#FF7A45", Recognise: "#7C8CFF", Observe: "#B9C3FF", Detect: "#E6EAFF" };

export default async function CameraPage({ params }) {
  const { slug } = await params;
  const m = getModel(slug);
  if (!m) notFound();

  const others = MODELS.filter((x) => x.brand === m.brand && x.slug !== m.slug);
  const v0 = m.variants[0];
  const focal = m.variants.map((v) => v.focalLengthMm);
  const fMin = Math.min(...focal), fMax = Math.max(...focal);
  const specLine = [
    hfovRange(m),
    `${Math.max(...m.variants.map((v) => v.horizontalPixels)).toLocaleString("en-GB")} px`,
    v0.sensorFormat ? `${v0.sensorFormat} sensor` : null,
    fMin === fMax ? `${fMin} mm` : `${fMin}–${fMax} mm`,
  ].filter(Boolean).join(" · ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "CCTV cameras", item: `${CANONICAL_URL}/cctv-cameras` },
      { "@type": "ListItem", position: 2, name: m.model, item: `${CANONICAL_URL}/cctv-cameras/${m.slug}` },
    ],
  };

  return (
    <div className="v2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="wrap">
        <Header />
        <div className="crumb mono">
          <Link href="/">Home</Link> / <Link href="/cctv-cameras">Camera library</Link> / {m.brand}
        </div>

        <ModelExplorer model={m.model} brand={m.brand} variants={m.variants} specLine={specLine} />

        <section className="tbl">
          <span className="kicker">DORI distances · EN 62676-4</span>
          <h2 className="h disp">{m.variants.length > 1 ? "Every lens setting." : "The full numbers."}</h2>
          <div className="tw">
            <table className="t">
              <thead>
                <tr>
                  <th scope="col">Level</th>
                  <th scope="col">Pixel density</th>
                  {m.variants.map((v) => (
                    <th scope="col" key={v.id}>{m.variants.length > 1 ? `${v.lens} · ` : ""}{fmtDeg(v.hfovDeg)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[3, 2, 1, 0].map((n) => (
                  <tr key={n}>
                    <td><span className="dot" style={{ background: DOT[v0.dori[n].level], boxShadow: n === 0 ? "inset 0 0 0 1px #B9C3FF" : undefined }} />{v0.dori[n].level}</td>
                    <td className="n">{v0.dori[n].ppm} px/m</td>
                    {m.variants.map((v) => <td className="n" key={v.id}>{fmtMetres(v.dori[n].metres)} m</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tw" style={{ marginTop: 18 }}>
            <table className="t">
              <thead>
                <tr>
                  <th scope="col">Distance</th>
                  {m.variants.map((v) => (
                    <th scope="col" key={v.id}>{m.variants.length > 1 ? `${v.lens}: ` : ""}scene width · px/m</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {v0.scene.map((s, n) => (
                  <tr key={s.metres}>
                    <td className="n">{s.metres} m</td>
                    {m.variants.map((v) => (
                      <td className="n" key={v.id}>{fmtMetres(v.scene[n].width)} m · {Math.round(v.scene[n].ppm)} px/m</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="read">
            <p>
              Distances are measured straight out along the centre of the view, with the camera level. A real camera is
              mounted high and tilted down, and its pixel density falls off towards the edges of the picture, so the useful
              range on the ground is usually shorter.
            </p>
            <p>
              Lighting, compression and lens distortion cut real-world detail too. Plot-LV FOV allows for mounting height,
              tilt and walls, and shows the real coverage on your own floor plan.{" "}
              <Link href="/cctv-cameras#dori" style={{ color: "var(--blue)" }}>What DORI and px/m mean</Link>.
            </p>
          </div>
          <p className="note mono">
            {m.variants.map((v) => (
              <span key={v.id} style={{ display: "block" }}>
                {m.variants.length > 1 ? `${v.lens}: ` : ""}
                {v.verified ? "checked against the manufacturer's datasheet" : "not yet checked against the datasheet"}
                {v.source && (
                  <>
                    {" · "}
                    <a href={v.source} target="_blank" rel="nofollow noopener noreferrer" style={{ color: "var(--blue)" }}>source</a>
                  </>
                )}
              </span>
            ))}
          </p>
        </section>

        {others.length > 0 && (
          <section className="tbl">
            <span className="kicker">More from {m.brand}</span>
            <h2 className="h disp">Compare the range.</h2>
            <div className="rail">
              {others.map((o) => {
                const f = o.variants.map((x) => x.hfovDeg);
                const id = Math.max(...o.variants.map((x) => x.dori[3].metres));
                return (
                  <Link className="mini" href={`/cctv-cameras/${o.slug}`} key={o.slug}>
                    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                      <path d={wedgePath(Math.max(...f), 50)} fill="none" stroke="#3D4FE0" strokeWidth=".6" strokeDasharray="1.6 1.4" />
                      <path d={wedgePath(Math.min(...f), 50)} fill="rgba(61,79,224,.16)" stroke="#3D4FE0" strokeWidth=".5" />
                      <circle cx="50" cy="56" r="2.6" fill="#FF7A45" />
                    </svg>
                    <b className="disp">{o.model}</b>
                    <small className="mono">{hfovRange(o)} · identify {fmtMetres(id)} m</small>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="cta">
          <h2 className="disp">Will it cover the room?<br />Find out on your plan.</h2>
          <OpenPlanner camera={m.variants[0].id} label="Plan this camera — free" arrow />
        </section>

        <Footer />
      </div>
    </div>
  );
}

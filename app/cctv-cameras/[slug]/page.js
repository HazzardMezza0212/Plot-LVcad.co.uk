import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import LaunchButton from "@/components/LaunchButton";
import { MODELS, getModel, fmtMetres, fmtDeg } from "@/lib/fov/cameraPages";

// One page per camera model in the FOV library, generated at build time.
// Numbers come only from the library (lib/fov/cameras.json); nothing here is
// typed in by hand.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
  const identify = m.variants.map((v) => v.dori[3].metres);
  const best = fmtMetres(Math.max(...identify));
  return {
    title: `${m.model} field of view (${hfovRange(m)}) & DORI distances | Plot-LV FOV`,
    description: `${m.model}: horizontal field of view ${hfovRange(m)}, scene width and pixel density at distance, and how far it can detect, observe, recognise and identify (up to about ${best} m for identification). Plan it on your own floor plan, free.`,
    alternates: { canonical: `${siteUrl}/cctv-cameras/${m.slug}` },
  };
}

const NAV_LINKS = [
  ["All cameras", "/cctv-cameras"],
  ["How FOV works", "/cctv-field-of-view-calculator"],
  ["PPM & DORI", "/cctv-field-of-view-calculator#dori"],
];

function Variant({ v, single }) {
  return (
    <article className="cam-variant">
      {!single && <h2 className="display">{v.lens.charAt(0).toUpperCase() + v.lens.slice(1)}</h2>}
      <dl className="cam-specs">
        <div>
          <dt>Horizontal field of view</dt>
          <dd>
            {fmtDeg(v.hfovDeg)}
            <span className="cam-src">{v.fovSource === "datasheet" ? "published" : "calculated from sensor and lens"}</span>
          </dd>
        </div>
        <div>
          <dt>Horizontal resolution</dt>
          <dd>{v.horizontalPixels.toLocaleString("en-GB")} px</dd>
        </div>
        <div>
          <dt>Focal length</dt>
          <dd>{v.focalLengthMm} mm</dd>
        </div>
        {v.sensorFormat && (
          <div>
            <dt>Sensor</dt>
            <dd>{v.sensorFormat}</dd>
          </div>
        )}
      </dl>

      <div className="cam-tables">
        <table className="fovl-dori">
          <caption className="mono">DORI distances (EN 62676-4)</caption>
          <thead>
            <tr>
              <th scope="col">Level</th>
              <th scope="col">px/m</th>
              <th scope="col">Up to</th>
            </tr>
          </thead>
          <tbody>
            {v.dori.map((d) => (
              <tr key={d.level}>
                <th scope="row">{d.level}</th>
                <td className="mono">{d.ppm}</td>
                <td>{fmtMetres(d.metres)} m</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="fovl-dori">
          <caption className="mono">Scene width at distance</caption>
          <thead>
            <tr>
              <th scope="col">Distance</th>
              <th scope="col">Scene width</th>
              <th scope="col">Pixel density</th>
            </tr>
          </thead>
          <tbody>
            {v.scene.map((s) => (
              <tr key={s.metres}>
                <th scope="row">{s.metres} m</th>
                <td>{fmtMetres(s.width)} m</td>
                <td className="mono">{Math.round(s.ppm)} px/m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="cam-status">
        {v.verified ? "Checked against the manufacturer's datasheet." : "Not yet checked against the manufacturer's datasheet: confirm before you rely on it."}
        {v.source && (
          <>
            {" "}
            <a href={v.source} rel="nofollow noopener" target="_blank">Source</a>
          </>
        )}
      </p>
    </article>
  );
}

export default async function CameraPage({ params }) {
  const { slug } = await params;
  const m = getModel(slug);
  if (!m) notFound();

  const others = MODELS.filter((x) => x.brand === m.brand && x.slug !== m.slug);
  const single = m.variants.length === 1;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "CCTV cameras", item: `${siteUrl}/cctv-cameras` },
      { "@type": "ListItem", position: 2, name: m.model, item: `${siteUrl}/cctv-cameras/${m.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="grid-bg"></div>
      <SiteNav tag="FOV" links={NAV_LINKS} />

      <section className="cam-hero">
        <p className="cam-crumbs mono">
          <Link href="/cctv-cameras">CCTV cameras</Link>{" "}/ {m.brand}
        </p>
        <h1 className="display">{m.model} field of view &amp; DORI distances</h1>
        <p className="cam-lede">
          How wide the {m.model} sees, its pixel density at distance, and how far out it can
          detect, observe, recognise and identify a person
          {single ? "." : `, at ${m.variants.length === 2 ? "both ends of its lens range" : "each lens setting"}.`}
        </p>
        <div className="cta-row">
          <LaunchButton href="/guest" label={`Plan the ${m.model} on your floor plan`} />
        </div>
      </section>

      <section className="cam-body">
        {m.variants.map((v) => (
          <Variant key={v.id} v={v} single={single} />
        ))}

        <div className="cam-note">
          <h2 className="display">How to read these numbers</h2>
          <p>
            Distances are measured straight out along the centre of the view, with the camera level.
            A real camera is mounted high and tilted down, and its pixel density falls off towards the
            edges of the picture, so the useful range on the ground is usually shorter. Lighting,
            compression and lens distortion also cut real-world detail.
          </p>
          <p>
            Plot-LV FOV allows for mounting height, tilt and walls, and shows the real coverage on your
            own floor plan. <Link href="/cctv-field-of-view-calculator#dori">What DORI and px/m mean</Link>.
          </p>
        </div>

        {others.length > 0 && (
          <div className="cam-others">
            <h2 className="display">Other {m.brand} cameras</h2>
            <ul>
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/cctv-cameras/${o.slug}`}>{o.model}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="fovl-final">
        <h2 className="display">See exactly what the {m.model} covers</h2>
        <p>Drop in your floor plan, place the camera and check coverage room by room. Free, no sign-up.</p>
        <div className="cta-row fc-center">
          <LaunchButton href="/guest" label="Open the planner — no sign-up" />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import LaunchButton from "@/components/LaunchButton";
import { MODELS, modelsByBrand, fmtDeg, fmtMetres } from "@/lib/fov/cameraPages";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  title: "CCTV camera field of view & DORI distances by model | Plot-LV FOV",
  description: `Field of view, scene width, pixel density and DORI distances for ${MODELS.length} CCTV camera models from Axis, Hikvision, Hanwha Vision, Avigilon, Bosch, Dahua and more.`,
  alternates: { canonical: `${siteUrl}/cctv-cameras` },
};

const NAV_LINKS = [
  ["How FOV works", "/cctv-field-of-view-calculator"],
  ["PPM & DORI", "/cctv-field-of-view-calculator#dori"],
  ["Guides", "/guides/how-to-calculate-cctv-field-of-view"],
];

function summary(m) {
  const fov = m.variants.map((v) => v.hfovDeg);
  const lo = Math.min(...fov), hi = Math.max(...fov);
  const px = Math.max(...m.variants.map((v) => v.horizontalPixels));
  const id = Math.max(...m.variants.map((v) => v.dori[3].metres));
  return {
    fov: lo === hi ? fmtDeg(lo) : `${fmtDeg(lo)}–${fmtDeg(hi)}`,
    px: px.toLocaleString("en-GB"),
    id: fmtMetres(id),
  };
}

export default function CamerasIndex() {
  return (
    <>
      <div className="grid-bg"></div>
      <SiteNav tag="FOV" links={NAV_LINKS} />

      <section className="cam-hero">
        <p className="cam-crumbs mono">Plot-LV FOV camera library</p>
        <h1 className="display">CCTV camera field of view &amp; DORI distances</h1>
        <p className="cam-lede">
          {MODELS.length} camera models from the Plot-LV FOV library. Each page shows how wide the camera
          sees, its scene width and pixel density at distance, and how far it can detect, observe,
          recognise and identify.
        </p>
        <div className="cta-row">
          <LaunchButton href="/guest" label="Plan cameras on your floor plan — free" />
        </div>
      </section>

      <section className="cam-body">
        {modelsByBrand().map(([brand, models]) => (
          <div className="cam-brand" key={brand}>
            <h2 className="display">{brand}</h2>
            <table className="fovl-dori cam-index">
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  <th scope="col">Field of view</th>
                  <th scope="col">Horizontal px</th>
                  <th scope="col">Identify up to</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => {
                  const s = summary(m);
                  return (
                    <tr key={m.slug}>
                      <th scope="row">
                        <Link href={`/cctv-cameras/${m.slug}`}>{m.model}</Link>
                      </th>
                      <td>{s.fov}</td>
                      <td className="mono">{s.px}</td>
                      <td>{s.id} m</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        <p className="cam-status">
          Ranges cover the lens settings in the library. &quot;Identify up to&quot; is the distance along the centre of
          the view at 250 px/m, with the camera level; mounting height and tilt shorten it in practice.
        </p>
      </section>

      <SiteFooter />
    </>
  );
}

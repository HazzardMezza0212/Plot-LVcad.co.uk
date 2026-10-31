import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import OpenPlanner from "@/components/site/OpenPlanner";
import CameraLibrary from "@/components/site/CameraLibrary";
import { MODELS, DORI, fmtMetres, fmtDeg } from "@/lib/fov/cameraPages";

export const metadata = {
  title: "CCTV camera field of view & DORI distances by model",
  description: `Field of view, pixel density and detect, observe, recognise and identify distances for ${MODELS.length} CCTV camera models from ${new Set(MODELS.map((m) => m.brand)).size} manufacturers, from the manufacturers' published figures. Plan any of them on your own floor plan, free.`,
  alternates: { canonical: "/cctv-cameras" },
};

const DORI_TEXT = {
  Detect: "A person is there",
  Observe: "What they're doing and wearing",
  Recognise: "Someone who knows them can say who",
  Identify: "Enough to identify a stranger",
};

function summarise(m) {
  const fovs = m.variants.map((v) => v.hfovDeg);
  const fovMin = Math.min(...fovs), fovMax = Math.max(...fovs);
  const identify = Math.max(...m.variants.map((v) => v.dori[3].metres));
  return {
    slug: m.slug,
    brand: m.brand,
    model: m.model,
    fovMin,
    fovMax,
    fovLabel: fovMin === fovMax ? fmtDeg(fovMax) : `${fmtDeg(fovMin)}–${fmtDeg(fovMax)}`,
    px: Math.max(...m.variants.map((v) => v.horizontalPixels)),
    identify,
    identifyLabel: fmtMetres(identify),
  };
}

export default function CameraLibraryPage() {
  const cams = MODELS.map(summarise);
  const brands = new Set(MODELS.map((m) => m.brand)).size;

  return (
    <div className="v2">
      <div className="wrap">
        <Header />
        <div className="crumb mono"><Link href="/">Home</Link> / Camera library</div>
        <h1 className="pageh disp">Every camera, <em className="hl">to scale</em>.</h1>
        <p className="lede-l">
          Field of view, pixel density and how far each of {MODELS.length} models from {brands} manufacturers can detect,
          observe, recognise and identify a person — from the manufacturers&apos; published figures.
        </p>

        <CameraLibrary cams={cams} total={MODELS.length} />
        <p className="note">
          Identify distance is measured along the centre of the view at 250 px/m with the camera level, at the widest-reaching
          lens setting. Mounting height and tilt shorten it in practice.
        </p>

        <section className="ruler" id="dori">
          <span className="mono" style={{ fontSize: 13, color: "#AFC0FF" }}>PIXEL DENSITY · EN 62676-4</span>
          <h2 className="disp">How much detail will this camera actually give you?</h2>
          <p className="l">
            A camera&apos;s field of view is how wide it sees. The further from the lens, the wider the scene and the thinner
            its pixels are spread. Pixel density counts the horizontal pixels covering one metre of scene — and four levels
            tell you what that buys you.
          </p>
          <div className="scale" role="list">
            {DORI.map((d, i) => (
              <div className="tk" role="listitem" key={d.level} style={{ left: `${8 + i * 28}%` }}>
                <div className="v disp">{d.ppm}<small>px/m</small></div>
                <div className="st" />
                <div className="lb">{d.level}</div>
                <div className="ds">{DORI_TEXT[d.level]}</div>
              </div>
            ))}
          </div>
          <p className="l" style={{ marginTop: 34 }}>
            <b style={{ color: "#fff" }}>Working it out yourself:</b> scene width = 2 × distance × tan(field of view ÷ 2), and
            pixel density = horizontal pixels ÷ scene width. A 1,920-pixel camera looking at a scene 7.7 m wide gives about
            250 px/m — enough to identify. Where the scene is 31 m wide, it gives about 62 px/m: you can see what&apos;s
            happening, but not who it is.
          </p>
        </section>

        <section className="cta">
          <h2 className="disp">Got the camera?<br />Now place it.</h2>
          <OpenPlanner arrow />
        </section>

        <Footer />
      </div>
    </div>
  );
}

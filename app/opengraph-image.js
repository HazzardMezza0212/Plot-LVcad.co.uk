import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The image shown when a Plot-LV link is shared (LinkedIn, Slack, X...).
export const alt = "Plot-LV FOV — see every blind spot before you drill. Free CCTV field of view planner.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const icon = await readFile(join(process.cwd(), "public/site/plv-icon.png"));
  const iconSrc = `data:image/png;base64,${icon.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F4F5F7", padding: "72px 80px", position: "relative" }}>
        {/* camera wedge in the corner */}
        <div
          style={{
            position: "absolute", right: -120, bottom: -160, width: 620, height: 620, borderRadius: "50%", display: "flex",
            background: "radial-gradient(circle, rgba(255,122,69,.35) 0%, rgba(124,140,255,.18) 45%, rgba(244,245,247,0) 70%)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={iconSrc} width={72} height={72} alt="" />
            <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: "#0F1A2E" }}>Plot-LV</div>
            <div style={{ display: "flex", marginLeft: 12, fontSize: 22, color: "#3D4FE0", background: "#DCE2FF", padding: "6px 16px", borderRadius: 999 }}>
              FREE CCTV PLANNER
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 92, fontWeight: 800, color: "#0F1A2E", lineHeight: 1, letterSpacing: -3, maxWidth: 900 }}>
              See every blind spot before you drill.
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#5B667A", marginTop: 26 }}>
              Field of view, pixel density and DORI on your own floor plan.
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

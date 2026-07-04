import { ImageResponse } from "next/og";

export const alt = "Plot-LV — Fire alarm compliance CAD";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0E1A28",
          padding: "90px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "10px",
            display: "flex",
            background: "#E8472C",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 34 }}>
          <div style={{ display: "flex", width: 16, height: 16, borderRadius: "50%", background: "#E8472C" }} />
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#8FA1B5",
              letterSpacing: 6,
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Fire Alarm Compliance CAD
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 130, fontWeight: 700, color: "#F6F4EC" }}>
          PLOT-LV
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#F6F4EC", marginTop: 30, maxWidth: 920 }}>
          Draw the layout. Check the standard. Ship it compliant.
        </div>
      </div>
    ),
    { ...size }
  );
}

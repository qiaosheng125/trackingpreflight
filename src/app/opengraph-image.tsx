import { ImageResponse } from "next/og";
import { siteName } from "./site";

export const runtime = "edge";
export const alt = "Tracking Preflight report preview";
export const size = {
  width: 1200,
  height: 630
};
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
          justifyContent: "space-between",
          padding: "72px",
          background: "#f5f7fb",
          color: "#111827",
          fontFamily: "Arial"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{siteName}</div>
          <div
            style={{
              border: "2px solid #16a34a",
              borderRadius: 8,
              color: "#166534",
              fontSize: 24,
              fontWeight: 800,
              padding: "10px 16px"
            }}
          >
            PRELAUNCH CHECK
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              color: "#2563eb",
              fontSize: 24,
              fontWeight: 800
            }}
          >
            GA4 + GTM + Clarity
          </div>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.02,
              fontWeight: 900,
              maxWidth: 940
            }}
          >
            Check visible tracking before launch
          </div>
          <div
            style={{
              color: "#4b5563",
              fontSize: 30,
              lineHeight: 1.35,
              maxWidth: 900
            }}
          >
            Copyable reports for scripts, collect requests, consent gates, and
            next steps.
          </div>
        </div>
      </div>
    ),
    size
  );
}

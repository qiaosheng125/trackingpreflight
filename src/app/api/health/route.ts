import { NextResponse } from "next/server";
import { getScanControlState } from "../mock-scan/scan-control";

export const runtime = "nodejs";

export function GET() {
  const localScanEnabled = process.env.ENABLE_LOCAL_TRACKING_SCAN === "1";
  const remoteScanEnabled = process.env.ENABLE_REMOTE_TRACKING_SCAN === "1";
  const remoteScanConfigured = Boolean(process.env.BROWSERLESS_TOKEN?.trim());

  return NextResponse.json({
    ok: true,
    service: "tracking-preflight",
    checkedAt: new Date().toISOString(),
    modes: {
      mock: true,
      fixture: true,
      local: localScanEnabled,
      remote: remoteScanEnabled && remoteScanConfigured
    },
    localScanEnabled,
    remoteScanEnabled,
    remoteScanConfigured,
    scanControl: getScanControlState(),
    environment: process.env.NODE_ENV || "unknown"
  });
}

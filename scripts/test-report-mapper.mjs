import { readFileSync } from "node:fs";
import { mapRawTrackingReport } from "../src/app/api/mock-scan/report-mapper.ts";

const request = {
  url: "https://example.com/",
  autoConsent: true,
  consentPreset: "auto-safe",
  consentSelector: "#onetrust-accept-btn-handler",
  eventPreset: "signup",
  eventSelector: ".signup-button"
};

const fixtures = [
  ["pass", "../../../00_工具脚本/tracking-checker-prototype/reports/aiwallpaperprompts-after-likes-url-fix.json"],
  ["warning", "../../../00_工具脚本/tracking-checker-prototype/reports/external-browserstack-home.json"],
  ["fail", "../../../00_工具脚本/tracking-checker-prototype/reports/external-vercel-home.json"]
];

for (const [expectedStatus, fixturePath] of fixtures) {
  const raw = JSON.parse(readFileSync(new URL(fixturePath, import.meta.url), "utf8"));
  const mapped = mapRawTrackingReport(raw, request);

  if (mapped.status !== expectedStatus) {
    throw new Error(`Expected ${expectedStatus}, got ${mapped.status}`);
  }

  if (!mapped.finalUrl || !mapped.findings.length || !mapped.nextSteps.length) {
    throw new Error(`Mapped report missing required output for ${expectedStatus}`);
  }

  if (expectedStatus === "pass" && mapped.detected.ga4.length === 0) {
    throw new Error("Expected pass fixture to include GA4 ID");
  }

  if (expectedStatus === "warning" && mapped.detected.gtm.length === 0) {
    throw new Error("Expected warning fixture to include GTM ID");
  }
}

console.log("Report mapper tests passed");

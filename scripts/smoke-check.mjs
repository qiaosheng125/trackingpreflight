import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/app/TrackingPreflightApp.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const site = readFileSync(new URL("../src/app/site.ts", import.meta.url), "utf8");
const analytics = readFileSync(new URL("../src/app/analytics.tsx", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");
const robots = readFileSync(new URL("../src/app/robots.ts", import.meta.url), "utf8");
const contact = readFileSync(new URL("../src/app/contact/page.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/app/api/mock-scan/route.ts", import.meta.url), "utf8");
const healthApi = readFileSync(new URL("../src/app/api/health/route.ts", import.meta.url), "utf8");
const scanProvider = readFileSync(new URL("../src/app/api/mock-scan/scan-provider.ts", import.meta.url), "utf8");
const reportMapper = readFileSync(new URL("../src/app/api/mock-scan/report-mapper.ts", import.meta.url), "utf8");
const guard = readFileSync(new URL("../src/app/api/mock-scan/url-guard.ts", import.meta.url), "utf8");
const rateLimit = readFileSync(new URL("../src/app/api/mock-scan/rate-limit.ts", import.meta.url), "utf8");
const scanRequest = readFileSync(new URL("../src/app/api/mock-scan/scan-request.ts", import.meta.url), "utf8");
const samples = readFileSync(new URL("../src/app/samples/page.tsx", import.meta.url), "utf8");
const sampleReports = readFileSync(new URL("../src/app/sample-reports.ts", import.meta.url), "utf8");
const pageSource = `${page}\n${app}`;

const requiredPageText = [
  "Tracking Preflight",
  "Run preflight",
  "Scan mode",
  "Auto consent",
  "Event to test",
  "Advanced event selector",
  "Scan setup",
  "Copy summary",
  "Download JSON",
  "Decision for this scan",
  "Environment status",
  "View health API",
  "Local browser scanning is not enabled",
  "What this checks",
  "What this cannot prove"
];

const requiredCssText = [".workspace", ".scanPanel", ".reportPanel", ".statusBadge"];
const requiredSiteText = ["trackingpreflight.com", "support@trackingpreflight.com", "Tracking Preflight"];
const requiredAnalyticsText = ["NEXT_PUBLIC_GA_ID", "NEXT_PUBLIC_CLARITY_ID", "googletagmanager.com"];
const requiredSeoText = ["sitemap.xml", "MetadataRoute"];
const requiredLegalText = ["supportEmail", "Contact"];
const requiredApiText = ["POST", "runScan", "NextResponse.json"];
const requiredHealthText = ["localScanEnabled", "tracking-preflight", "modes"];
const requiredProviderText = ["runScan", "runLocalTrackingScan", "ENABLE_LOCAL_TRACKING_SCAN"];
const requiredMapperText = ["mapRawTrackingReport", "buildFindings", "buildNextSteps"];
const requiredGuardText = ["validatePublicScanUrl", "Private network addresses", "Only standard web ports"];
const requiredRateLimitText = ["checkRateLimit", "maxMinuteRequests", "maxDailyRequests", "X-RateLimit"];
const requiredScanRequestText = ["parseScanRequest", "allowedConsentPresets", "Unsupported scan mode"];
const requiredSamplesText = ["Pass sample", "Warning sample", "Fail sample"];
const requiredSampleRoutingText = ["/samples/pass", "/samples/warning", "/samples/fail"];

for (const text of requiredPageText) {
  if (!pageSource.includes(text)) {
    throw new Error(`Missing page text: ${text}`);
  }
}

for (const text of requiredCssText) {
  if (!css.includes(text)) {
    throw new Error(`Missing CSS selector: ${text}`);
  }
}

for (const text of requiredSiteText) {
  if (!site.includes(text)) {
    throw new Error(`Missing site text: ${text}`);
  }
}

for (const text of requiredAnalyticsText) {
  if (!analytics.includes(text)) {
    throw new Error(`Missing analytics text: ${text}`);
  }
}

for (const text of requiredSeoText) {
  if (!sitemap.includes(text) && !robots.includes(text)) {
    throw new Error(`Missing SEO text: ${text}`);
  }
}

for (const text of requiredLegalText) {
  if (!contact.includes(text)) {
    throw new Error(`Missing legal/contact text: ${text}`);
  }
}

for (const text of requiredApiText) {
  if (!api.includes(text)) {
    throw new Error(`Missing API text: ${text}`);
  }
}

for (const text of requiredHealthText) {
  if (!healthApi.includes(text)) {
    throw new Error(`Missing health API text: ${text}`);
  }
}

for (const text of requiredProviderText) {
  if (!scanProvider.includes(text)) {
    throw new Error(`Missing provider text: ${text}`);
  }
}

for (const text of requiredMapperText) {
  if (!reportMapper.includes(text)) {
    throw new Error(`Missing report mapper text: ${text}`);
  }
}

for (const text of requiredGuardText) {
  if (!guard.includes(text)) {
    throw new Error(`Missing URL guard text: ${text}`);
  }
}

for (const text of requiredRateLimitText) {
  if (!rateLimit.includes(text) && !api.includes(text)) {
    throw new Error(`Missing rate limit text: ${text}`);
  }
}

for (const text of requiredScanRequestText) {
  if (!scanRequest.includes(text)) {
    throw new Error(`Missing scan request text: ${text}`);
  }
}

for (const text of requiredSamplesText) {
  if (!samples.includes(text)) {
    throw new Error(`Missing sample page text: ${text}`);
  }
}

for (const text of requiredSampleRoutingText) {
  if (!sampleReports.includes(text)) {
    throw new Error(`Missing sample report routing text: ${text}`);
  }
}

console.log("Smoke check passed");

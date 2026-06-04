import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { pickMockReport, type SampleReport } from "../../sample-reports";
import { mapRawTrackingReport } from "./report-mapper";
import type { NormalizedScanRequest } from "./scan-request";

const execFileAsync = promisify(execFile);

export async function runScan(request: NormalizedScanRequest) {
  if (request.mode === "remote") {
    return runRemoteTrackingScan(request);
  }

  if (request.mode === "local") {
    return runLocalTrackingScan(request);
  }

  if (request.mode === "fixture") {
    return mapRawTrackingReport(buildFixtureRawReport(request.url), request);
  }

  const report = pickMockReport(request.url);

  return {
    ...report,
    url: request.url,
    finalUrl: request.url,
    mock: true,
    input: {
      mode: request.mode,
      autoConsent: request.autoConsent,
      consentPreset: request.consentPreset,
      consentSelector: request.consentSelector,
      eventPreset: request.eventPreset,
      eventSelector: request.eventSelector
    }
  };
}

async function runRemoteTrackingScan(request: NormalizedScanRequest): Promise<SampleReport> {
  if (process.env.ENABLE_REMOTE_TRACKING_SCAN !== "1") {
    throw new Error("REMOTE_SCAN_DISABLED");
  }

  if (!process.env.BROWSERLESS_TOKEN?.trim()) {
    throw new Error("REMOTE_SCAN_NOT_CONFIGURED");
  }

  return runTrackingScript(request, {
    browserless: true,
    timeoutMs: 30_000,
    cacheTtlMin: 30
  });
}

async function runLocalTrackingScan(request: NormalizedScanRequest) {
  if (process.env.ENABLE_LOCAL_TRACKING_SCAN !== "1") {
    throw new Error("LOCAL_SCAN_DISABLED");
  }

  return runTrackingScript(request, {
    browserless: false,
    timeoutMs: 30_000,
    cacheTtlMin: 30
  });
}

async function runTrackingScript(
  request: NormalizedScanRequest,
  options: {
    browserless: boolean;
    timeoutMs: number;
    cacheTtlMin: number;
  }
) {
  const scriptPath = resolve(process.cwd(), "scripts", "tracking-checker-prototype", "check-tracking.mjs");
  const args = [scriptPath, request.url, "--cache-ttl-min", String(options.cacheTtlMin)];

  if (options.browserless) {
    args.push("--browserless");
  }

  if (request.autoConsent) {
    args.push("--auto-consent");
  }

  if (request.eventSelector) {
    args.push("--click", request.eventSelector);
  }

  const { stdout } = await execFileAsync(process.execPath, args, {
    timeout: options.timeoutMs,
    maxBuffer: 1024 * 1024 * 4,
    windowsHide: true
  });
  const raw = JSON.parse(stdout);

  return mapRawTrackingReport(raw, request);
}

function buildFixtureRawReport(url: string) {
  if (url.toLowerCase().includes("/samples/pass")) {
    return {
      url,
      finalUrl: url,
      status: "pass",
      detected: {
        ga4Ids: ["G-FIXTUREPASS1"],
        gtmIds: [],
        clarityIds: ["fixturepass"]
      },
      requests: {
        ga4Script: 1,
        gtmScript: 0,
        ga4Collect: 1,
        uaCollect: 0,
        clarityScript: 1,
        clarityCollect: 1,
        googleAdsConversion: 0
      },
      warnings: [],
      failedRequests: [],
      fixSuggestions: []
    };
  }

  if (url.toLowerCase().includes("/samples/fail")) {
    return {
      url,
      finalUrl: url,
      status: "fail",
      detected: {
        ga4Ids: [],
        gtmIds: [],
        clarityIds: []
      },
      requests: {
        ga4Script: 0,
        gtmScript: 0,
        ga4Collect: 0,
        uaCollect: 0,
        clarityScript: 0,
        clarityCollect: 0,
        googleAdsConversion: 0
      },
      warnings: ["No GA4, GTM, or Clarity IDs were detected"],
      failedRequests: [],
      fixSuggestions: ["Confirm whether this page is supposed to contain browser-side tracking."]
    };
  }

  return {
    url,
    finalUrl: url,
    status: "warning",
    detected: {
      ga4Ids: [],
      gtmIds: ["GTM-FIXTUREWARN"],
      clarityIds: []
    },
    requests: {
      ga4Script: 0,
      gtmScript: 0,
      ga4Collect: 0,
      uaCollect: 0,
      clarityScript: 0,
      clarityCollect: 0,
      googleAdsConversion: 0
    },
    warnings: [
      "GTM ID found, but no gtm.js script request was observed during page load",
      "GTM container found, but no GA4, UA, or Clarity collect request was observed during page load"
    ],
    failedRequests: [],
    fixSuggestions: [
      "Open GTM Preview or Tag Assistant to verify which tags fire from this container."
    ]
  };
}

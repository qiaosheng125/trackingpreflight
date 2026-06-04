import type { ReportStatus, SampleReport } from "../../sample-reports";
import type { NormalizedScanRequest } from "./scan-request";

type RawTrackingReport = {
  url?: string;
  finalUrl?: string;
  status?: string;
  detected?: {
    ga4Ids?: string[];
    gtmIds?: string[];
    clarityIds?: string[];
  };
  requests?: {
    ga4Script?: number;
    gtmScript?: number;
    ga4Collect?: number;
    uaCollect?: number;
    clarityScript?: number;
    clarityCollect?: number;
    googleAdsConversion?: number;
  };
  warnings?: string[];
  failedRequests?: unknown[];
  consentClickResults?: Array<{ result?: string }>;
  fixSuggestions?: string[];
  securityFindings?: string[];
};

export function mapRawTrackingReport(
  raw: RawTrackingReport,
  request: NormalizedScanRequest
): SampleReport {
  const status = normalizeStatus(raw.status);
  const detected = {
    ga4: cleanStringArray(raw.detected?.ga4Ids),
    gtm: cleanStringArray(raw.detected?.gtmIds),
    clarity: cleanStringArray(raw.detected?.clarityIds)
  };
  const requests = raw.requests ?? {};
  const failedCount = Array.isArray(raw.failedRequests) ? raw.failedRequests.length : 0;
  const consentClicks = (raw.consentClickResults ?? []).filter(
    (item) => item?.result === "clicked"
  ).length;
  const scriptCount =
    numberValue(requests.ga4Script) +
    numberValue(requests.gtmScript) +
    numberValue(requests.clarityScript);
  const collectCount =
    numberValue(requests.ga4Collect) +
    numberValue(requests.uaCollect) +
    numberValue(requests.clarityCollect) +
    numberValue(requests.googleAdsConversion);

  return {
    key: `scan-${status}`,
    label: labelForStatus(status),
    status,
    url: raw.url || request.url,
    finalUrl: raw.finalUrl || raw.url || request.url,
    detected,
    metrics: {
      scripts: scriptCount,
      collects: collectCount,
      failed: failedCount,
      consentClicks
    },
    findings: buildFindings(raw, detected, collectCount),
    nextSteps: buildNextSteps(raw, status),
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

function normalizeStatus(value: unknown): ReportStatus {
  if (value === "pass" || value === "warning" || value === "fail") {
    return value;
  }

  return "warning";
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function labelForStatus(status: ReportStatus) {
  if (status === "pass") {
    return "Visible tracking signals";
  }

  if (status === "warning") {
    return "Tracking needs review";
  }

  return "No visible tracking signal";
}

function buildFindings(
  raw: RawTrackingReport,
  detected: SampleReport["detected"],
  collectCount: number
) {
  const findings: string[] = [];

  if (detected.ga4.length || detected.gtm.length || detected.clarity.length) {
    findings.push("Supported tracking IDs were visible in the public page scan.");
  } else {
    findings.push("No supported GA4, GTM, UA, or Clarity ID was visible in this scan.");
  }

  if (collectCount > 0) {
    findings.push(`${collectCount} supported collect request(s) were observed.`);
  } else {
    findings.push("No supported collect request was observed during this browser session.");
  }

  for (const warning of raw.warnings ?? []) {
    findings.push(warning);
  }

  for (const securityFinding of raw.securityFindings ?? []) {
    findings.push(securityFinding);
  }

  return dedupe(findings);
}

function buildNextSteps(raw: RawTrackingReport, status: ReportStatus) {
  const suggestions = raw.fixSuggestions?.length ? raw.fixSuggestions : defaultSteps(status);

  return dedupe(suggestions);
}

function defaultSteps(status: ReportStatus) {
  if (status === "pass") {
    return [
      "Keep this report as a deploy baseline.",
      "Confirm business metrics in GA4 Realtime, DebugView, or the native analytics dashboard."
    ];
  }

  if (status === "warning") {
    return [
      "Check consent, GTM Preview, regional loading, or conditional tag settings.",
      "Run a second scan after selecting the most important event."
    ];
  }

  return [
    "Confirm whether this page is supposed to contain browser-side tracking.",
    "Install or enable GA4, GTM, or Clarity before expecting analytics data."
  ];
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.filter((item) => item.trim().length > 0)));
}

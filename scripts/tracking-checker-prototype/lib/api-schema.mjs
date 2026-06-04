import { buildPlainLanguageReport } from "./plain-language-report.mjs";

const maxUrlLength = 2048;
const maxSelectorLength = 200;
const maxCacheTtlMinutes = 1440;

export function validateScanRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return validationError("Request body must be an object");
  }

  const url = cleanString(input.url);
  if (!url) return validationError("URL is required");
  if (url.length > maxUrlLength) return validationError(`URL must be ${maxUrlLength} characters or fewer`);

  const parsedUrl = parseUrl(url);
  if (!parsedUrl.ok) return validationError(parsedUrl.message);

  const clickSelector = cleanString(input.clickSelector || input.selector || "");
  if (clickSelector.length > maxSelectorLength) {
    return validationError(`Click selector must be ${maxSelectorLength} characters or fewer`);
  }

  const cacheTtlMinutes = normalizeOptionalInteger(input.cacheTtlMinutes, 0, maxCacheTtlMinutes);
  if (cacheTtlMinutes.error) return validationError(cacheTtlMinutes.error);

  const allowFile = Boolean(input.allowFile);
  if (allowFile && input.environment !== "test") {
    return validationError("file:// scans are only allowed in test mode");
  }
  if (parsedUrl.protocol === "file:" && !allowFile) {
    return validationError("file:// URLs are disabled");
  }
  if (parsedUrl.protocol === "file:" && allowFile && input.environment !== "test") {
    return validationError("file:// scans are only allowed in test mode");
  }
  if (parsedUrl.protocol !== "file:" && !["http:", "https:"].includes(parsedUrl.protocol)) {
    return validationError("Only http and https URLs are allowed");
  }
  const port = parsedUrl.port || (parsedUrl.protocol === "https:" ? "443" : parsedUrl.protocol === "http:" ? "80" : "");
  if (parsedUrl.protocol !== "file:" && !["80", "443"].includes(port)) {
    return validationError("Only ports 80 and 443 are allowed");
  }

  return {
    ok: true,
    value: {
      url,
      clickSelector,
      cacheTtlMinutes: cacheTtlMinutes.value,
      allowFile,
    },
  };
}

function parseUrl(value) {
  try {
    const parsed = new URL(value);
    return { ok: true, protocol: parsed.protocol, port: parsed.port };
  } catch {
    return { ok: false, message: "Invalid URL" };
  }
}

export function toPublicError(error, code = "scan_error") {
  const message = error instanceof Error ? error.message : String(error || "");
  const publicMessages = [
    "Invalid URL",
    "URL is required",
    "Only http and https URLs are allowed",
    "Only ports 80 and 443 are allowed",
    "localhost URLs are blocked",
    "file:// URLs are disabled. Use --allow-file only for local fixtures.",
  ];

  if (message.startsWith("URL resolves to blocked IP address")) {
    return { ok: false, error: { code: "blocked_url", message: "URL resolves to a blocked or private IP address" } };
  }

  if (publicMessages.includes(message) || message.includes("characters or fewer") || message.includes("test mode")) {
    return { ok: false, error: { code, message } };
  }

  return {
    ok: false,
    error: {
      code,
      message: "The scan could not be completed. Please check the URL and try again.",
    },
  };
}

export function toPublicScanResponse(report) {
  return {
    ok: true,
    data: {
      url: report.url,
      finalUrl: report.finalUrl,
      status: report.status,
      detected: report.detected,
      requests: report.requests,
      warnings: report.warnings,
      plainLanguage: buildPlainLanguageReport(report),
      failedRequests: scrubRequestUrls(report.failedRequests || []),
      abortedTrackingRequests: scrubRequestUrls(report.abortedTrackingRequests || []),
      securityFindings: report.securityFindings || [],
      fixSuggestions: report.fixSuggestions,
      clickSelector: report.clickSelector,
      clickSelectors: report.clickSelectors || [],
      clickResult: report.clickResult,
      clickResults: report.clickResults || [],
      autoConsent: Boolean(report.autoConsent),
      consentClickResults: report.consentClickResults || [],
      cache: report.cache || null,
    },
  };
}

function cleanString(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function normalizeOptionalInteger(value, min, max) {
  if (value === undefined || value === null || value === "") return { value: 0 };
  const number = Number(value);
  if (!Number.isInteger(number)) return { error: "cacheTtlMinutes must be an integer" };
  if (number < min || number > max) return { error: `cacheTtlMinutes must be between ${min} and ${max}` };
  return { value: number };
}

function validationError(message) {
  return { ok: false, error: { code: "invalid_request", message } };
}

function scrubRequestUrls(requests) {
  return requests.map((request) => ({
    url: request.url,
    errorText: request.errorText || "",
  }));
}

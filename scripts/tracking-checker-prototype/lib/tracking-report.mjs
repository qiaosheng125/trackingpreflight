export const blockedResourcePatterns = [
  "*.jpg",
  "*.jpeg",
  "*.png",
  "*.webp",
  "*.avif",
  "*.mp4",
  "*.webm",
  "*.woff",
  "*.woff2",
  "*.ttf",
  "*.otf",
];

export function classifyRequest(url) {
  const lower = url.toLowerCase();
  if (lower.includes("googletagmanager.com/gtag/js")) return "ga4-script";
  if (lower.includes("googletagmanager.com/gtm.js")) return "gtm-script";
  if (lower.includes("google-analytics.com/g/collect")) return "ga4-collect";
  if (lower.includes("google-analytics.com/collect")) return "ua-collect";
  if (lower.includes("clarity.ms/tag/")) return "clarity-script";
  if (lower.includes("clarity.ms/collect") || lower.includes("c.clarity.ms/c.gif")) return "clarity-collect";
  if (lower.includes("googleadservices.com/pagead/conversion")) return "google-ads-conversion";
  return "";
}

export function extractIds(text, requestUrls) {
  const scriptSrcs = [...text.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter(Boolean);
  const observedTrackingText = [...requestUrls, ...scriptSrcs].join("\n");
  const ga4Ids = [...new Set(observedTrackingText.match(/\bG-[A-Z0-9]{6,}\b/g) ?? [])];
  const gtmIds = [...new Set(observedTrackingText.match(/\bGTM-[A-Z0-9]{4,}\b/g) ?? [])];
  const clarityIds = [
    ...new Set(
      [...observedTrackingText.matchAll(/clarity\.ms\/tag\/([a-z0-9]+)/gi)]
        .map((match) => match[1])
        .filter(Boolean),
    ),
  ];
  return { ga4Ids, gtmIds, clarityIds };
}

export function summarizeTracking(events, ids, failedRequests, options = {}) {
  const count = (type) => events.filter((event) => event.type === type).length;
  const warnings = [];
  const fixSuggestions = [];
  const abortedTrackingRequests = failedRequests.filter((request) => request.errorText === "net::ERR_ABORTED");
  const hardFailedRequests = failedRequests.filter(
    (request) => request.errorText && request.errorText !== "net::ERR_ABORTED",
  );
  const securityFindings = options.securityFindings || [];

  if (ids.ga4Ids.length > 1) {
    warnings.push(`Multiple GA4 IDs detected: ${ids.ga4Ids.join(", ")}`);
    fixSuggestions.push("Keep one primary GA4 Measurement ID unless duplicate installation is intentional.");
  }
  if (count("ga4-script") > 1) {
    warnings.push("Multiple gtag.js script requests detected");
    fixSuggestions.push("Check whether GA4 is installed both directly and through GTM.");
  }
  if (count("gtm-script") > 1) {
    warnings.push("Multiple GTM script requests detected");
    fixSuggestions.push("Remove duplicate GTM snippets from the theme, layout, or plugin settings.");
  }
  if (ids.gtmIds.length && count("gtm-script") === 0) {
    warnings.push("GTM ID found, but no gtm.js script request was observed during page load");
    fixSuggestions.push("Check whether the GTM snippet is blocked by consent, CSP, tag manager settings, or conditional loading.");
  }
  if (ids.ga4Ids.length && count("ga4-script") === 0 && count("ga4-collect") === 0) {
    warnings.push("GA4 ID found, but no gtag.js script request was observed during page load");
    fixSuggestions.push("Check whether the GA4 snippet is blocked, delayed, or only loaded after consent.");
  }
  if (hardFailedRequests.length) {
    warnings.push(`${hardFailedRequests.length} script or tracking requests failed`);
    fixSuggestions.push("Open the browser Network panel and inspect failed tracking script or collect requests.");
  }
  if (ids.ga4Ids.length && count("ga4-collect") === 0) {
    warnings.push("GA4 ID found, but no GA4 collect request was observed during page load");
    fixSuggestions.push("Verify that the GA4 data stream ID is correct and consent/banner settings are not blocking analytics.");
  }
  if (ids.clarityIds.length && count("clarity-collect") === 0) {
    warnings.push("Clarity ID found, but no Clarity collect request was observed during page load");
    fixSuggestions.push("Verify the Clarity project ID and check whether the script is blocked by consent or CSP.");
  }
  if (ids.gtmIds.length && !ids.ga4Ids.length && !ids.clarityIds.length && !hasKnownAnalyticsCollect(events)) {
    warnings.push("GTM container found, but no GA4, UA, or Clarity collect request was observed during page load");
    fixSuggestions.push(
      "Open GTM Preview or Tag Assistant to verify which tags fire from this container and whether consent blocks them.",
    );
  }
  if (!ids.ga4Ids.length && !ids.gtmIds.length && !ids.clarityIds.length) {
    warnings.push("No GA4, GTM, or Clarity IDs were detected");
    fixSuggestions.push("Install GA4, GTM, or Clarity before expecting analytics data.");
  }
  if (securityFindings.length) {
    warnings.push(`${securityFindings.length} blocked or private remote address was observed after navigation`);
    fixSuggestions.push("Do not scan URLs that redirect to private, localhost, or metadata addresses.");
  }

  const hasAnyTrackingId = ids.ga4Ids.length || ids.gtmIds.length || ids.clarityIds.length;
  const hasObservedCollect = count("ga4-collect") || count("clarity-collect") || count("ua-collect");
  const status = securityFindings.length
    ? "fail"
    : !hasAnyTrackingId
      ? "fail"
      : warnings.length
        ? "warning"
        : hasObservedCollect
          ? "pass"
          : "warning";

  return {
    status,
    detected: {
      ga4Ids: ids.ga4Ids,
      gtmIds: ids.gtmIds,
      clarityIds: ids.clarityIds,
    },
    requests: {
      ga4Script: count("ga4-script"),
      gtmScript: count("gtm-script"),
      ga4Collect: count("ga4-collect"),
      uaCollect: count("ua-collect"),
      clarityScript: count("clarity-script"),
      clarityCollect: count("clarity-collect"),
      googleAdsConversion: count("google-ads-conversion"),
    },
    warnings,
    failedRequests: hardFailedRequests,
    abortedTrackingRequests,
    securityFindings,
    fixSuggestions,
  };
}

function hasKnownAnalyticsCollect(events) {
  return events.some((event) => ["ga4-collect", "ua-collect", "clarity-collect"].includes(event.type));
}

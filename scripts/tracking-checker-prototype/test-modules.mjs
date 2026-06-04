import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { toPublicError, toPublicScanResponse, validateScanRequest } from "./lib/api-schema.mjs";
import { buildBrowserlessWsUrl, redactBrowserlessWsUrl } from "./lib/browserless-config.mjs";
import { buildConsentClickExpression, consentSelectors, consentTextPatterns, matchesConsentText } from "./lib/consent-clicks.mjs";
import { readCache, scanCacheKey, writeCache } from "./lib/file-cache.mjs";
import { escapeHtml } from "./lib/html-report.mjs";
import { checkRateLimit } from "./lib/rate-limit.mjs";
import { classifyRequest, extractIds, summarizeTracking } from "./lib/tracking-report.mjs";
import { isBlockedIp, validateTargetUrl } from "./lib/url-safety.mjs";

assert.equal(isBlockedIp("127.0.0.1"), true);
assert.equal(isBlockedIp("10.0.0.1"), true);
assert.equal(isBlockedIp("192.168.1.1"), true);
assert.equal(isBlockedIp("169.254.169.254"), true);
assert.equal(isBlockedIp("8.8.8.8"), false);

await assert.rejects(() => validateTargetUrl("http://127.0.0.1"), /blocked IP/);
await assert.rejects(() => validateTargetUrl("ftp://example.com"), /Only http and https/);
await assert.rejects(() => validateTargetUrl("https://example.com:8080"), /Only ports 80 and 443/);
await assert.rejects(() => validateTargetUrl("file:///tmp/example.html"), /file:\/\/ URLs are disabled/);
assert.equal((await validateTargetUrl("file:///tmp/example.html", { allowFile: true })).normalizedUrl, "file:///tmp/example.html");

assert.equal(classifyRequest("https://www.googletagmanager.com/gtag/js?id=G-ABC123456"), "ga4-script");
assert.equal(classifyRequest("https://www.google-analytics.com/g/collect?v=2"), "ga4-collect");
assert.equal(classifyRequest("https://c.clarity.ms/c.gif"), "clarity-collect");

const ids = extractIds(
  '<script src="https://www.clarity.ms/tag/x069827ts2"></script>',
  ["https://www.googletagmanager.com/gtag/js?id=G-DC6K2C83Y2"],
);
assert.deepEqual(ids.ga4Ids, ["G-DC6K2C83Y2"]);
assert.deepEqual(ids.clarityIds, ["x069827ts2"]);

const sampleTextIds = extractIds(
  '<main>Demo report: GA4 G-SAMPLE1234 and GTM-SAMPLE1 are examples only.</main>',
  ["https://www.googletagmanager.com/gtag/js?id=G-REAL12345"],
);
assert.deepEqual(sampleTextIds.ga4Ids, ["G-REAL12345"]);
assert.deepEqual(sampleTextIds.gtmIds, []);

const passReport = summarizeTracking(
  [
    { type: "ga4-script" },
    { type: "ga4-collect" },
    { type: "clarity-script" },
    { type: "clarity-collect" },
  ],
  { ga4Ids: ["G-DC6K2C83Y2"], gtmIds: [], clarityIds: ["x069827ts2"] },
  [],
);
assert.equal(passReport.status, "pass");

const failReport = summarizeTracking([], { ga4Ids: [], gtmIds: [], clarityIds: [] }, []);
assert.equal(failReport.status, "fail");

const warningReport = summarizeTracking([], { ga4Ids: ["G-AAAAAA1111", "G-BBBBBB2222"], gtmIds: [], clarityIds: [] }, []);
assert.equal(warningReport.status, "warning");
assert.equal(warningReport.warnings.some((warning) => warning.includes("Multiple GA4 IDs")), true);

const gtmOnlyWarning = summarizeTracking(
  [{ type: "gtm-script" }],
  { ga4Ids: [], gtmIds: ["GTM-ABCD123"], clarityIds: [] },
  [],
);
assert.equal(gtmOnlyWarning.status, "warning");
assert.equal(gtmOnlyWarning.warnings.some((warning) => warning.includes("GTM container found")), true);

const ga4IdWithoutScriptWarning = summarizeTracking(
  [],
  { ga4Ids: ["G-AAAAAA1111"], gtmIds: [], clarityIds: [] },
  [],
);
assert.equal(ga4IdWithoutScriptWarning.warnings.some((warning) => warning.includes("no gtag.js script request")), true);

const pageLoadIssueResponse = toPublicScanResponse({
  ...failReport,
  warnings: ["Navigation ended at an unsupported browser URL: chrome-error:"],
  fixSuggestions: ["Check whether the submitted URL redirects to a blocked, unsupported, or browser-internal page."],
});
assert.equal(pageLoadIssueResponse.data.plainLanguage.title, "The page could not be scanned");

const validRequest = validateScanRequest({
  url: " https://example.com ",
  clickSelector: " button ",
  cacheTtlMinutes: "60",
});
assert.equal(validRequest.ok, true);
assert.deepEqual(validRequest.value, {
  url: "https://example.com",
  clickSelector: "button",
  cacheTtlMinutes: 60,
  allowFile: false,
});
assert.equal(validateScanRequest({}).ok, false);
assert.equal(validateScanRequest({ url: "https://example.com:8080" }).ok, false);
assert.equal(validateScanRequest({ url: "ftp://example.com" }).ok, false);
assert.equal(validateScanRequest({ url: "file:///tmp/a.html", allowFile: true }).ok, false);
assert.equal(validateScanRequest({ url: "file:///tmp/a.html", allowFile: true, environment: "test" }).ok, true);
assert.equal(toPublicError(new Error("URL resolves to blocked IP address: 127.0.0.1")).error.code, "blocked_url");
assert.equal(toPublicError(new Error("Internal stack trace detail")).error.message.includes("could not be completed"), true);
assert.equal(toPublicScanResponse(passReport).ok, true);
assert.equal(typeof toPublicScanResponse(passReport).data.plainLanguage.title, "string");
assert.equal(toPublicScanResponse(passReport).data.plainLanguage.caveats.length > 0, true);
assert.equal(toPublicScanResponse(passReport).data.plainLanguage.supportedChecks.length > 0, true);
assert.equal(toPublicScanResponse(passReport).data.plainLanguage.notChecked.length > 0, true);
assert.equal(consentSelectors.includes("#onetrust-accept-btn-handler"), true);
assert.equal(consentTextPatterns.includes("accept all"), true);
assert.equal(buildConsentClickExpression().includes("document.querySelector"), true);
assert.equal(matchesConsentText("Accept all cookies"), true);
assert.equal(matchesConsentText("OK"), true);
assert.equal(matchesConsentText("Webinars & ebooks"), false);
assert.deepEqual(
  toPublicScanResponse({ ...passReport, autoConsent: true, consentClickResults: [{ result: "clicked" }] }).data
    .consentClickResults,
  [{ result: "clicked" }],
);
assert.equal(
  toPublicScanResponse({
    ...passReport,
    autoConsent: true,
    consentClickResults: [{ result: "clicked", text: "Accept all cookies" }],
  }).data.plainLanguage.findings.some((finding) => finding.includes("Auto consent clicked")),
  true,
);
assert.equal(
  toPublicScanResponse({
    ...passReport,
    autoConsent: true,
    consentClickResults: [{ result: "not-found" }],
  }).data.plainLanguage.findings.some((finding) => finding.includes("no supported consent button")),
  true,
);
assert.equal(
  toPublicScanResponse({
    ...passReport,
    autoConsent: true,
    consentClickResults: [{ result: "not-found" }],
  }).data.plainLanguage.nextSteps.some((step) => step.includes("consent button selector")),
  true,
);
assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
assert.throws(() => buildBrowserlessWsUrl({}), /BROWSERLESS_TOKEN/);
const browserlessUrl = buildBrowserlessWsUrl({ token: "secret-token", region: "sfo" });
assert.equal(browserlessUrl, "wss://production-sfo.browserless.io/?token=secret-token");
assert.equal(redactBrowserlessWsUrl(browserlessUrl), "wss://production-sfo.browserless.io/?token=REDACTED");

const tempDir = await mkdtemp(join(tmpdir(), "tracking-checker-test-"));
try {
  const key = scanCacheKey({ url: "https://example.com", clickSelector: "" });
  await writeCache(tempDir, key, { status: "cached" });
  assert.deepEqual(await readCache(tempDir, key, 60_000), { status: "cached" });

  const first = await checkRateLimit(tempDir, "ip_1", { limit: 2, windowMs: 60_000 });
  const second = await checkRateLimit(tempDir, "ip_1", { limit: 2, windowMs: 60_000 });
  const third = await checkRateLimit(tempDir, "ip_1", { limit: 2, windowMs: 60_000 });
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

console.log("Module tests passed");

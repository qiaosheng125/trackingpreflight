const {
  validatePublicScanUrl,
  validateResolvedPublicScanUrl
} = await import("../src/app/api/mock-scan/url-guard.ts");
const { parseScanRequest } = await import("../src/app/api/mock-scan/scan-request.ts");
const { checkRateLimit } = await import("../src/app/api/mock-scan/rate-limit.ts");
const {
  getCachedScan,
  releaseScanSlot,
  reserveScanSlot,
  setCachedScan
} = await import("../src/app/api/mock-scan/scan-control.ts");

const urlCases = [
  ["https://example.com/", true],
  ["http://example.com/", true],
  ["ftp://example.com/", false],
  ["http://localhost/", false],
  ["http://127.0.0.1/", false],
  ["http://192.168.1.1/", false],
  ["https://example.com:8443/", false]
];

for (const [url, expected] of urlCases) {
  const result = validatePublicScanUrl(url);

  if (result.ok !== expected) {
    throw new Error(`URL guard mismatch for ${url}: expected ${expected}, got ${result.ok}`);
  }
}

const validRequest = parseScanRequest({
  url: "https://example.com/",
  mode: "local",
  autoConsent: true,
  consentPreset: "auto-safe",
  eventPreset: "download",
  eventSelector: "a[download]"
});

if (!validRequest.ok) {
  throw new Error("Expected valid scan request");
}

if (validRequest.value.mode !== "local") {
  throw new Error("Expected local mode to be allowed by parser");
}

const invalidPreset = parseScanRequest({
  url: "https://example.com/",
  eventPreset: "not-real"
});

if (invalidPreset.ok) {
  throw new Error("Expected invalid event preset to be rejected");
}

const longSelector = parseScanRequest({
  url: "https://example.com/",
  eventSelector: "a".repeat(401)
});

if (longSelector.ok) {
  throw new Error("Expected long selector to be rejected");
}

const invalidMode = parseScanRequest({
  url: "https://example.com/",
  mode: "live"
});

if (invalidMode.ok) {
  throw new Error("Expected invalid mode to be rejected");
}

const remoteMode = parseScanRequest({
  url: "https://example.com/",
  mode: "remote"
});

if (!remoteMode.ok || remoteMode.value.mode !== "remote") {
  throw new Error("Expected remote mode to be accepted by parser");
}

const resolvedLocalhost = await validateResolvedPublicScanUrl("http://127.0.0.1/");

if (resolvedLocalhost.ok) {
  throw new Error("Expected resolved URL guard to reject local IPs");
}

for (let index = 0; index < 3; index += 1) {
  const result = checkRateLimit("minute-limit-test", 1_000);

  if (!result.ok) {
    throw new Error(`Expected minute-limit-test request ${index + 1} to pass`);
  }
}

const minuteLimit = checkRateLimit("minute-limit-test", 1_001);

if (minuteLimit.ok || minuteLimit.reason !== "minute") {
  throw new Error("Expected minute rate limit to reject the 4th request");
}

for (let index = 0; index < 3; index += 1) {
  const result = checkRateLimit("daily-limit-test", index * 61_000);

  if (!result.ok) {
    throw new Error(`Expected daily-limit-test request ${index + 1} to pass`);
  }
}

const dailyLimit = checkRateLimit("daily-limit-test", 3 * 61_000);

if (dailyLimit.ok || dailyLimit.reason !== "daily") {
  throw new Error("Expected daily rate limit to reject the 4th request");
}

const firstSlot = reserveScanSlot();
const secondSlot = reserveScanSlot();
const thirdSlot = reserveScanSlot();

if (!firstSlot.ok || !secondSlot.ok || thirdSlot.ok) {
  throw new Error("Expected scan concurrency limit to allow two slots and reject the third");
}

releaseScanSlot();
releaseScanSlot();

const cacheRequest = {
  url: "https://example.com/",
  mode: "fixture",
  autoConsent: false,
  consentPreset: null,
  consentSelector: null,
  eventPreset: null,
  eventSelector: null
};
const cacheReport = {
  key: "scan-warning",
  label: "Tracking needs review",
  status: "warning",
  url: "https://example.com/",
  finalUrl: "https://example.com/",
  detected: { ga4: [], gtm: [], clarity: [] },
  metrics: { scripts: 0, collects: 0, failed: 0, consentClicks: 0 },
  findings: ["test"],
  nextSteps: ["test"],
  input: cacheRequest
};

setCachedScan(cacheRequest, cacheReport, 2_000);

if (!getCachedScan(cacheRequest, 2_001)) {
  throw new Error("Expected scan cache hit");
}

console.log("API guard tests passed");

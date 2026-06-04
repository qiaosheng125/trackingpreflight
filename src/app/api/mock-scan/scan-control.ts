import type { SampleReport } from "../../sample-reports";
import type { NormalizedScanRequest } from "./scan-request";

type CacheEntry = {
  expiresAt: number;
  report: SampleReport;
};

const cache = new Map<string, CacheEntry>();
const maxConcurrentScans = Number(process.env.SCAN_MAX_CONCURRENT || 2);
const cacheTtlMs = Number(process.env.SCAN_CACHE_TTL_MS || 30 * 60_000);
let activeScans = 0;

export function reserveScanSlot() {
  if (activeScans >= maxConcurrentScans) {
    return {
      ok: false as const,
      activeScans,
      maxConcurrentScans
    };
  }

  activeScans += 1;

  return {
    ok: true as const,
    activeScans,
    maxConcurrentScans
  };
}

export function releaseScanSlot() {
  activeScans = Math.max(0, activeScans - 1);
}

export function getCachedScan(request: NormalizedScanRequest, now = Date.now()) {
  const key = cacheKey(request);
  const entry = cache.get(key);

  if (!entry || entry.expiresAt <= now) {
    cache.delete(key);
    return null;
  }

  return cloneReport(entry.report);
}

export function setCachedScan(request: NormalizedScanRequest, report: SampleReport, now = Date.now()) {
  cache.set(cacheKey(request), {
    expiresAt: now + cacheTtlMs,
    report: cloneReport(report)
  });
}

export function getScanControlState() {
  return {
    activeScans,
    maxConcurrentScans,
    cacheSize: cache.size,
    cacheTtlMs
  };
}

function cacheKey(request: NormalizedScanRequest) {
  return JSON.stringify({
    url: request.url,
    mode: request.mode,
    autoConsent: request.autoConsent,
    consentPreset: request.consentPreset,
    consentSelector: request.consentSelector,
    eventPreset: request.eventPreset,
    eventSelector: request.eventSelector
  });
}

function cloneReport(report: SampleReport) {
  return JSON.parse(JSON.stringify(report)) as SampleReport;
}

import { existsSync, readFileSync } from "node:fs";

const pairs = process.argv.slice(2);

if (!pairs.length) {
  console.error("Usage: node compare-consent-batch.mjs <base.json>::<auto.json> [...pairs]");
  process.exit(1);
}

const rows = [];
for (const pair of pairs) {
  const [baseFile, autoFile] = pair.split("::");
  if (!baseFile || !autoFile || !existsSync(baseFile) || !existsSync(autoFile)) {
    rows.push({ pair, error: "missing file" });
    continue;
  }
  const base = JSON.parse(readFileSync(baseFile, "utf8"));
  const auto = JSON.parse(readFileSync(autoFile, "utf8"));
  rows.push({
    site: base.finalUrl || base.url,
    consent: summarizeConsent(auto),
    baseCollect: totalCollect(base),
    autoCollect: totalCollect(auto),
    collectDiff: totalCollect(auto) - totalCollect(base),
    adsDiff: count(auto, "googleAdsConversion") - count(base, "googleAdsConversion"),
    warningDiff: (auto.warnings || []).length - (base.warnings || []).length,
  });
}

console.table(rows);

function summarizeConsent(report) {
  const result = report.consentClickResults?.[0];
  if (!report.autoConsent) return "off";
  if (!result) return "unknown";
  if (result.result === "clicked") return `clicked: ${result.text || result.selector || result.method || ""}`.slice(0, 80);
  return result.result || "not-found";
}

function totalCollect(report) {
  return count(report, "ga4Collect") + count(report, "uaCollect") + count(report, "clarityCollect");
}

function count(report, key) {
  return Number(report.requests?.[key] || 0);
}

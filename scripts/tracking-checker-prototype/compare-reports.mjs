import { readFileSync } from "node:fs";

const [baseFile, candidateFile] = process.argv.slice(2);

if (!baseFile || !candidateFile) {
  console.error("Usage: node compare-reports.mjs <base-report.json> <candidate-report.json>");
  process.exit(1);
}

const base = JSON.parse(readFileSync(baseFile, "utf8"));
const candidate = JSON.parse(readFileSync(candidateFile, "utf8"));

const comparison = {
  base: compactReport(base),
  candidate: compactReport(candidate),
  diff: {
    ga4Collect: count(candidate, "ga4Collect") - count(base, "ga4Collect"),
    uaCollect: count(candidate, "uaCollect") - count(base, "uaCollect"),
    clarityCollect: count(candidate, "clarityCollect") - count(base, "clarityCollect"),
    googleAdsConversion: count(candidate, "googleAdsConversion") - count(base, "googleAdsConversion"),
    warnings: (candidate.warnings || []).length - (base.warnings || []).length,
  },
};

console.log(JSON.stringify(comparison, null, 2));

function compactReport(report) {
  return {
    status: report.status,
    finalUrl: report.finalUrl,
    requests: {
      ga4Collect: count(report, "ga4Collect"),
      uaCollect: count(report, "uaCollect"),
      clarityCollect: count(report, "clarityCollect"),
      googleAdsConversion: count(report, "googleAdsConversion"),
    },
    warnings: (report.warnings || []).length,
    autoConsent: Boolean(report.autoConsent),
    consentClickResults: report.consentClickResults || [],
  };
}

function count(report, key) {
  return Number(report.requests?.[key] || 0);
}

import { readFileSync } from "node:fs";

const files = process.argv.slice(2);

if (!files.length) {
  console.error("Usage: node summarize-reports.mjs <report.json> [...report.json]");
  process.exit(1);
}

const rows = files.map((file) => {
  const report = JSON.parse(readFileSync(file, "utf8"));
  return {
    file,
    status: report.status || "",
    finalUrl: report.finalUrl || report.url || "",
    tools: summarizeTools(report.detected || {}),
    warnings: (report.warnings || []).length,
    failedRequests: (report.failedRequests || []).length,
    securityFindings: (report.securityFindings || []).length,
  };
});

console.table(rows);

function summarizeTools(detected) {
  const parts = [];
  if (detected.ga4Ids?.length) parts.push(`GA4:${detected.ga4Ids.length}`);
  if (detected.gtmIds?.length) parts.push(`GTM:${detected.gtmIds.length}`);
  if (detected.clarityIds?.length) parts.push(`Clarity:${detected.clarityIds.length}`);
  return parts.join(" ") || "none";
}

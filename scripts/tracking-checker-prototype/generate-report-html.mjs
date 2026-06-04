import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { toPublicScanResponse } from "./lib/api-schema.mjs";
import { renderHtmlReport } from "./lib/html-report.mjs";

const reportFile = process.argv[2];
const outFile = process.argv[3] || "00_工具脚本/tracking-checker-prototype/reports/report-preview.html";

if (!reportFile) {
  console.error("Usage: node generate-report-html.mjs <report.json> [out.html]");
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportFile, "utf8"));
const publicReport = toPublicScanResponse(report).data;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, renderHtmlReport(publicReport), "utf8");
console.log(outFile);

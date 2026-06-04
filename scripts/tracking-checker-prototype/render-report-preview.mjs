import { readFileSync } from "node:fs";
import { toPublicScanResponse } from "./lib/api-schema.mjs";

const reportFile = process.argv[2];

if (!reportFile) {
  console.error("Usage: node render-report-preview.mjs <report.json>");
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportFile, "utf8"));
const response = toPublicScanResponse(report);

process.stdout.write(`${JSON.stringify(response.data.plainLanguage, null, 2)}\n`);

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { toPublicScanResponse } from "./lib/api-schema.mjs";
import { readCache, scanCacheKey, writeCache } from "./lib/file-cache.mjs";
import { renderHtmlReport } from "./lib/html-report.mjs";
import { scanUrl, scanUrlWithBrowserless } from "./lib/scan-url.mjs";

const args = process.argv.slice(2);
const targetUrl = args[0];
const clickIndex = args.indexOf("--click");
const clickSelector = clickIndex >= 0 ? args[clickIndex + 1] : "";
const clickSelectors = collectOptionValues(args, "--click");
const debug = args.includes("--debug");
const allowFile = args.includes("--allow-file");
const autoConsent = args.includes("--auto-consent");
const browserless = args.includes("--browserless");
const outIndex = args.indexOf("--out");
const outFile = outIndex >= 0 ? args[outIndex + 1] : "";
const htmlOutIndex = args.indexOf("--html-out");
const htmlOutFile = htmlOutIndex >= 0 ? args[htmlOutIndex + 1] : "";
const cacheTtlIndex = args.indexOf("--cache-ttl-min");
const cacheTtlMin = cacheTtlIndex >= 0 ? Number(args[cacheTtlIndex + 1] || 0) : 0;
const cacheDir = process.env.TRACKING_CHECKER_CACHE_DIR ||
  (process.env.VERCEL ? "/tmp/tracking-checker-cache" : ".cache/tracking-checker");

if (!targetUrl) {
  console.error(
    "Usage: node check-tracking.mjs https://www.example.com [--browserless] [--auto-consent] [--click \"selector\"] [--out report.json] [--html-out report.html] [--cache-ttl-min 60]",
  );
  process.exit(1);
}

try {
  const cacheKey = scanCacheKey({
    url: targetUrl,
    clickSelector: `${autoConsent ? "auto-consent -> " : ""}${clickSelectors.join(" -> ") || clickSelector}`,
  });
  const cached = await readCache(cacheDir, cacheKey, cacheTtlMin * 60 * 1000);
  const scanOptions = { clickSelector, clickSelectors, debug, allowFile, autoConsent };
  const report = cached || (browserless
    ? await scanUrlWithBrowserless(targetUrl, scanOptions)
    : await scanUrl(targetUrl, scanOptions));
  if (!cached && cacheTtlMin > 0) await writeCache(cacheDir, cacheKey, report);
  if (cached) report.cache = { hit: true, ttlMinutes: cacheTtlMin };

  const reportText = JSON.stringify(report, null, 2);
  if (outFile) {
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, `${reportText}\n`, "utf8");
    console.error(`[report] ${outFile}`);
  }
  if (htmlOutFile) {
    const publicReport = toPublicScanResponse(report).data;
    mkdirSync(dirname(htmlOutFile), { recursive: true });
    writeFileSync(htmlOutFile, renderHtmlReport(publicReport), "utf8");
    console.error(`[html] ${htmlOutFile}`);
  }
  process.stdout.write(`${reportText}\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function collectOptionValues(argv, optionName) {
  const values = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === optionName && argv[i + 1]) values.push(argv[i + 1]);
  }
  return values;
}

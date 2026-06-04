const sharedFleetHosts = {
  sfo: "production-sfo.browserless.io",
  lon: "production-lon.browserless.io",
  ams: "production-ams.browserless.io",
};

export function buildBrowserlessWsUrl(options = {}) {
  const token = String(options.token || process.env.BROWSERLESS_TOKEN || "").trim();
  if (!token) throw new Error("BROWSERLESS_TOKEN is required");

  const region = String(options.region || process.env.BROWSERLESS_REGION || "sfo").trim().toLowerCase();
  const host = options.host || sharedFleetHosts[region];
  if (!host) throw new Error(`Unsupported Browserless region: ${region}`);

  const browser = String(options.browser || process.env.BROWSERLESS_BROWSER || "chromium").trim().toLowerCase();
  if (!["chromium", "chrome"].includes(browser)) {
    throw new Error(`Unsupported Browserless browser: ${browser}`);
  }

  const url = new URL(`wss://${host}`);
  if (browser === "chrome") url.pathname = "/chrome";
  url.searchParams.set("token", token);
  return url.toString();
}

export function redactBrowserlessWsUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (url.searchParams.has("token")) url.searchParams.set("token", "REDACTED");
  return url.toString();
}

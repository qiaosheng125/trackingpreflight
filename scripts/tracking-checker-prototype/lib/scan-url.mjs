import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildBrowserlessWsUrl, redactBrowserlessWsUrl } from "./browserless-config.mjs";
import { buildConsentClickExpression } from "./consent-clicks.mjs";
import { createCdpClient, createPage, createPageSession, getBrowserWebSocketUrl, sleep } from "./cdp-client.mjs";
import { blockedResourcePatterns, classifyRequest, extractIds, summarizeTracking } from "./tracking-report.mjs";
import { validateTargetUrl } from "./url-safety.mjs";

const defaultChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function randomDebugPort() {
  return 9400 + Math.floor(Math.random() * 400);
}

export async function scanUrl(targetUrl, options = {}) {
  const chromePath = options.chromePath || defaultChromePath;
  const debugPort = options.debugPort || randomDebugPort();
  const clickSelector = options.clickSelector || "";
  const clickSelectors = Array.isArray(options.clickSelectors) && options.clickSelectors.length
    ? options.clickSelectors
    : clickSelector
      ? [clickSelector]
      : [];
  const allowFile = Boolean(options.allowFile);
  const autoConsent = Boolean(options.autoConsent);
  const debug = Boolean(options.debug);
  const browserWebSocketUrl = options.browserWebSocketUrl || "";
  const useRemoteBrowser = Boolean(browserWebSocketUrl);
  const loadWaitMs = Number(options.loadWaitMs || 9000);
  const clickWaitMs = Number(options.clickWaitMs || 4000);
  const logDebug = (message) => {
    if (debug) console.error(`[debug] ${message}`);
  };

  const validation = await validateTargetUrl(targetUrl, { allowFile });
  let chrome;
  if (!useRemoteBrowser) {
    const profileDir = mkdtempSync(join(tmpdir(), "tracking-checker-"));
    chrome = spawn(
      chromePath,
      [
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${profileDir}`,
        "--new-window",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-sync",
        "--disable-extensions",
        "--disable-features=SignInPromo,SigninInterception,ChromeWhatsNewUI",
        "about:blank",
      ],
      { detached: true, stdio: "ignore" },
    );
    chrome.unref();
  }

  const requestEvents = [];
  const failedRequests = [];
  const requestUrls = [];
  let browserCdp;
  let cdp;

  try {
    logDebug(useRemoteBrowser ? `connecting to remote browser ${redactBrowserlessWsUrl(browserWebSocketUrl)}` : "waiting for Chrome DevTools endpoint");
    const activeBrowserWebSocketUrl = useRemoteBrowser ? browserWebSocketUrl : await getBrowserWebSocketUrl(debugPort);
    browserCdp = createCdpClient(activeBrowserWebSocketUrl);
    await browserCdp.ready;

    logDebug("creating tab");
    if (useRemoteBrowser) {
      cdp = await createPageSession(browserCdp);
    } else {
      const tab = await createPage(debugPort);
      cdp = createCdpClient(tab.webSocketDebuggerUrl);
    }
    await cdp.ready;

    cdp.on("Network.requestWillBeSent", (params) => {
      const url = params.request?.url ?? "";
      const type = classifyRequest(url);
      if (type) {
        requestEvents.push({
          requestId: params.requestId,
          type,
          url,
          method: params.request?.method,
          ts: Date.now(),
        });
      }
      requestUrls.push(url);
    });

    cdp.on("Network.loadingFailed", (params) => {
      const request = requestEvents.find((event) => event.requestId === params.requestId);
      if (request) failedRequests.push({ url: request.url, errorText: params.errorText });
    });

    await cdp.send("Network.enable");
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.setBlockedURLs", { urls: blockedResourcePatterns });

    logDebug(`navigating to ${validation.normalizedUrl}`);
    await cdp.send("Page.navigate", { url: validation.normalizedUrl });
    await sleep(loadWaitMs);

    const consentClickResults = [];
    if (autoConsent) {
      const consentEval = await cdp.send("Runtime.evaluate", {
        expression: buildConsentClickExpression(),
        awaitPromise: true,
        returnByValue: true,
      });
      consentClickResults.push(consentEval.result?.value || { result: "unknown" });
      await sleep(clickWaitMs);
    }

    const clickResults = [];
    for (const selector of clickSelectors) {
      const clickEval = await cdp.send("Runtime.evaluate", {
        expression: `
          (() => {
            const element = document.querySelector(${JSON.stringify(selector)});
            if (!element) return "not-found";
            element.click();
            return "clicked";
          })()
        `,
        awaitPromise: true,
        returnByValue: true,
      });
      clickResults.push({
        selector,
        result: clickEval.result?.value || "unknown",
      });
      await sleep(clickWaitMs);
    }

    const htmlResult = await cdp.send("Runtime.evaluate", {
      expression: "document.documentElement.outerHTML",
      returnByValue: true,
    });
    const finalUrlResult = await cdp.send("Runtime.evaluate", {
      expression: "location.href",
      returnByValue: true,
    });
    const html = htmlResult.result?.value ?? "";
    const finalUrl = finalUrlResult.result?.value ?? validation.normalizedUrl;
    if (!isAllowedFinalUrl(finalUrl, { allowFile })) {
      const securityFindings = await validateObservedRequestOrigins(requestUrls, { allowFile });
      const ids = extractIds(html, requestUrls);
      const summary = summarizeTracking(requestEvents, ids, failedRequests, { securityFindings });
      return {
        url: validation.normalizedUrl,
        finalUrl,
        resolvedAddresses: validation.resolvedAddresses,
        clickSelector: clickSelectors[0] || null,
        clickSelectors,
        clickResult: clickResults[0]?.result || null,
        clickResults,
        autoConsent,
        consentClickResults,
        ...summary,
        status: "fail",
        warnings: [`Navigation ended at an unsupported browser URL: ${safeProtocol(finalUrl) || "unknown"}`],
        fixSuggestions: ["Check whether the submitted URL redirects to a blocked, unsupported, or browser-internal page."],
      };
    }
    if (!allowFile && finalUrl !== validation.normalizedUrl) {
      await validateTargetUrl(finalUrl, { allowFile: false });
    }

    const securityFindings = await validateObservedRequestOrigins(requestUrls, { allowFile });
    const ids = extractIds(html, requestUrls);
    const summary = summarizeTracking(requestEvents, ids, failedRequests, { securityFindings });

    return {
      url: validation.normalizedUrl,
      finalUrl,
      resolvedAddresses: validation.resolvedAddresses,
      clickSelector: clickSelectors[0] || null,
      clickSelectors,
      clickResult: clickResults[0]?.result || null,
      clickResults,
      autoConsent,
      consentClickResults,
      ...summary,
    };
  } finally {
    if (cdp) cdp.close();
    if (browserCdp) {
      await browserCdp.send("Browser.close").catch(() => {});
      browserCdp.close();
    }
  }
}

export async function scanUrlWithBrowserless(targetUrl, options = {}) {
  return scanUrl(targetUrl, {
    ...options,
    browserWebSocketUrl: options.browserWebSocketUrl || buildBrowserlessWsUrl(options.browserless)
  });
}

function isAllowedFinalUrl(finalUrl, options = {}) {
  try {
    const parsed = new URL(finalUrl);
    if (parsed.protocol === "file:") return Boolean(options.allowFile);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function safeProtocol(finalUrl) {
  try {
    return new URL(finalUrl).protocol;
  } catch {
    return "";
  }
}

async function validateObservedRequestOrigins(requestUrls, options = {}) {
  const origins = new Map();
  for (const rawUrl of requestUrls) {
    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch {
      continue;
    }
    if (!["http:", "https:", "file:"].includes(parsed.protocol)) continue;
    if (parsed.protocol === "file:" && options.allowFile) continue;
    origins.set(parsed.origin, `${parsed.protocol}//${parsed.host}/`);
  }

  const findings = [];
  for (const [origin, originUrl] of origins) {
    try {
      await validateTargetUrl(originUrl, { allowFile: false });
    } catch (error) {
      findings.push({
        origin,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return findings;
}

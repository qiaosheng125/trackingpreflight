export function buildPlainLanguageReport(report) {
  const status = report.status || "warning";
  const detectedTools = detectedToolNames(report.detected || {});
  const hasCollect = Boolean(
    report.requests?.ga4Collect || report.requests?.uaCollect || report.requests?.clarityCollect,
  );
  const pageLoadIssue = (report.warnings || []).some((warning) =>
    String(warning).includes("unsupported browser URL"),
  );

  return {
    title: titleForStatus(status, detectedTools, hasCollect, pageLoadIssue),
    summary: summaryForStatus(status, detectedTools, hasCollect, pageLoadIssue),
    findings: buildFindings(report, detectedTools),
    nextSteps: buildNextSteps(report),
    supportedChecks: [
      "Public page load for the submitted URL",
      "GA4, GTM, and Clarity identifiers visible during the scan",
      "Script requests for gtag.js, gtm.js, and Clarity",
      "Observed GA4, Universal Analytics, and Clarity collect requests",
      "Optional single-click flow when a CSS selector is provided",
    ],
    notChecked: [
      "GA4 dashboard processing or attribution correctness",
      "Shopify checkout or purchase events behind protected flows",
      "Logged-in pages, private pages, or user-specific journeys",
      "Meta, TikTok, Pinterest, LinkedIn, and other ad pixels in this MVP",
      "Whether standard GA4 reports will update after processing delay",
    ],
    caveats: [
      "This scan only checks the public page load and optional click flow.",
      "A missing collect request can be caused by consent settings, delayed tags, region rules, CSP, or tag conditions.",
      "This does not prove whether GA4, GTM, or Clarity data was finally processed in the vendor dashboard.",
    ],
  };
}

function titleForStatus(status, detectedTools, hasCollect, pageLoadIssue) {
  if (pageLoadIssue) return "The page could not be scanned";
  if (status === "pass") return "Tracking requests were observed";
  if (status === "fail") return detectedTools.length ? "Tracking could not be confirmed" : "No supported tracking tools were detected";
  if (detectedTools.length && !hasCollect) return "Tracking tools were found, but no collect request was observed";
  return "Tracking setup needs review";
}

function summaryForStatus(status, detectedTools, hasCollect, pageLoadIssue) {
  if (pageLoadIssue) {
    return "The browser ended on an unsupported internal page before the tracking check could be completed.";
  }
  const toolText = detectedTools.length ? detectedTools.join(", ") : "GA4, GTM, or Clarity";
  const verb = detectedTools.length === 1 ? "was" : "were";
  if (status === "pass") {
    return `${toolText} appeared to load and send at least one analytics request during this scan.`;
  }
  if (status === "fail") {
    return `This scan did not find supported ${toolText} signals on the public page.`;
  }
  if (!hasCollect) {
    return `${toolText} ${verb} detected, but the scanner did not observe a GA4, UA, or Clarity collect request during the scan window.`;
  }
  return `${toolText} ${verb} detected, but one or more setup warnings should be reviewed.`;
}

function buildFindings(report, detectedTools) {
  const findings = [];
  if (detectedTools.length) findings.push(`Detected tools: ${detectedTools.join(", ")}.`);
  else findings.push("No GA4, GTM, or Clarity identifiers were detected.");

  const requests = report.requests || {};
  findings.push(
    `Observed requests: GA4 collect ${requests.ga4Collect || 0}, UA collect ${requests.uaCollect || 0}, Clarity collect ${
      requests.clarityCollect || 0
    }.`,
  );
  if (report.autoConsent) {
    const consentResult = report.consentClickResults?.[0];
    if (consentResult?.result === "clicked") {
      findings.push(
        `Auto consent clicked: ${consentResult.text || consentResult.selector || "a detected consent control"}.`,
      );
    } else {
      findings.push("Auto consent was enabled, but no supported consent button was found.");
    }
  }

  for (const warning of report.warnings || []) findings.push(warning);
  for (const failed of report.failedRequests || []) findings.push(`Failed tracking request: ${failed.errorText || "unknown error"}.`);
  return findings;
}

function buildNextSteps(report) {
  const suggestions = [...(report.fixSuggestions || [])];
  if (report.autoConsent && report.consentClickResults?.[0]?.result === "not-found") {
    suggestions.push("If the page has a cookie banner, provide the consent button selector manually and scan again.");
  }
  if (suggestions.length) return suggestions;

  if (report.status === "pass") {
    return ["Open the vendor dashboard and confirm the event appears in realtime or debug reporting."];
  }

  return ["Check the tag installation, consent settings, and browser Network panel for blocked tracking requests."];
}

function detectedToolNames(detected) {
  const tools = [];
  if (detected.ga4Ids?.length) tools.push(`GA4 (${detected.ga4Ids.join(", ")})`);
  if (detected.gtmIds?.length) tools.push(`GTM (${detected.gtmIds.join(", ")})`);
  if (detected.clarityIds?.length) tools.push(`Clarity (${detected.clarityIds.join(", ")})`);
  return tools;
}

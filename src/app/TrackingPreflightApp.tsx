"use client";

import { useEffect, useMemo, useState } from "react";
import { reports, type ReportStatus, type SampleReport } from "./sample-reports";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const statusText: Record<ReportStatus, string> = {
  pass: "Likely installed",
  warning: "Needs review",
  fail: "No visible signal"
};

const consentPresets = [
  {
    key: "auto-safe",
    label: "Auto-detect safe consent",
    selector: "#onetrust-accept-btn-handler"
  },
  {
    key: "onetrust",
    label: "OneTrust accept all",
    selector: "#onetrust-accept-btn-handler"
  },
  {
    key: "cookiebot",
    label: "Cookiebot accept",
    selector: "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"
  },
  {
    key: "manual",
    label: "Use custom selector",
    selector: ""
  }
];

const eventPresets = [
  {
    key: "signup",
    label: "Signup or start button",
    selector: "a[href*='signup'], button[data-testid*='signup'], .signup-button"
  },
  {
    key: "download",
    label: "Download button",
    selector: "a[download], a[href*='download'], .download-button"
  },
  {
    key: "pricing",
    label: "Pricing link",
    selector: "a[href*='pricing']"
  },
  {
    key: "outbound",
    label: "Outbound link",
    selector: "a[target='_blank']"
  },
  {
    key: "manual",
    label: "Use custom selector",
    selector: ""
  }
];

const scanModes = [
  {
    key: "local",
    label: "Local browser scan",
    description: "Dev-only real browser scan. Requires local scan mode to be enabled."
  },
  {
    key: "remote",
    label: "Remote browser scan",
    description: "Real browser scan through Browserless. Requires remote scan to be enabled."
  }
] as const;

type ScanMode = (typeof scanModes)[number]["key"];

type HealthState = {
  localScanEnabled: boolean;
  remoteScanEnabled: boolean;
  remoteScanConfigured: boolean;
  environment: string;
} | null;

const supportEmail = "support@trackingpreflight.com";
const liveScanRequestHref =
  `mailto:${supportEmail}?subject=${encodeURIComponent("Live scan access request")}` +
  `&body=${encodeURIComponent(
    [
      "Hi Tracking Preflight team,",
      "",
      "I want to test live browser scanning for my website.",
      "",
      "Website URL:",
      "What I need to verify: GA4 / GTM / Clarity / consent / conversion event",
      "",
      "Thanks"
    ].join("\n")
  )}`;

export default function TrackingPreflightApp() {
  const [selectedKey, setSelectedKey] = useState(reports[0].key);
  const [url, setUrl] = useState("https://www.example.com/");
  const [scanMode, setScanMode] = useState<ScanMode>("remote");
  const [autoConsent, setAutoConsent] = useState(true);
  const [eventPreset, setEventPreset] = useState(eventPresets[0].key);
  const [consentPreset, setConsentPreset] = useState(consentPresets[0].key);
  const [eventSelector, setEventSelector] = useState(eventPresets[0].selector);
  const [consentSelector, setConsentSelector] = useState(consentPresets[0].selector);
  const [submittedUrl, setSubmittedUrl] = useState(reports[0].url);
  const [liveReport, setLiveReport] = useState<SampleReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [health, setHealth] = useState<HealthState>(null);

  const selectedReport = useMemo(
    () => reports.find((item) => item.key === selectedKey) ?? reports[0],
    [selectedKey]
  );
  const report = liveReport ?? selectedReport;

  useEffect(() => {
    let cancelled = false;

    fetch("/api/health")
      .then((response) => response.json())
      .then((data: {
        localScanEnabled?: boolean;
        remoteScanEnabled?: boolean;
        remoteScanConfigured?: boolean;
        environment?: string;
      }) => {
        if (!cancelled) {
          setHealth({
            localScanEnabled: Boolean(data.localScanEnabled),
            remoteScanEnabled: Boolean(data.remoteScanEnabled),
            remoteScanConfigured: Boolean(data.remoteScanConfigured),
            environment: data.environment || "unknown"
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHealth({
            localScanEnabled: false,
            remoteScanEnabled: false,
            remoteScanConfigured: false,
            environment: "unknown"
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function runPreflightScan() {
    if (scanMode === "local" && health?.localScanEnabled === false) {
      setScanError("Local browser scanning is disabled for this environment.");
      trackEvent("scan_blocked", {
        scan_mode: scanMode,
        reason: "local_disabled"
      });
      return;
    }

    if (scanMode === "remote" && !isRemoteScanAvailable(health)) {
      setScanError("Remote browser scanning is not enabled yet.");
      trackEvent("scan_blocked", {
        scan_mode: scanMode,
        reason: "remote_disabled"
      });
      return;
    }

    trackEvent("scan_submit", {
      scan_mode: scanMode,
      host: safeHost(url),
      auto_consent: autoConsent
    });
    setIsScanning(true);
    setScanError("");
    setCopyNotice("");

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url,
          mode: scanMode,
          autoConsent,
          consentPreset,
          consentSelector,
          eventPreset,
          eventSelector
        })
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorBody?.error || "Scan failed");
      }

      const nextReport = (await response.json()) as SampleReport;
      setLiveReport(nextReport);
      setSubmittedUrl(nextReport.finalUrl);
      trackEvent("scan_success", {
        scan_mode: scanMode,
        host: safeHost(nextReport.finalUrl),
        report_status: nextReport.status
      });
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Scan failed");
      trackEvent("scan_error", {
        scan_mode: scanMode,
        host: safeHost(url)
      });
    } finally {
      setIsScanning(false);
    }
  }

  async function copyReportSummary() {
    const summary = [
      `Tracking Install Checker report`,
      `Status: ${statusText[report.status]}`,
      `URL: ${report.finalUrl}`,
      `GA4: ${report.detected.ga4.length ? report.detected.ga4.join(", ") : "not visible"}`,
      `GTM: ${report.detected.gtm.length ? report.detected.gtm.join(", ") : "not visible"}`,
      `Clarity: ${report.detected.clarity.length ? report.detected.clarity.join(", ") : "not visible"}`,
      ``,
      `Findings:`,
      ...report.findings.map((item) => `- ${item}`),
      ``,
      `Next steps:`,
      ...report.nextSteps.map((item) => `- ${item}`)
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopyNotice("Summary copied");
      trackEvent("report_copy", {
        report_status: report.status,
        report_type: liveReport ? "real" : "demo"
      });
    } catch {
      setCopyNotice("Copy failed. Select the report text manually.");
    }
  }

  function downloadReportJson() {
    const payload = {
      generatedAt: new Date().toISOString(),
      report
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = href;
    anchor.download = `tracking-report-${report.status}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
    trackEvent("report_download", {
      report_status: report.status,
      report_type: liveReport ? "real" : "demo"
    });
  }

  return (
    <main>
      <header className="topBar">
        <a className="brand" href="#top" aria-label="Tracking Preflight home">
          <span className="brandMark" aria-hidden="true" />
          Tracking Preflight
        </a>
        <nav className="navLinks" aria-label="Primary navigation">
          <a href="#report">Report</a>
          <a href="#limits">Limits</a>
          <a href="#workflow">Workflow</a>
          <a href="/samples">Samples</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>

      <section className="workspace" id="top">
        <div className="intro">
          <p className="eyebrow">GA4 / GTM / Clarity public page preflight</p>
          <h1>See what a tracking preflight report will check before launch.</h1>
          <p>
            Run a limited real browser scan for a public page, then compare the result with sample
            reports for GA4, GTM, Clarity, consent, and conversion tracking issues.
          </p>
        </div>

        <div className="toolGrid">
          {isRealScanAvailable(health) ? (
          <section className="scanPanel" aria-label="Real scan setup">
            <div className="panelTitle">
              <h2>Run real preflight</h2>
              <span>Limited MVP</span>
            </div>

            <label className="field">
              <span>Public page URL</span>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                inputMode="url"
                placeholder="https://www.example.com/"
              />
            </label>

            <label className="field">
              <span>Scan mode</span>
              <select
                value={scanMode}
                onChange={(event) => {
                  const nextMode = event.target.value as ScanMode;
                  setScanMode(nextMode);

                  if (nextMode === "local") {
                    setUrl("https://www.aiwallpaperprompts.com/");
                  }

                  if (nextMode === "remote") {
                    setUrl("https://www.example.com/");
                  }
                }}
              >
                {scanModes
                  .filter((mode) => mode.key === "local" ? health?.localScanEnabled : isRemoteScanAvailable(health))
                  .map((mode) => (
                  <option key={mode.key} value={mode.key}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="modeHint">
              {scanModes.find((mode) => mode.key === scanMode)?.description}
            </p>
            {scanMode === "local" && health?.localScanEnabled === false ? (
              <p className="modeWarning">Local browser scanning is not enabled in this environment.</p>
            ) : null}
            {scanMode === "remote" && !isRemoteScanAvailable(health) ? (
              <p className="modeWarning">Remote browser scanning is not enabled in this environment.</p>
            ) : null}

            <div className="switchLine">
              <button
                className={autoConsent ? "switch isOn" : "switch"}
                type="button"
                onClick={() => setAutoConsent((value) => !value)}
                aria-pressed={autoConsent}
              >
                <span />
              </button>
              <div>
                <strong>Auto consent</strong>
                <p>Try safe cookie banner clicks before measuring post-consent events.</p>
              </div>
            </div>

            <label className="field">
              <span>Consent mode</span>
              <select
                value={consentPreset}
                onChange={(event) => {
                  const nextPreset = consentPresets.find((item) => item.key === event.target.value);
                  setConsentPreset(event.target.value);
                  setConsentSelector(nextPreset?.selector ?? "");
                }}
              >
                {consentPresets.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Advanced consent selector</span>
              <input
                value={consentSelector}
                onChange={(event) => setConsentSelector(event.target.value)}
                placeholder="#onetrust-accept-btn-handler"
              />
            </label>

            <label className="field">
              <span>Event to test</span>
              <select
                value={eventPreset}
                onChange={(event) => {
                  const nextPreset = eventPresets.find((item) => item.key === event.target.value);
                  setEventPreset(event.target.value);
                  setEventSelector(nextPreset?.selector ?? "");
                }}
              >
                {eventPresets.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Advanced event selector</span>
              <input
                value={eventSelector}
                onChange={(event) => setEventSelector(event.target.value)}
                placeholder=".signup-button"
              />
            </label>

            <div className="buttonRow">
              <button
                className="primaryButton"
                type="button"
                onClick={runPreflightScan}
                disabled={
                  isScanning ||
                  (scanMode === "local" && health?.localScanEnabled === false) ||
                  (scanMode === "remote" && !isRemoteScanAvailable(health))
                }
              >
                {isScanning ? "Scanning..." : "Run preflight"}
              </button>
              <button
                className="secondaryButton"
                type="button"
                onClick={() => {
                  setUrl(report.url);
                  setSubmittedUrl(report.url);
                  setLiveReport(null);
                }}
              >
                Load sample URL
              </button>
            </div>

            <p className="finePrint">
              Free preview limit: 3 real scans per day, 30 second timeout, cached results for
              repeated URLs.
            </p>
            {scanError ? <p className="errorLine">{scanError}</p> : null}

            <div className="environmentNote">
              <strong>Environment status</strong>
              <p>
                Public mode uses mock and fixture reports. Local browser scanning is{" "}
                {health?.localScanEnabled ? "enabled" : "disabled"}. Remote browser scanning is{" "}
                {isRemoteScanAvailable(health) ? "enabled" : "disabled"}.
              </p>
              <p>Environment: {health?.environment ?? "checking"}</p>
              <a href="/api/health" target="_blank" rel="noreferrer">
                View health API
              </a>
            </div>
          </section>
          ) : (
          <section className="scanPanel" aria-label="Demo status">
            <div className="panelTitle">
              <h2>Real scan is temporarily paused</h2>
              <span>Fallback mode</span>
            </div>
            <p className="betaLead">
              The public page is showing sample reports while real browser scanning is unavailable
              or paused. This keeps scan costs and abuse under control.
            </p>
            <p className="modeWarning">
              If you need a website checked during a pause, email support with the URL and the
              tracking tools you want to verify.
            </p>
            <div className="buttonRow">
              <a
                className="primaryButton buttonLink"
                href={liveScanRequestHref}
                onClick={() => {
                  trackEvent("request_live_scan", {
                    source: "hero_panel",
                    scan_mode: "remote"
                  });
                }}
              >
                Email support
              </a>
              <button
                className="secondaryButton"
                type="button"
                onClick={() => {
                  setSelectedKey("pass-own-site");
                  setLiveReport(null);
                  setSubmittedUrl("https://www.aiwallpaperprompts.com/");
                  trackEvent("demo_view", {
                    demo_type: "clean_install"
                  });
                }}
              >
                View clean install demo
              </button>
              <button
                className="secondaryButton"
                type="button"
                onClick={() => {
                  setSelectedKey("warning-gtm");
                  setLiveReport(null);
                  setSubmittedUrl("https://www.browserstack.com/");
                  trackEvent("demo_view", {
                    demo_type: "warning"
                  });
                }}
              >
                View warning demo
              </button>
            </div>
            <div className="environmentNote">
              <strong>Current public status</strong>
              <p>
                Real remote scanning is currently paused for public users. When it is available,
                free scans are limited to 3 per day.
              </p>
              <p>Support: {supportEmail}</p>
              <a href="/api/health" target="_blank" rel="noreferrer">
                View health API
              </a>
            </div>
          </section>
          )}

          <section className="reportPanel" id="report" aria-label="Sample report">
            <div className="reportHeader">
              <div>
                <p className="eyebrow">{liveReport ? "Real scan report" : "Demo report"}</p>
                <h2>{report.label}</h2>
              </div>
              <span className={`statusBadge ${report.status}`}>{statusText[report.status]}</span>
            </div>

            <div className="reportActions" aria-label="Report actions">
              <button type="button" onClick={copyReportSummary}>
                Copy summary
              </button>
              <button type="button" onClick={downloadReportJson}>
                Download JSON
              </button>
              {copyNotice ? <span>{copyNotice}</span> : null}
            </div>

            <div className="sampleTabs" role="tablist" aria-label="Sample reports">
              {reports.map((item) => (
                <button
                  key={item.key}
                  className={item.key === selectedKey ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setSelectedKey(item.key);
                    setSubmittedUrl(item.url);
                    setLiveReport(null);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <dl className="metrics">
              <div>
                <dt>Scripts</dt>
                <dd>{report.metrics.scripts}</dd>
              </div>
              <div>
                <dt>Collects</dt>
                <dd>{report.metrics.collects}</dd>
              </div>
              <div>
                <dt>Failures</dt>
                <dd>{report.metrics.failed}</dd>
              </div>
              <div>
                <dt>Consent</dt>
                <dd>{report.metrics.consentClicks}</dd>
              </div>
            </dl>

            <div className="detectedGrid">
              <DetectedTools title="GA4" values={report.detected.ga4} />
              <DetectedTools title="GTM" values={report.detected.gtm} />
              <DetectedTools title="Clarity" values={report.detected.clarity} />
            </div>

            <section className={`decisionBox ${report.status}`}>
              <h3>Decision for this scan</h3>
              <p>{getDecisionText(report.status)}</p>
            </section>

            <section className="setupSummary" aria-label="Scan setup summary">
              <h3>Scan setup</h3>
              <dl>
                <div>
                  <dt>Mode</dt>
                  <dd>{formatPreset(report.input?.mode, scanMode)}</dd>
                </div>
                <div>
                  <dt>URL</dt>
                  <dd>{report.finalUrl}</dd>
                </div>
                <div>
                  <dt>Consent</dt>
                  <dd>{formatPreset(report.input?.consentPreset, autoConsent ? "auto-safe" : "off")}</dd>
                </div>
                <div>
                  <dt>Event</dt>
                  <dd>{formatPreset(report.input?.eventPreset, eventPreset)}</dd>
                </div>
              </dl>
            </section>

            <ReportList title="Findings" items={report.findings} />
            <ReportList title="Recommended next steps" items={report.nextSteps} />
          </section>
        </div>
      </section>

      <section className="contentBand" id="limits">
        <div>
          <h2>What this checks</h2>
          <p>
            Public page requests for GA4, GTM, Universal Analytics, Clarity, Google Ads
            conversion, supported consent clicks, redirects, failed tracking requests, and obvious
            malformed tracking URLs.
          </p>
        </div>
        <div>
          <h2>What this cannot prove</h2>
          <p>
            It cannot prove attribution quality, server-side tagging, private dashboard data,
            authenticated user flows, or every consent mode detail. Those still need native tools
            such as GTM Preview, GA4 Realtime, DebugView, and Search Console.
          </p>
        </div>
      </section>

      <section className="workflowBand" id="workflow">
        <h2>Workflow for small teams</h2>
        <div className="steps">
          <article>
            <span>1</span>
            <h3>Scan the landing page</h3>
            <p>Confirm visible install signals before sending traffic or submitting launch docs.</p>
          </article>
          <article>
            <span>2</span>
            <h3>Repeat after consent</h3>
            <p>Click the cookie banner or use a safe selector to compare pre-consent behavior.</p>
          </article>
          <article>
            <span>3</span>
            <h3>Trigger one key event</h3>
            <p>Use a button selector for signup, download, checkout, or outbound click checks.</p>
          </article>
          <article>
            <span>4</span>
            <h3>Keep a baseline</h3>
            <p>Save reports after deploys so broken tracking is caught before it becomes invisible.</p>
          </article>
        </div>
      </section>

      <footer className="footer">
        <span>Tracking Preflight prototype</span>
        <span>
          <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> ·{" "}
          <a href="/contact">Contact</a>
        </span>
      </footer>
    </main>
  );
}

function DetectedTools({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="detectedBox">
      <span>{title}</span>
      <strong>{values.length ? values.join(", ") : "Not visible"}</strong>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="reportList">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function formatPreset(value: string | null | undefined, fallback: string) {
  const key = value || fallback;
  const normalized = key.replaceAll("-", " ");

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getDecisionText(status: ReportStatus) {
  if (status === "pass") {
    return "Visible tracking signals were observed in this browser session. Keep the report as a deploy baseline, but still confirm business metrics in GA4 or the native analytics dashboard.";
  }

  if (status === "warning") {
    return "Do not treat this as broken yet. The page showed partial evidence, so the next step is to check consent, GTM Preview, regional loading, or the selected event.";
  }

  return "No supported browser-side tracking signal was visible in this scan. Confirm whether this page is supposed to have GA4, GTM, UA, or Clarity before changing code.";
}

function trackEvent(name: string, params: Record<string, string | boolean | number | null>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", name, params);
}

function safeHost(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return "invalid-url";
  }
}

function isRemoteScanAvailable(health: HealthState) {
  return Boolean(health?.remoteScanEnabled && health.remoteScanConfigured);
}

function isRealScanAvailable(health: HealthState) {
  return Boolean(health?.localScanEnabled || isRemoteScanAvailable(health));
}

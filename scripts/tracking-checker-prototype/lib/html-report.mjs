export function renderHtmlReport(data) {
  const plain = data.plainLanguage;
  const statusClass = safeClass(data.status);
  const detected = data.detected || {};
  const requests = data.requests || {};

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(plain.title)} - Tracking Check Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --surface-2: #eef3f7;
      --text: #17202a;
      --muted: #5f6f7b;
      --border: #d9e1e8;
      --pass: #137a4a;
      --pass-bg: #e7f6ee;
      --warning: #9a6200;
      --warning-bg: #fff4d8;
      --fail: #a33a3a;
      --fail-bg: #fde9e9;
      --focus: #2563eb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 16px/1.55 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main { max-width: 1120px; margin: 0 auto; padding: 32px 18px 56px; }
    .topline { color: var(--muted); font-size: 14px; margin-bottom: 10px; word-break: break-all; }
    .hero {
      display: grid;
      gap: 18px;
      padding: 24px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 48px); line-height: 1.05; letter-spacing: 0; }
    h2 { margin: 0 0 12px; font-size: 20px; line-height: 1.25; letter-spacing: 0; }
    p { margin: 0; }
    .summary { max-width: 840px; color: #25313b; font-size: 18px; }
    .status {
      display: inline-flex;
      width: fit-content;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .status.pass { color: var(--pass); background: var(--pass-bg); }
    .status.warning { color: var(--warning); background: var(--warning-bg); }
    .status.fail { color: var(--fail); background: var(--fail-bg); }
    .section { margin-top: 26px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
    }
    .metric {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      border-top: 1px solid var(--border);
      padding: 10px 0;
    }
    .metric:first-child { border-top: 0; padding-top: 0; }
    .metric span { color: var(--muted); }
    .metric strong { font-size: 22px; }
    ul { margin: 0; padding-left: 20px; }
    li { margin: 8px 0; }
    .toolList {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }
    .chip {
      display: inline-flex;
      max-width: 100%;
      padding: 7px 10px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface-2);
      color: #22313f;
      font-size: 14px;
      word-break: break-word;
    }
    .wide { grid-column: 1 / -1; }
    .note {
      color: var(--muted);
      font-size: 14px;
    }
    a { color: var(--focus); }
    @media (max-width: 820px) {
      main { padding: 18px 12px 36px; }
      .hero { padding: 18px; }
      .grid { grid-template-columns: 1fr; }
      .wide { grid-column: auto; }
    }
  </style>
</head>
<body>
  <main>
    <div class="topline">Scanned URL: ${escapeHtml(data.finalUrl || data.url || "")}</div>
    <section class="hero" aria-labelledby="report-title">
      <div class="status ${statusClass}">${escapeHtml(data.status)}</div>
      <h1 id="report-title">${escapeHtml(plain.title)}</h1>
      <p class="summary">${escapeHtml(plain.summary)}</p>
    </section>

    <section class="section grid" aria-label="Tracking overview">
      <div class="panel">
        <h2>Detected Tools</h2>
        <div class="toolList">
          ${renderToolChips(detected)}
        </div>
      </div>
      <div class="panel">
        <h2>Collect Requests</h2>
        ${renderMetric("GA4", requests.ga4Collect)}
        ${renderMetric("Universal Analytics", requests.uaCollect)}
        ${renderMetric("Clarity", requests.clarityCollect)}
      </div>
      <div class="panel">
        <h2>Script Requests</h2>
        ${renderMetric("gtag.js", requests.ga4Script)}
        ${renderMetric("GTM", requests.gtmScript)}
        ${renderMetric("Clarity tag", requests.clarityScript)}
      </div>
      <div class="panel wide">
        <h2>Consent Clicks</h2>
        ${renderConsentResults(data)}
      </div>
      <div class="panel wide">
        <h2>Findings</h2>
        ${renderList(plain.findings)}
      </div>
      <div class="panel wide">
        <h2>Recommended Next Steps</h2>
        ${renderList(plain.nextSteps)}
      </div>
      <div class="panel">
        <h2>What This Checks</h2>
        ${renderList(plain.supportedChecks)}
      </div>
      <div class="panel">
        <h2>Not Checked</h2>
        ${renderList(plain.notChecked)}
      </div>
      <div class="panel wide">
        <h2>Important Limits</h2>
        ${renderList(plain.caveats)}
        <p class="note">This preview is generated from a local prototype report and is not a production diagnostic service.</p>
      </div>
    </section>
  </main>
</body>
</html>`;
}

function renderToolChips(detected) {
  const chips = [];
  for (const id of detected.ga4Ids || []) chips.push(`GA4 ${id}`);
  for (const id of detected.gtmIds || []) chips.push(`GTM ${id}`);
  for (const id of detected.clarityIds || []) chips.push(`Clarity ${id}`);
  if (!chips.length) return '<span class="chip">None detected in supported tools</span>';
  return chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("");
}

function renderMetric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${Number(value || 0)}</strong></div>`;
}

function renderList(items) {
  if (!items?.length) return "<p>No issues listed.</p>";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderConsentResults(data) {
  if (!data.autoConsent) return '<p class="note">Auto consent was not enabled for this scan.</p>';
  const results = data.consentClickResults || [];
  if (!results.length) return '<p class="note">Auto consent was enabled, but no click attempt was recorded.</p>';
  return `<ul>${results
    .map((result) => {
      const text = [
        `Result: ${result.result || "unknown"}`,
        result.method ? `method: ${result.method}` : "",
        result.selector ? `selector: ${result.selector}` : "",
        result.text ? `text: ${result.text}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      return `<li>${escapeHtml(text)}</li>`;
    })
    .join("")}</ul>`;
}

function safeClass(value) {
  return ["pass", "warning", "fail"].includes(value) ? value : "warning";
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

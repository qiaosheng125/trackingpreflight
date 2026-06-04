export type ReportStatus = "pass" | "warning" | "fail";

export type SampleReport = {
  key: string;
  label: string;
  status: ReportStatus;
  url: string;
  finalUrl: string;
  detected: {
    ga4: string[];
    gtm: string[];
    clarity: string[];
  };
  metrics: {
    scripts: number;
    collects: number;
    failed: number;
    consentClicks: number;
  };
  findings: string[];
  nextSteps: string[];
  input?: {
    mode?: "mock" | "fixture" | "local" | "remote";
    autoConsent?: boolean;
    consentPreset?: string | null;
    consentSelector?: string | null;
    eventPreset?: string | null;
    eventSelector?: string | null;
  };
};

export const reports: SampleReport[] = [
  {
    key: "warning-consent",
    label: "Consent gated",
    status: "warning",
    url: "https://www.typeform.com/",
    finalUrl: "https://www.typeform.com/",
    detected: {
      ga4: ["G-N6F0VDRT9W"],
      gtm: ["GTM-WH2ZQ3X"],
      clarity: []
    },
    metrics: {
      scripts: 4,
      collects: 2,
      failed: 1,
      consentClicks: 1
    },
    findings: [
      "GA4 and GTM were visible on the public page.",
      "Auto consent clicked an accepted cookie banner before the event pass.",
      "One Google Ads conversion request appeared after consent, but one tracking request failed."
    ],
    nextSteps: [
      "Compare before-consent and after-consent reports.",
      "Open GTM Preview to confirm which tags fire after consent.",
      "Inspect the failed conversion request in the browser Network panel."
    ]
  },
  {
    key: "pass-own-site",
    label: "Clean install",
    status: "pass",
    url: "https://www.aiwallpaperprompts.com/",
    finalUrl: "https://www.aiwallpaperprompts.com/",
    detected: {
      ga4: ["G-DC6K2C83Y2"],
      gtm: [],
      clarity: ["x069827ts2"]
    },
    metrics: {
      scripts: 2,
      collects: 2,
      failed: 0,
      consentClicks: 0
    },
    findings: [
      "GA4 and Clarity scripts loaded from expected public domains.",
      "At least one GA4 collect request and one Clarity collect request were observed.",
      "No malformed tracking or likes API URL was observed in this scan."
    ],
    nextSteps: [
      "Keep this as the baseline report after every deploy.",
      "Re-scan after adding ads, cookie banners, or new event buttons.",
      "Use Search Console and GA4 Realtime for independent confirmation."
    ]
  },
  {
    key: "warning-gtm",
    label: "GTM not firing",
    status: "warning",
    url: "https://www.browserstack.com/",
    finalUrl: "https://www.browserstack.com/",
    detected: {
      ga4: [],
      gtm: ["GTM-KX7NTRZ"],
      clarity: []
    },
    metrics: {
      scripts: 0,
      collects: 0,
      failed: 0,
      consentClicks: 0
    },
    findings: [
      "A GTM container ID was found in page content.",
      "No gtm.js script request was observed during the page load.",
      "No GA4, UA, or Clarity collect request was observed."
    ],
    nextSteps: [
      "Check whether consent, CSP, regional logic, or tag settings block GTM.",
      "Open GTM Preview to verify container loading.",
      "Scan a second page where marketing tags are expected to fire."
    ]
  },
  {
    key: "fail-no-tool",
    label: "No supported tool",
    status: "fail",
    url: "https://vercel.com/",
    finalUrl: "https://vercel.com/",
    detected: {
      ga4: [],
      gtm: [],
      clarity: []
    },
    metrics: {
      scripts: 0,
      collects: 0,
      failed: 0,
      consentClicks: 0
    },
    findings: [
      "No GA4, GTM, Universal Analytics, or Clarity signal was visible in this public page scan.",
      "This may be intentional, server-side, consent-gated, or hidden behind application logic."
    ],
    nextSteps: [
      "Confirm whether this page is supposed to contain browser-side tracking.",
      "If yes, test with an authenticated session or a manual event selector.",
      "If no, mark this page as out of scope."
    ]
  }
];

export function pickMockReport(url: string): SampleReport {
  const normalized = url.toLowerCase();

  if (normalized.includes("/samples/pass")) {
    return reports[1];
  }

  if (normalized.includes("/samples/warning")) {
    return reports[2];
  }

  if (normalized.includes("/samples/fail")) {
    return reports[3];
  }

  if (normalized.includes("aiwallpaperprompts")) {
    return reports[1];
  }

  if (normalized.includes("browserstack")) {
    return reports[2];
  }

  if (normalized.includes("vercel")) {
    return reports[3];
  }

  return reports[0];
}

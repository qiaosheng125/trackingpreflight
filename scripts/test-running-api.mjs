const baseUrl = process.env.TRACKING_CHECKER_BASE_URL || "http://localhost:3008";

const health = await requestJson(`${baseUrl}/api/health`, {
  method: "GET"
});

if (!health.ok || health.service !== "tracking-preflight") {
  throw new Error("Health endpoint returned unexpected payload");
}

const fixture = await requestJson(`${baseUrl}/api/scan`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://trackinginstallchecker.example/samples/warning",
    mode: "fixture"
  })
});

if (fixture.status !== "warning") {
  throw new Error(`Expected fixture warning status, got ${fixture.status}`);
}

const legacyFixture = await requestJson(`${baseUrl}/api/mock-scan`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://trackinginstallchecker.example/samples/warning",
    mode: "fixture"
  })
});

if (legacyFixture.status !== "warning") {
  throw new Error(`Expected legacy fixture warning status, got ${legacyFixture.status}`);
}

const remoteDisabled = await requestText(`${baseUrl}/api/scan`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://www.example.com/",
    mode: "remote"
  })
});

if (remoteDisabled.status !== 403) {
  throw new Error(`Expected remote scan to be disabled with 403, got ${remoteDisabled.status}`);
}

if (health.localScanEnabled) {
  const local = await requestJson(`${baseUrl}/api/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: "https://www.aiwallpaperprompts.com/",
      mode: "local"
    })
  });

  if (local.status !== "pass") {
    throw new Error(`Expected local scan pass status, got ${local.status}`);
  }
}

console.log("Running API tests passed");

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${text}`);
  }

  return JSON.parse(text);
}

async function requestText(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();

  return {
    status: response.status,
    text
  };
}

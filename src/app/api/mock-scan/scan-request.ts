export type NormalizedScanRequest = {
  url: string;
  mode: "mock" | "fixture" | "local" | "remote";
  autoConsent: boolean;
  consentPreset: string | null;
  consentSelector: string | null;
  eventPreset: string | null;
  eventSelector: string | null;
};

const allowedConsentPresets = new Set(["auto-safe", "onetrust", "cookiebot", "manual"]);
const allowedEventPresets = new Set(["signup", "download", "pricing", "outbound", "manual"]);

export function parseScanRequest(input: unknown) {
  if (!input || typeof input !== "object") {
    return {
      ok: false as const,
      error: "Request body must be a JSON object."
    };
  }

  const body = input as Record<string, unknown>;
  const url = optionalString(body.url, "https://www.example.com/", 2_000);
  const mode = nullableMode(body.mode);
  const consentPreset = nullablePreset(body.consentPreset, allowedConsentPresets);
  const eventPreset = nullablePreset(body.eventPreset, allowedEventPresets);
  const consentSelector = optionalNullableString(body.consentSelector, 400);
  const eventSelector = optionalNullableString(body.eventSelector, 400);

  if (!url.ok) {
    return url;
  }

  if (!mode.ok) {
    return {
      ok: false as const,
      error: "Unsupported scan mode."
    };
  }

  if (!consentPreset.ok) {
    return {
      ok: false as const,
      error: "Unsupported consent preset."
    };
  }

  if (!eventPreset.ok) {
    return {
      ok: false as const,
      error: "Unsupported event preset."
    };
  }

  if (!consentSelector.ok || !eventSelector.ok) {
    return {
      ok: false as const,
      error: "Selector is too long."
    };
  }

  return {
    ok: true as const,
    value: {
      url: url.value,
      mode: mode.value,
      autoConsent: body.autoConsent === true,
      consentPreset: consentPreset.value,
      consentSelector: consentSelector.value,
      eventPreset: eventPreset.value,
      eventSelector: eventSelector.value
    } satisfies NormalizedScanRequest
  };
}

function nullableMode(value: unknown):
  | {
      ok: true;
      value: NormalizedScanRequest["mode"];
    }
  | {
      ok: false;
      value: "mock";
    } {
  if (value === undefined || value === null || value === "") {
    return {
      ok: true as const,
      value: "mock" as const
    };
  }

  if (value === "mock" || value === "fixture" || value === "local" || value === "remote") {
    return {
      ok: true as const,
      value
    };
  }

  return {
    ok: false as const,
    value: "mock" as const
  };
}

function optionalString(value: unknown, fallback: string, maxLength: number) {
  if (value === undefined || value === null) {
    return {
      ok: true as const,
      value: fallback
    };
  }

  if (typeof value !== "string") {
    return {
      ok: false as const,
      error: "URL must be a string."
    };
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > maxLength) {
    return {
      ok: false as const,
      error: "URL is empty or too long."
    };
  }

  return {
    ok: true as const,
    value: trimmed
  };
}

function optionalNullableString(value: unknown, maxLength: number) {
  if (value === undefined || value === null) {
    return {
      ok: true as const,
      value: null
    };
  }

  if (typeof value !== "string") {
    return {
      ok: false as const,
      value: null
    };
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return {
      ok: true as const,
      value: null
    };
  }

  if (trimmed.length > maxLength) {
    return {
      ok: false as const,
      value: null
    };
  }

  return {
    ok: true as const,
    value: trimmed
  };
}

function nullablePreset(value: unknown, allowed: Set<string>) {
  if (value === undefined || value === null || value === "") {
    return {
      ok: true as const,
      value: null
    };
  }

  if (typeof value !== "string") {
    return {
      ok: false as const,
      value: null
    };
  }

  const trimmed = value.trim();

  if (!allowed.has(trimmed)) {
    return {
      ok: false as const,
      value: null
    };
  }

  return {
    ok: true as const,
    value: trimmed
  };
}

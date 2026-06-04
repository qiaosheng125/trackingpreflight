import { lookup } from "node:dns/promises";

const blockedHostnames = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export function validatePublicScanUrl(rawUrl: string) {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      ok: false as const,
      error: "Enter a valid http or https URL."
    };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return {
      ok: false as const,
      error: "Only http and https URLs can be scanned."
    };
  }

  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
    return {
      ok: false as const,
      error: "Only standard web ports 80 and 443 are allowed."
    };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (blockedHostnames.has(hostname) || hostname.endsWith(".local")) {
    return {
      ok: false as const,
      error: "Private or local hostnames cannot be scanned."
    };
  }

  if (isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) {
    return {
      ok: false as const,
      error: "Private network addresses cannot be scanned."
    };
  }

  return {
    ok: true as const,
    url: parsed.toString()
  };
}

export async function validateResolvedPublicScanUrl(rawUrl: string) {
  const validation = validatePublicScanUrl(rawUrl);

  if (!validation.ok) {
    return validation;
  }

  const parsed = new URL(validation.url);
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) {
    return {
      ok: false as const,
      error: "Private network addresses cannot be scanned."
    };
  }

  let addresses: Array<{ address: string }>;

  try {
    addresses = await withTimeout(lookup(hostname, { all: true }), 1_500);
  } catch {
    return {
      ok: false as const,
      error: "The hostname could not be resolved."
    };
  }

  if (addresses.length === 0) {
    return {
      ok: false as const,
      error: "The hostname could not be resolved."
    };
  }

  if (addresses.some((item) => isPrivateIpv4(item.address) || isPrivateIpv6(item.address))) {
    return {
      ok: false as const,
      error: "Private network addresses cannot be scanned."
    };
  }

  return validation;
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".");

  if (parts.length !== 4) {
    return false;
  }

  const octets = parts.map((part) => Number(part));

  if (octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = octets;

  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

function isPrivateIpv6(hostname: string) {
  return (
    hostname === "::1" ||
    hostname.startsWith("fc") ||
    hostname.startsWith("fd") ||
    hostname.startsWith("fe80:")
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("DNS_TIMEOUT")), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

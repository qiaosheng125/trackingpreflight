import { lookup } from "node:dns/promises";
import net from "node:net";

function ipv4ToInt(ip) {
  return ip.split(".").reduce((value, octet) => (value << 8) + Number(octet), 0) >>> 0;
}

function isPrivateIpv4(ip) {
  const value = ipv4ToInt(ip);
  const ranges = [
    ["0.0.0.0", "0.255.255.255"],
    ["10.0.0.0", "10.255.255.255"],
    ["127.0.0.0", "127.255.255.255"],
    ["169.254.0.0", "169.254.255.255"],
    ["172.16.0.0", "172.31.255.255"],
    ["192.168.0.0", "192.168.255.255"],
    ["100.64.0.0", "100.127.255.255"],
    ["224.0.0.0", "239.255.255.255"],
    ["240.0.0.0", "255.255.255.255"],
  ];
  return ranges.some(([start, end]) => value >= ipv4ToInt(start) && value <= ipv4ToInt(end));
}

function isPrivateIpv6(ip) {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80:") ||
    lower.startsWith("::ffff:127.") ||
    lower.startsWith("::ffff:10.") ||
    lower.startsWith("::ffff:192.168.")
  );
}

export function isBlockedIp(ip) {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIpv4(ip);
  if (family === 6) return isPrivateIpv6(ip);
  return true;
}

export async function validateTargetUrl(rawUrl, options = {}) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol === "file:") {
    if (options.allowFile) return { normalizedUrl: parsed.href, resolvedAddresses: [] };
    throw new Error("file:// URLs are disabled. Use --allow-file only for local fixtures.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are allowed");
  }

  const port = parsed.port || (parsed.protocol === "https:" ? "443" : "80");
  if (!["80", "443"].includes(port)) {
    throw new Error("Only ports 80 and 443 are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("localhost URLs are blocked");
  }

  const literalFamily = net.isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (!addresses.length) throw new Error("Hostname did not resolve");

  const blocked = addresses.filter((record) => isBlockedIp(record.address));
  if (blocked.length) {
    throw new Error(`URL resolves to blocked IP address: ${blocked.map((record) => record.address).join(", ")}`);
  }

  return {
    normalizedUrl: parsed.href,
    resolvedAddresses: addresses.map((record) => record.address),
  };
}

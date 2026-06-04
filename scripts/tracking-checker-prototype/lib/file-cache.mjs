import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

function cacheKey(value) {
  return createHash("sha1").update(value).digest("hex");
}

export function scanCacheKey(input) {
  return cacheKey(
    JSON.stringify({
      url: input.url,
      clickSelector: input.clickSelector || "",
    }),
  );
}

export async function readCache(cacheDir, key, ttlMs) {
  if (!cacheDir || !ttlMs) return null;
  try {
    const cacheFile = join(cacheDir, `${key}.json`);
    const entry = JSON.parse(await readFile(cacheFile, "utf8"));
    if (!entry.createdAt || Date.now() - Date.parse(entry.createdAt) > ttlMs) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export async function writeCache(cacheDir, key, value) {
  if (!cacheDir) return;
  await mkdir(cacheDir, { recursive: true });
  const cacheFile = join(cacheDir, `${key}.json`);
  await writeFile(
    cacheFile,
    `${JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        value,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

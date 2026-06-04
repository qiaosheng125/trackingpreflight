import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

function bucketStart(now, windowMs) {
  return Math.floor(now / windowMs) * windowMs;
}

export async function checkRateLimit(storeDir, identifier, options) {
  const limit = Number(options.limit || 0);
  const windowMs = Number(options.windowMs || 0);
  if (!storeDir || !identifier || !limit || !windowMs) return { allowed: true, remaining: Infinity };

  await mkdir(storeDir, { recursive: true });
  const safeIdentifier = identifier.replace(/[^a-z0-9_.-]+/gi, "_").slice(0, 120);
  const file = join(storeDir, `${safeIdentifier}.json`);
  const now = Date.now();
  const currentBucket = bucketStart(now, windowMs);

  let state = { bucket: currentBucket, count: 0 };
  try {
    state = JSON.parse(await readFile(file, "utf8"));
  } catch {
    // First request for this identifier.
  }

  if (state.bucket !== currentBucket) state = { bucket: currentBucket, count: 0 };
  state.count += 1;
  await writeFile(file, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  return {
    allowed: state.count <= limit,
    remaining: Math.max(0, limit - state.count),
    resetAt: new Date(currentBucket + windowMs).toISOString(),
  };
}

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult =
  | {
      ok: true;
      minuteRemaining: number;
      minuteResetAt: number;
      dailyRemaining: number;
      dailyResetAt: number;
    }
  | {
      ok: false;
      reason: "minute" | "daily";
      minuteRemaining: number;
      minuteResetAt: number;
      dailyRemaining: number;
      dailyResetAt: number;
    };

const minuteBuckets = new Map<string, Bucket>();
const dailyBuckets = new Map<string, Bucket>();
const minuteWindowMs = 60_000;
const dailyWindowMs = 24 * 60 * 60_000;
const maxMinuteRequests = Number(process.env.SCAN_RATE_LIMIT_PER_MINUTE || 3);
const maxDailyRequests = Number(process.env.SCAN_RATE_LIMIT_PER_DAY || 3);

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  const minute = incrementBucket(
    minuteBuckets,
    `minute:${key}`,
    now,
    minuteWindowMs,
    maxMinuteRequests
  );
  const daily = incrementBucket(
    dailyBuckets,
    `daily:${key}`,
    now,
    dailyWindowMs,
    maxDailyRequests
  );

  if (!minute.ok) {
    return {
      ok: false,
      reason: "minute",
      minuteRemaining: 0,
      minuteResetAt: minute.resetAt,
      dailyRemaining: daily.remaining,
      dailyResetAt: daily.resetAt
    };
  }

  if (!daily.ok) {
    return {
      ok: false,
      reason: "daily",
      minuteRemaining: minute.remaining,
      minuteResetAt: minute.resetAt,
      dailyRemaining: 0,
      dailyResetAt: daily.resetAt
    };
  }

  return {
    ok: true,
    minuteRemaining: minute.remaining,
    minuteResetAt: minute.resetAt,
    dailyRemaining: daily.remaining,
    dailyResetAt: daily.resetAt
  };
}

export function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "local-preview";
}

function incrementBucket(
  buckets: Map<string, Bucket>,
  key: string,
  now: number,
  windowMs: number,
  maxRequests: number
) {
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;

    buckets.set(key, {
      count: 1,
      resetAt
    });

    return {
      ok: true,
      remaining: maxRequests - 1,
      resetAt
    };
  }

  if (bucket.count >= maxRequests) {
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.resetAt
    };
  }

  bucket.count += 1;

  return {
    ok: true,
    remaining: maxRequests - bucket.count,
    resetAt: bucket.resetAt
  };
}

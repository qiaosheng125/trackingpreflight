import { NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "./rate-limit";
import {
  getCachedScan,
  releaseScanSlot,
  reserveScanSlot,
  setCachedScan
} from "./scan-control";
import { parseScanRequest } from "./scan-request";
import { runScan } from "./scan-provider";
import { validatePublicScanUrl, validateResolvedPublicScanUrl } from "./url-guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(getClientKey(request));

  if (!rateLimit.ok) {
    return NextResponse.json(
      {
        error:
          rateLimit.reason === "daily"
            ? "Daily scan limit reached. Please try again tomorrow."
            : "Too many scan requests. Please try again later."
      },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimit)
      }
    );
  }

  const body = await request.json().catch(() => null);
  const scanRequest = parseScanRequest(body);

  if (!scanRequest.ok) {
    return NextResponse.json(
      {
        error: scanRequest.error
      },
      {
        status: 400
      }
    );
  }

  const validation =
    scanRequest.value.mode === "local" || scanRequest.value.mode === "remote"
      ? await validateResolvedPublicScanUrl(scanRequest.value.url)
      : validatePublicScanUrl(scanRequest.value.url);

  if (!validation.ok) {
    return NextResponse.json(
      {
        error: validation.error
      },
      {
        status: 400
      }
    );
  }

  const normalizedRequest = {
    ...scanRequest.value,
    url: validation.url
  };
  const cachedReport = getCachedScan(normalizedRequest);

  if (cachedReport) {
    return NextResponse.json(cachedReport, {
      headers: {
        ...rateLimitHeaders(rateLimit),
        "X-Scan-Cache": "hit"
      }
    });
  }

  const scanSlot = reserveScanSlot();

  if (!scanSlot.ok) {
    return NextResponse.json(
      {
        error: "The scan queue is full. Please try again in a moment."
      },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders(rateLimit),
          "X-Scan-Active": String(scanSlot.activeScans),
          "X-Scan-Max-Concurrent": String(scanSlot.maxConcurrentScans)
        }
      }
    );
  }

  let report;

  try {
    report = await runScan(normalizedRequest);
    setCachedScan(normalizedRequest, report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed.";
    console.error("[scan-error]", {
      mode: normalizedRequest.mode,
      host: safeHost(normalizedRequest.url),
      message
    });
    const scanError = publicScanError(message);

    return NextResponse.json(
      {
        error: scanError.error
      },
      {
        status: scanError.status
      }
    );
  } finally {
    releaseScanSlot();
  }

  return NextResponse.json(
    report,
    {
      headers: {
        ...rateLimitHeaders(rateLimit),
        "X-Scan-Cache": "miss"
      }
    }
  );
}

function safeHost(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return "invalid-url";
  }
}

function publicScanError(message: string) {
  if (message === "LOCAL_SCAN_DISABLED") {
    return {
      status: 403,
      error: "Local browser scanning is disabled for this environment."
    };
  }

  if (message === "REMOTE_SCAN_DISABLED") {
    return {
      status: 403,
      error: "Remote browser scanning is not enabled yet."
    };
  }

  if (message === "REMOTE_SCAN_NOT_CONFIGURED") {
    return {
      status: 503,
      error: "Remote browser scanning is not configured yet."
    };
  }

  if (message === "REMOTE_SCAN_PROVIDER_PENDING") {
    return {
      status: 503,
      error: "Remote browser provider is not connected yet."
    };
  }

  return {
    status: 500,
    error: "Scan failed. Please try again later."
  };
}

function rateLimitHeaders(rateLimit: ReturnType<typeof checkRateLimit>) {
  return {
    "X-RateLimit-Minute-Remaining": String(rateLimit.minuteRemaining),
    "X-RateLimit-Minute-Reset": String(rateLimit.minuteResetAt),
    "X-RateLimit-Daily-Remaining": String(rateLimit.dailyRemaining),
    "X-RateLimit-Daily-Reset": String(rateLimit.dailyResetAt)
  };
}

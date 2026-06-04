import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/scan": ["./scripts/tracking-checker-prototype/**/*"],
    "/api/mock-scan": ["./scripts/tracking-checker-prototype/**/*"]
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "trackingpreflight.com" }],
        destination: "https://www.trackingpreflight.com/:path*",
        permanent: true
      }
    ];
  }
};

export default nextConfig;

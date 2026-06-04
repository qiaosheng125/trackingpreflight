import type { Metadata } from "next";
import { AnalyticsScripts } from "./analytics";
import { siteName, siteUrl } from "./site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tracking Preflight - GA4 GTM Clarity Preflight Reports",
    template: `%s | ${siteName}`
  },
  description:
    "Run a public page preflight for GA4, GTM, Clarity, consent gates, and visible tracking requests before you trust a tracking setup.",
  openGraph: {
    title: siteName,
    description:
      "A one-page preflight report for visible GA4, GTM, Clarity, consent, and collect request signals.",
    url: siteUrl,
    siteName,
    type: "website"
  },
  twitter: {
    card: "summary",
    title: siteName,
    description:
      "Check visible tracking signals before you trust a public page tracking setup."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  );
}

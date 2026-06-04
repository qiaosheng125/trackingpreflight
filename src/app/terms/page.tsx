import { siteName, supportEmail } from "../site";

export const metadata = {
  title: "Terms of Use",
  alternates: {
    canonical: "/terms"
  }
};

export default function TermsPage() {
  return (
    <main className="plainPage">
      <section>
        <p className="eyebrow">Terms</p>
        <h1>Terms of Use</h1>
        <p>
          {siteName} provides best-effort public page tracking preflight reports. A pass result
          does not guarantee attribution quality, dashboard ingestion, conversion accuracy, or
          server-side tracking behavior.
        </p>
        <p>
          You may only scan URLs you are allowed to inspect. Do not use the service for private
          networks, abusive traffic, or unauthorized testing.
        </p>
        <p>Contact: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
      </section>
    </main>
  );
}

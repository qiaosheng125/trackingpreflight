export const metadata = {
  title: "Warning Sample",
  robots: {
    index: false,
    follow: true
  }
};

export default function WarningSamplePage() {
  return (
    <main className="fixturePage" data-fixture-status="warning">
      <section>
        <p className="eyebrow">Fixture: warning</p>
        <h1>GTM visible but no collect signal sample</h1>
        <p>
          This controlled fixture represents a page where a GTM container ID is visible, but no
          supported browser-side collect request should be assumed.
        </p>
        <a className="pricing-link" href="/pricing">
          View pricing
        </a>
      </section>
      <script
        type="application/json"
        data-tracking-fixture="warning"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ga4Ids: [],
            gtmIds: ["GTM-FIXTUREWARN"],
            clarityIds: [],
            expectedCollects: [],
            expectedStatus: "warning"
          })
        }}
      />
    </main>
  );
}

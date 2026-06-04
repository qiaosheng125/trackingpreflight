export const metadata = {
  title: "Pass Sample",
  robots: {
    index: false,
    follow: true
  }
};

export default function PassSamplePage() {
  return (
    <main className="fixturePage" data-fixture-status="pass">
      <section>
        <p className="eyebrow">Fixture: pass</p>
        <h1>Clean GA4 and Clarity install sample</h1>
        <p>
          This controlled fixture represents a page where supported tracking tools are expected to
          be visible and firing. The IDs are fixture IDs, not production credentials.
        </p>
        <button className="signup-button" data-testid="signup-primary">
          Start free trial
        </button>
      </section>
      <script
        type="application/json"
        data-tracking-fixture="pass"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ga4Ids: ["G-FIXTUREPASS1"],
            gtmIds: [],
            clarityIds: ["fixturepass"],
            expectedCollects: ["ga4", "clarity"],
            expectedStatus: "pass"
          })
        }}
      />
    </main>
  );
}

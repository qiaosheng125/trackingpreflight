export const metadata = {
  title: "Fail Sample",
  robots: {
    index: false,
    follow: true
  }
};

export default function FailSamplePage() {
  return (
    <main className="fixturePage" data-fixture-status="fail">
      <section>
        <p className="eyebrow">Fixture: fail</p>
        <h1>No supported tracking signal sample</h1>
        <p>
          This controlled fixture represents a page where GA4, GTM, UA, and Clarity should not be
          detected by the scanner.
        </p>
        <button className="download-button">Download guide</button>
      </section>
      <script
        type="application/json"
        data-tracking-fixture="fail"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ga4Ids: [],
            gtmIds: [],
            clarityIds: [],
            expectedCollects: [],
            expectedStatus: "fail"
          })
        }}
      />
    </main>
  );
}

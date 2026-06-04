const samplePages = [
  {
    href: "/samples/pass",
    title: "Pass sample",
    description: "A controlled page that represents a clean GA4 and Clarity install."
  },
  {
    href: "/samples/warning",
    title: "Warning sample",
    description: "A controlled page with a visible GTM ID but intentionally missing collect activity."
  },
  {
    href: "/samples/fail",
    title: "Fail sample",
    description: "A controlled page with no supported tracking signal."
  }
];

export const metadata = {
  title: "Sample Reports",
  alternates: {
    canonical: "/samples"
  }
};

export default function SamplesPage() {
  return (
    <main className="plainPage">
      <section>
        <p className="eyebrow">Controlled fixtures</p>
        <h1>Sample pages for scanner validation</h1>
        <p>
          These pages are internal test fixtures for the Tracking Install Checker prototype. They
          help verify pass, warning, and fail report states without relying on third-party sites.
        </p>
        <div className="sampleList">
          {samplePages.map((page) => (
            <a key={page.href} href={page.href}>
              <strong>{page.title}</strong>
              <span>{page.description}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

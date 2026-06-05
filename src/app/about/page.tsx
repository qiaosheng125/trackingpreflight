import { siteName, supportEmail } from "../site";

export const metadata = {
  title: "About",
  alternates: {
    canonical: "/about"
  }
};

export default function AboutPage() {
  return (
    <main className="plainPage">
      <section>
        <p className="eyebrow">About</p>
        <h1>About {siteName}</h1>
        <p>
          {siteName} helps site owners check visible analytics and marketing
          tracking signals before trusting a public page launch. It focuses on
          GA4, GTM, Clarity, consent behavior, collect requests, and reportable
          next steps.
        </p>
        <p>
          Public scans are best-effort checks of what a browser can observe.
          They do not guarantee dashboard attribution, server-side tracking,
          conversion accuracy, or future vendor ingestion.
        </p>
        <p>
          Reports are designed to be copied or downloaded as a deploy baseline
          without exposing private credentials. For issues, email{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>
      </section>
    </main>
  );
}

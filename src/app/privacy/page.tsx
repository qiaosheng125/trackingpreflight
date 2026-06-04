import { siteName, supportEmail } from "../site";

export const metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: "/privacy"
  }
};

export default function PrivacyPage() {
  return (
    <main className="plainPage">
      <section>
        <p className="eyebrow">Privacy</p>
        <h1>Privacy Policy</h1>
        <p>
          {siteName} is a public page preflight tool. The first validation build is designed to
          avoid storing scan history or user accounts.
        </p>
        <p>
          When analytics is enabled, the site may use Google Analytics and Microsoft Clarity to
          understand aggregate usage and improve the product. Do not scan private, internal, or
          sensitive URLs.
        </p>
        <p>Questions: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
      </section>
    </main>
  );
}

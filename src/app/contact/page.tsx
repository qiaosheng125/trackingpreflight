import { siteName, supportEmail } from "../site";

export const metadata = {
  title: "Contact",
  alternates: {
    canonical: "/contact"
  }
};

export default function ContactPage() {
  return (
    <main className="plainPage">
      <section>
        <p className="eyebrow">Contact</p>
        <h1>Contact {siteName}</h1>
        <p>
          For bug reports, incorrect scan results, or product feedback, email{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>
        <p>
          Include the scanned URL, scan mode, expected tracking tool, and a short description of
          what looked wrong.
        </p>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "Read how GharScan Buddy handles account, household, inventory, image, analytics, and contact information.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="button-link">
          GharScan Buddy
        </Link>

        <header className="mt-12">
          <p className="eyebrow">Legal</p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground">
            Privacy policy
          </h1>

          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: October 8, 2026
          </p>
        </header>

        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-xl font-black text-foreground">
              Information we handle
            </h2>

            <p className="mt-3">
              GharScan Buddy handles account information, household membership,
              inventory records, grocery records, meal plans, and profile
              display names needed to operate the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              Product images and AI processing
            </h2>

            <p className="mt-3">
              Product images submitted for scanning are sent through a protected
              server-side route for structured extraction. Do not submit
              payment-card details, passwords, or unrelated private documents.
              Retention depends on the storage behavior configured in the
              application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              Household visibility
            </h2>

            <p className="mt-3">
              Information saved to a household may be visible to other members
              of that household according to their Owner, Editor, or Viewer
              role. Database row-level security restricts access between
              households.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              Service providers
            </h2>

            <p className="mt-3">
              Production configuration may use hosting, authentication,
              database, AI-processing, analytics, and anti-abuse providers.
              The deployed policy should list only providers actually enabled
              in production.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              Your choices
            </h2>

            <p className="mt-3">
              You may request help with account or household data through the
              Contact page. Requests may require account verification to protect
              other household members.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              Contact
            </h2>

            <p className="mt-3">
              For privacy questions or data requests, use the deployed Contact
              page. Do not include passwords, payment details, or unrelated
              sensitive information in a message.
            </p>
          </section>
        </div>

        <footer className="mt-10 flex flex-wrap gap-5 text-sm font-bold">
          <Link
            href="/faq"
            className="text-muted-foreground hover:text-foreground"
          >
            FAQ
          </Link>

          <Link
            href="/contact"
            className="text-muted-foreground hover:text-foreground"
          >
            Contact
          </Link>

          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground"
          >
            Home
          </Link>
        </footer>
      </article>
    </main>
  );
}
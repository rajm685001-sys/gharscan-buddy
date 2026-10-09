import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Message received",
  description: "Your GharScan Buddy support message has been received.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ContactThankYouPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="button-link">
          GharScan Buddy
        </Link>

        <section className="mt-12 rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Message received
          </h1>

          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Thank you for contacting GharScan Buddy. If your request relates to
            an account or household data request, the team may need to verify
            your identity before taking action.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/" className="button-primary">
              Return home
            </Link>

            <Link
              href="/faq"
              className="button-secondary"
            >
              Read FAQ
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
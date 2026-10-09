import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the GharScan Buddy team for support, privacy questions, or household data requests.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-bold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          GharScan Buddy
        </Link>

        <header className="mt-12">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
            Support
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground">
            Contact us
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Send a support request, privacy question, or household data request.
            Do not include passwords, payment details, or unrelated sensitive
            information.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <ContactForm />
        </section>

        <footer className="mt-10 flex flex-wrap gap-5 text-sm font-bold">
          <Link
            href="/faq"
            className="text-muted-foreground transition hover:text-foreground"
          >
            FAQ
          </Link>

          <Link
            href="/privacy"
            className="text-muted-foreground transition hover:text-foreground"
          >
            Privacy policy
          </Link>

          <Link
            href="/"
            className="text-muted-foreground transition hover:text-foreground"
          >
            Home
          </Link>
        </footer>
      </div>
    </main>
  );
}
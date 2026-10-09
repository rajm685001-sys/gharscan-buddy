import { ArrowLeft, Home, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The GharScan Buddy page you requested could not be found.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg border border-border bg-card p-8 sm:p-10">
        <SearchX
          className="h-8 w-8 text-emerald-700 dark:text-emerald-400"
          aria-hidden="true"
        />

        <p className="eyebrow mt-8">Page not found</p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">
          We could not find that page.
        </h1>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          The link may be incorrect or the page may have moved. Return to
          GharScan Buddy and continue managing your household.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="button-primary h-11">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go to home
          </Link>

          <Link href="/login" className="button-secondary h-11">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Log in
          </Link>
        </div>
      </section>
    </main>
  );
}
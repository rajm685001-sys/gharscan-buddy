"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error("GharScan Buddy application error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg border border-red-200 bg-card p-8 sm:p-10">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />

        <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
          Something went wrong
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">
          We could not load this page.
        </h1>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Please try again. Your household records were not intentionally
          changed.
        </p>

        {error.digest ? (
          <p className="mt-5 border border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            Error reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-bold text-foreground transition hover:bg-muted"
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
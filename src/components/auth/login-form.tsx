"use client";

import { AlertCircle, ArrowRight, Loader2, ScanLine } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.refresh();

    const nextPath = searchParams.get("next");
    router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:44px_44px]" />

        <Link href="/" className="relative z-10 flex items-center gap-3 self-start">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <ScanLine className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-bold">GharScan Buddy</span>
            <span className="block text-xs text-emerald-100">
              Smart home inventory
            </span>
          </span>
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-200">
            Welcome back
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">
            Your home, organized intelligently.
          </h1>
          <p className="mt-5 text-lg leading-8 text-emerald-50">
            Continue tracking essential items, expiry dates, meal ideas, and
            grocery tasks with your family.
          </p>
        </div>

        <p className="relative z-10 text-sm text-emerald-100">
          Scan smarter. Waste less. Live better.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center gap-3 lg:hidden"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <ScanLine className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold text-foreground">
                GharScan Buddy
              </span>
              <span className="block text-xs text-muted-foreground">
                Smart home inventory
              </span>
            </span>
          </Link>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">
              Log in to your account
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Enter your details to access your family workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {errorMessage && (
              <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-bold text-foreground">
                Email address
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold text-foreground">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                autoComplete="current-password"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-bold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Log in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New to GharScan Buddy?{" "}
            <Link
              href="/signup"
              className="font-bold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
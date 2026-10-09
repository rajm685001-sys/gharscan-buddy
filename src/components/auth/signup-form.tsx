"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ScanLine,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    if (!data.session) {
      setSuccessMessage(
        "Account created. Please check your email to confirm your account before logging in.",
      );
      setIsLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="order-2 flex items-center justify-center px-4 py-12 sm:px-6 lg:order-1">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center gap-3 lg:hidden"
          >
            <span className="flex h-10 w-10 items-center justify-center bg-emerald-600 text-white">
              <ScanLine className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-bold text-foreground">
                GharScan Buddy
              </span>
              <span className="block text-xs text-muted-foreground">
                Shared household inventory
              </span>
            </span>
          </Link>

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Create your space
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">
            Start organizing your home
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Create a secure account, then create or join a family inventory
            workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {errorMessage && (
              <div className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <p>{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="flex gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <p>{successMessage}</p>
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-bold text-foreground">
                Full name
              </span>

              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                required
                minLength={2}
                autoComplete="name"
                className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

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
                className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="button-primary h-12 w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400"
            >
              Log in
            </Link>
          </p>
        </div>
      </section>

      <section className="relative order-1 hidden overflow-hidden bg-slate-950 p-12 text-white lg:order-2 lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:44px_44px]"
          aria-hidden="true"
        />

        <Link
          href="/"
          className="relative z-10 flex items-center gap-3 self-start"
        >
          <span
            className="flex h-11 w-11 items-center justify-center bg-white/15"
            aria-hidden="true"
          >
            <ScanLine className="h-5 w-5" />
          </span>

          <span>
            <span className="block font-bold">GharScan Buddy</span>
            <span className="block text-xs text-emerald-100">
              Shared household inventory
            </span>
          </span>
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-200">
            Your shared household
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight">
            Know what is at home before you shop.
          </h2>

          <ul className="mt-7 space-y-4 text-emerald-50">
            {[
              "Track food, medicines, and household essentials",
              "Review extracted details before saving them",
              "Plan meals with what is already at home",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-lime-300"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-emerald-100">
          Private, shared, and built for household routines.
        </p>
      </section>
    </main>
  );
}
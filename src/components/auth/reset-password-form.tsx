"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    async function checkRecoverySession() {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasRecoverySession(Boolean(session));
      setIsCheckingSession(false);
    }

    checkRecoverySession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      setErrorMessage("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage(
      "Your password has been updated successfully. Redirecting you to login...",
    );

    window.setTimeout(() => {
      router.replace("/login");
      router.refresh();
    }, 1800);
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:44px_44px]" />

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
            Secure password reset
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">
            Choose a new password.
          </h1>
          <p className="mt-5 text-lg leading-8 text-emerald-50">
            Create a strong password to protect your family inventory and
            shared household data.
          </p>
        </div>

        <p className="relative z-10 text-sm text-emerald-100">
          Authenticated securely through Supabase.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
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

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Account security
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">
            Create a new password
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use a password you have not used elsewhere.
          </p>

          {isCheckingSession ? (
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
              Verifying your secure recovery link...
            </div>
          ) : !hasRecoverySession ? (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-950 dark:bg-amber-950/30">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
                <div>
                  <p className="font-black text-amber-800 dark:text-amber-200">
                    Recovery link required
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-700 dark:text-amber-300">
                    Open this page using the password-reset link sent to your
                    email. The link may have expired or already been used.
                  </p>
                  <Link
                    href="/forgot-password"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-black text-amber-800 underline underline-offset-4 dark:text-amber-200"
                  >
                    Request a new link
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {errorMessage && (
                <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{successMessage}</p>
                </div>
              )}

              <label className="block space-y-2">
                <span className="text-sm font-bold text-foreground">
                  New password
                </span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-foreground">
                  Confirm new password
                </span>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Update password
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
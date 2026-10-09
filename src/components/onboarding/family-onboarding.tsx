"use client";

import {
  ArrowRight,
  Home,
  KeyRound,
  Loader2,
  Plus,
  ScanLine,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type FamilyOnboardingProps = {
  fullName: string;
};

export function FamilyOnboarding({ fullName }: FamilyOnboardingProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [familyName, setFamilyName] = useState(
    fullName ? `${fullName.split(" ")[0]}'s Family` : "",
  );
  const [familyCode, setFamilyCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const supabase = createClient();

    const { error } =
      mode === "create"
        ? await supabase.rpc("create_family", {
            family_name: familyName.trim(),
          })
        : await supabase.rpc("join_family_by_code", {
            input_family_code: familyCode.trim().toUpperCase(),
          });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(132,204,22,0.14),transparent_28%)] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl shadow-emerald-950/10 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <ScanLine className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-bold">GharScan Buddy</span>
                <span className="block text-xs text-emerald-100">
                  Smart home inventory
                </span>
              </span>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-200">
                One final step
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight">
                Set up your family space.
              </h1>
              <p className="mt-5 leading-7 text-emerald-50">
                Keep your household inventory private, organized, and easy to
                share with the people you trust.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-emerald-50">
              Your family has its own unique Family ID. You can share it with
              members when you are ready.
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 lg:hidden">
                <Home className="h-6 w-6" />
              </div>

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                Welcome{fullName ? `, ${fullName.split(" ")[0]}` : ""}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">
                Create or join a family
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Create a new home workspace, or enter an existing Family ID to
                join your family&apos;s shared inventory.
              </p>

              <div className="mt-8 grid grid-cols-2 rounded-2xl bg-muted p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode("create");
                    setErrorMessage("");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${
                    mode === "create"
                      ? "bg-card text-emerald-700 shadow-sm dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("join");
                    setErrorMessage("");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${
                    mode === "join"
                      ? "bg-card text-emerald-700 shadow-sm dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                >
                  <UsersRound className="h-4 w-4" />
                  Join
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {mode === "create" ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Family / home name
                    </span>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(event) => setFamilyName(event.target.value)}
                      placeholder="Example: Sharma Family"
                      required
                      minLength={2}
                      maxLength={80}
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                    <span className="text-xs leading-5 text-muted-foreground">
                      You will become the owner and receive a unique Family ID.
                    </span>
                  </label>
                ) : (
                  <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <KeyRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Family ID
                    </span>
                    <input
                      type="text"
                      value={familyCode}
                      onChange={(event) =>
                        setFamilyCode(event.target.value.toUpperCase())
                      }
                      placeholder="Example: A1B2C3D4"
                      required
                      minLength={8}
                      maxLength={8}
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 font-mono text-sm font-bold uppercase tracking-[0.18em] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                    <span className="text-xs leading-5 text-muted-foreground">
                      Ask the family owner for the eight-character Family ID.
                    </span>
                  </label>
                )}

                {errorMessage && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : mode === "create" ? (
                    <>
                      Create family workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Join family workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
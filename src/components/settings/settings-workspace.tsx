"use client";

import {
  AlertCircle,
  Check,
  KeyRound,
  Leaf,
  Loader2,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTheme } from "next-themes";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { createClient } from "@/lib/supabase/client";
import type { FamilyRole } from "@/types/family";

type SettingsWorkspaceProps = {
  userId: string;
  email: string;
  initialFullName: string;
  initialPhone: string;
  initialDietaryPreference: string;
  familyName: string;
  familyCode: string;
  userRole: FamilyRole;
};

function getInitials(name: string, email: string) {
  const cleanName = name.trim();

  if (cleanName) {
    return cleanName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }

  return email.slice(0, 2).toUpperCase() || "GB";
}

function getRoleLabel(role: FamilyRole) {
  if (role === "owner") {
    return "Owner";
  }

  if (role === "editor") {
    return "Editor";
  }

  return "Viewer";
}

export function SettingsWorkspace({
  userId,
  email,
  initialFullName,
  initialPhone,
  initialDietaryPreference,
  familyName,
  familyCode,
  userRole,
}: SettingsWorkspaceProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [dietaryPreference, setDietaryPreference] = useState(
    initialDietaryPreference,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isDark = resolvedTheme === "dark";

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    const supabase = createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        dietary_preference: dietaryPreference || null,
      })
      .eq("id", userId);

    if (profileError) {
      setErrorMessage(profileError.message);
      setIsSaving(false);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
      },
    });

    if (authError) {
      setErrorMessage(
        `Profile saved, but account display name could not update: ${authError.message}`,
      );
      setIsSaving(false);
      return;
    }

    setSuccessMessage("Profile preferences saved successfully.");
    setIsSaving(false);
    router.refresh();
  }

  async function sendPasswordReset() {
    if (!email) {
      setErrorMessage("No email address is available for this account.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSendingReset(true);

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSendingReset(false);
      return;
    }

    setSuccessMessage(
      "Password reset email sent. Check your inbox and follow the secure reset link.",
    );
    setIsSendingReset(false);
  }

  async function logout() {
    const shouldLogout = window.confirm(
      "Log out from GharScan Buddy on this device?",
    );

    if (!shouldLogout) {
      return;
    }

    setErrorMessage("");
    setIsLoggingOut(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoggingOut(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation
        familyName={familyName}
        familyCode={familyCode}
      />

      <main className="pb-24 lg:ml-72 lg:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
          <header className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              Personal workspace
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
              Settings and profile
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage your profile, dietary preferences, appearance, account
              security, and local session.
            </p>
          </header>

          {errorMessage && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          <section className="mt-7 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
            <aside className="space-y-6">
              <article className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 text-2xl font-black text-white shadow-lg shadow-emerald-600/20">
                  {getInitials(fullName, email)}
                </span>

                <h2 className="mt-5 text-xl font-black text-foreground">
                  {fullName || "GharScan Buddy member"}
                </h2>

                <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {email}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {getRoleLabel(userRole)}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                    {familyName}
                  </span>
                </div>
              </article>

              <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <p className="flex items-center gap-2 text-lg font-black text-foreground">
                  <UsersRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Family workspace
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Family ID
                </p>
                <p className="mt-1 font-mono text-lg font-black tracking-[0.18em] text-foreground">
                  {familyCode}
                </p>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Share this code only with people you trust. New members join
                  with Viewer access by default.
                </p>
              </article>
            </aside>

            <div className="space-y-6">
              <form
                onSubmit={saveProfile}
                className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-black text-foreground">
                      Profile and meal preferences
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your dietary preference helps personalize future AI meal
                      suggestions.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold text-foreground">
                      Full name
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      minLength={2}
                      maxLength={80}
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Email address
                    </span>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="h-12 w-full cursor-not-allowed rounded-xl border border-input bg-muted px-4 text-sm text-muted-foreground"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Phone number
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+91 98765 43210"
                      maxLength={20}
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Dietary preference
                    </span>
                    <select
                      value={dietaryPreference}
                      onChange={(event) =>
                        setDietaryPreference(event.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      <option value="">No preference</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="High protein">High protein</option>
                      <option value="Jain-friendly">Jain-friendly</option>
                      <option value="Low calorie">Low calorie</option>
                    </select>
                  </label>
                </div>

                <div className="mt-7 flex justify-end border-t border-border pt-5">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving profile...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save preferences
                      </>
                    )}
                  </button>
                </div>
              </form>

              <article className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {isDark ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <p className="text-lg font-black text-foreground">
                      Appearance
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Choose the theme most comfortable for your device.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: "light",
                      label: "Light",
                      icon: Sun,
                    },
                    {
                      value: "dark",
                      label: "Dark",
                      icon: Moon,
                    },
                    {
                      value: "system",
                      label: "System",
                      icon: ShieldCheck,
                    },
                  ].map((themeOption) => {
                    const Icon = themeOption.icon;
                    const isSelected =
                      themeOption.value === "system"
                        ? false
                        : resolvedTheme === themeOption.value;

                    return (
                      <button
                        key={themeOption.value}
                        type="button"
                        onClick={() => setTheme(themeOption.value)}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-bold transition ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {themeOption.label}
                      </button>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-black text-foreground">
                      Account security
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Send a secure reset link to your registered email.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Password reset links expire automatically and are handled
                    securely by Supabase Auth.
                  </p>

                  <button
                    type="button"
                    onClick={sendPasswordReset}
                    disabled={isSendingReset}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-950 dark:bg-amber-950/25 dark:text-amber-200 dark:hover:bg-amber-950/40"
                  >
                    {isSendingReset ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send reset link
                      </>
                    )}
                  </button>
                </div>
              </article>

              <article className="rounded-3xl border border-red-200 bg-red-50/60 p-5 shadow-sm dark:border-red-950 dark:bg-red-950/15 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-lg font-black text-red-700 dark:text-red-300">
                      <LogOut className="h-5 w-5" />
                      Log out
                    </p>
                    <p className="mt-2 text-sm leading-6 text-red-700/80 dark:text-red-200/80">
                      End this device session without affecting your account on
                      other devices.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    disabled={isLoggingOut}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" />
                        Log out
                      </>
                    )}
                  </button>
                </div>
              </article>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
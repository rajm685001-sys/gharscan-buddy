import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  ClipboardList,
  CookingPot,
  PackageSearch,
  ScanLine,
  ShoppingBasket,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Shared household inventory",
  description:
    "GharScan Buddy helps families and roommates scan household items, manage groceries, track expiry dates, and plan meals from one shared workspace.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "GharScan Buddy | Shared household inventory",
    description:
      "A shared household workspace for inventory, groceries, expiry tracking, and meal planning.",
    url: "/",
    type: "website",
  },
};
const features = [
  {
    icon: ScanLine,
    title: "Capture what you own",
    description:
      "Scan a product or receipt, review the extracted details, and decide what belongs in your inventory.",
  },
  {
    icon: ClipboardList,
    title: "See what needs attention",
    description:
      "Find low-stock, expiring, and finished items before they become a problem.",
  },
  {
    icon: ShoppingBasket,
    title: "Shop from one list",
    description:
      "Keep the household grocery list in one place instead of scattered messages.",
  },
  {
    icon: CookingPot,
    title: "Plan around what is available",
    description:
      "Use household ingredients as the starting point for practical meal planning.",
  },
  {
    icon: UsersRound,
    title: "Share with the right access",
    description:
      "Use Owner, Editor, and Viewer roles for a private household workspace.",
  },
  {
    icon: PackageSearch,
    title: "Find items quickly",
    description:
      "Organize essentials by category, storage location, quantity, and expiry.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add your household items",
    description:
      "Start with a product scan, a receipt, or a manual inventory entry.",
  },
  {
    number: "02",
    title: "Keep the information current",
    description:
      "Update quantities, mark items finished, and maintain the shared grocery list.",
  },
  {
    number: "03",
    title: "Make the next decision faster",
    description:
      "Use stock, expiry, grocery, and meal views to decide what to buy and use.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="site-container grid gap-12 pb-20 pt-20 sm:pb-28 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="eyebrow">Household inventory for real routines</p>

            <h1 className="mt-5 max-w-3xl text-balance text-4xl font-black leading-[1.02] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-display">
              Know what is at home before you shop.
            </h1>

            <p className="mt-6 max-w-2xl text-body-sm leading-7 text-muted-foreground sm:text-body">
              GharScan Buddy is a shared household workspace for families and
              roommates. Scan products or receipts, keep inventory current, and
              make grocery and meal decisions from the information already at
              home.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="button-primary h-12 px-6">
                Start your household
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link href="#how-it-works" className="button-secondary h-12 px-6">
                See how it works
              </Link>
            </div>

            <ul className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {[
                "For families and roommates",
                "Review before saving",
                "Private household roles",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-l-2 border-emerald-700 pl-6 dark:border-emerald-400 sm:pl-8">
            <p className="eyebrow">Why this matters</p>

            <p className="mt-5 text-2xl font-black leading-tight text-foreground sm:text-3xl">
              Household decisions are easier when everyone sees the same
              information.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <p className="text-sm font-bold text-foreground">
                  Before shopping
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Check what is already available and avoid duplicate purchases.
                </p>
              </div>

              <div>
                <p className="text-sm font-bold text-foreground">
                  Before food expires
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  See what should be used soon and plan around it.
                </p>
              </div>

              <div>
                <p className="text-sm font-bold text-foreground">
                  Before the next meal
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Start with the ingredients already in your home.
                </p>
              </div>
            </div>

            <Link href="/faq" className="button-link mt-8">
              Learn how the workspace works
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-border py-20 sm:py-24">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="eyebrow">One shared workspace</p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              The practical information your household needs every day.
            </h2>

            <p className="mt-4 text-body-sm leading-7 text-muted-foreground sm:text-body">
              Keep the core routines together without turning your home into a
              spreadsheet.
            </p>
          </div>

          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="border-t border-border pt-5"
                >
                  <Icon
                    className="h-5 w-5 text-emerald-700 dark:text-emerald-400"
                    aria-hidden="true"
                  />

                  <h3 className="mt-5 text-lg font-bold text-foreground">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-b border-border py-20 sm:py-24"
      >
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Start small. Keep the household current.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="border-t-2 border-emerald-700 pt-5 dark:border-emerald-400"
              >
                <p className="text-sm font-black tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                  {step.number}
                </p>

                <h3 className="mt-5 text-xl font-bold text-foreground">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Your household stays in control: extracted details are reviewed
              before they become inventory records.
            </p>

            <Link href="/signup" className="button-primary">
              Start your household
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="site-container flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Make the next household decision with better information.
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Start with one family workspace and add the routines that matter
              most.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="button-primary">
              Get started
            </Link>

            <Link href="/login" className="button-secondary">
              Log in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="site-container flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} GharScan Buddy. Built for shared
            household routines.
          </p>

          <nav className="flex flex-wrap gap-5 font-bold">
  <Link href="/faq" className="hover:text-foreground">
    FAQ
  </Link>
  <Link href="/privacy" className="hover:text-foreground">
    Privacy
  </Link>
  <Link href="/contact" className="hover:text-foreground">
    Contact
  </Link>
  <Link href="/login" className="hover:text-foreground">
    Log in
  </Link>
  <Link href="/signup" className="hover:text-foreground">
    Create an account
  </Link>
</nav>
        </div>
      </footer>
    </main>
  );
}
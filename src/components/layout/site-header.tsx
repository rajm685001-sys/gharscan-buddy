"use client";

import { Menu, ScanLine, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { siteConfig } from "@/config/site";

const navigation = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "FAQ", href: "/faq" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b border-border bg-background">
      <div className="site-container flex min-h-[72px] items-center justify-between gap-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setMenuOpen(false)}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-700 text-white"
            aria-hidden="true"
          >
            <ScanLine className="h-5 w-5" />
          </span>

          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-black tracking-tight text-foreground">
              {siteConfig.name}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              Shared household inventory
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />

          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center px-3 text-sm font-bold text-foreground transition-colors hover:text-emerald-700 dark:hover:text-emerald-400"
          >
            Log in
          </Link>

          <Link href="/signup" className="button-primary">
            Get started
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center border border-border text-foreground transition-colors hover:bg-muted"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-navigation"
          className="border-t border-border bg-background px-4 py-5 md:hidden"
        >
          <nav className="site-container flex flex-col gap-1" aria-label="Mobile">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="button-secondary h-11"
              >
                Log in
              </Link>

              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="button-primary h-11"
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
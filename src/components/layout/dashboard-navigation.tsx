"use client";

import {
  BarChart3,
  BellRing,
  CookingPot,
  FileText,
  Home,
  LogOut,
  Menu,
  PackageSearch,
  ScanLine,
  Settings,
  ShoppingBasket,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { createClient } from "@/lib/supabase/client";

type FamilyRole = "owner" | "editor" | "viewer" | null;

type DashboardNavigationProps = {
  familyName: string;
  familyCode: string;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof Home;
  requiresManageAccess?: boolean;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: PackageSearch,
  },
  {
    label: "Scan item",
    href: "/scan",
    icon: ScanLine,
    requiresManageAccess: true,
  },
  {
    label: "Receipt scan",
    href: "/receipt-scan",
    icon: FileText,
    requiresManageAccess: true,
  },
  {
    label: "Grocery list",
    href: "/grocery-list",
    icon: ShoppingBasket,
  },
  {
    label: "Meal planner",
    href: "/meal-planner",
    icon: CookingPot,
  },
  {
    label: "AI meal ideas",
    href: "/ai-meal-planner",
    icon: Sparkles,
    requiresManageAccess: true,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: BellRing,
  },
  {
    label: "Family",
    href: "/family",
    icon: UsersRound,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
   {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Contact",
    href: "/contact",
    icon: FileText,
  },
];

const mobileBottomRoutes = new Set([
  "/dashboard",
  "/inventory",
  "/scan",
  "/receipt-scan",
  "/grocery-list",
  "/meal-planner",
]);

export function DashboardNavigation({
  familyName,
  familyCode,
}: DashboardNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [role, setRole] = useState<FamilyRole>(null);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !active) {
        return;
      }

      const { data: membership } = await supabase
        .from("family_members")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) {
        return;
      }

      setRole((membership?.role as FamilyRole) ?? null);
    }

    void loadRole();

    return () => {
      active = false;
    };
  }, []);

  const canManage = role === "owner" || role === "editor";

  const visibleNavigationItems = useMemo(
    () =>
      navigationItems.filter(
        (item) => !item.requiresManageAccess || canManage,
      ),
    [canManage],
  );

  const mobileNavigationItems = useMemo(
    () =>
      visibleNavigationItems.filter((item) =>
        mobileBottomRoutes.has(item.href),
      ),
    [visibleNavigationItems],
  );

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  async function handleLogout() {
    const shouldLogout = window.confirm(
      "Log out from GharScan Buddy on this device?",
    );

    if (!shouldLogout) {
      return;
    }

    setIsLoggingOut(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      window.alert(`Unable to log out: ${error.message}`);
      setIsLoggingOut(false);
      return;
    }

    setMobileOpen(false);
    router.replace("/");
    router.refresh();
  }

  function desktopLinkClass(href: string) {
    const active = isActive(href);

    return [
      "flex items-center gap-3 border-l-2 px-3 py-3 text-sm font-bold transition-colors",
      active
        ? "border-emerald-700 bg-emerald-50 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300"
        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
    ].join(" ");
  }

  function mobileLinkClass(href: string) {
    const active = isActive(href);

    return [
      "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] font-bold transition-colors",
      active
        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    ].join(" ");
  }

  const navigationContent = (
    <>
      <div className="flex min-h-[72px] items-center justify-between border-b border-border px-5">
        <Link
          href="/dashboard"
          onClick={closeMobileMenu}
          className="flex min-w-0 items-center gap-3"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-700 text-white">
            <ScanLine className="h-5 w-5" />
          </span>

          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-black text-foreground">
              GharScan Buddy
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              Shared household inventory
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={closeMobileMenu}
          className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-6 border-l-2 border-emerald-700 bg-muted/50 px-4 py-3 dark:border-emerald-400">
          <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
            {familyName}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Family ID{" "}
            <span className="font-mono font-bold tracking-wider text-foreground">
              {familyCode}
            </span>
          </p>

          {role ? (
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              Access: {role}
            </p>
          ) : null}
        </div>

        <nav className="space-y-1" aria-label="Dashboard navigation">
          {visibleNavigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={desktopLinkClass(item.href)}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between border border-border px-3 py-2">
          <span className="text-xs font-bold text-muted-foreground">
            Appearance
          </span>
          <ThemeToggle />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-border bg-card lg:flex">
        {navigationContent}
      </aside>

      <header className="sticky top-0 z-40 flex min-h-[72px] items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-700 text-white">
            <ScanLine className="h-5 w-5" />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-foreground">
              GharScan Buddy
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {familyName}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center border border-border text-foreground transition-colors hover:bg-muted"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            onClick={closeMobileMenu}
            aria-label="Close navigation overlay"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col border-r border-border bg-card shadow-2xl">
            {navigationContent}
          </aside>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card px-1 py-1 lg:hidden"
        aria-label="Mobile quick navigation"
      >
        {mobileNavigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={mobileLinkClass(item.href)}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
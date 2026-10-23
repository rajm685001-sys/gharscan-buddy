"use client";

import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  Home,
  LineChart,
  ListChecks,
  ReceiptText,
  ScanLine,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/layout/notification-bell";

type DashboardNavigationProps = {
  familyId?: string;
  familyName: string;
  familyCode: string;
};

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Boxes,
  },
  {
    href: "/scan",
    label: "Scan product",
    icon: ScanLine,
  },
  {
    href: "/receipt-scan",
    label: "Scan receipt",
    icon: ReceiptText,
  },
  {
    href: "/grocery-list",
    label: "Grocery list",
    icon: ListChecks,
  },
  {
    href: "/meal-planner",
    label: "Meal planner",
    icon: ClipboardList,
  },
  {
    href: "/ai-meal-planner",
    label: "AI meal planner",
    icon: LineChart,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/family",
    label: "Family",
    icon: Users,
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function DashboardNavigation({
  familyId,
  familyName,
  familyCode,
}: DashboardNavigationProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-border bg-card lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col">
      <div className="border-b border-border p-6">
        <Link href="/dashboard" className="block">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
            GharScan Buddy
          </p>

          <h2 className="mt-2 text-xl font-black tracking-tight text-foreground">
            {familyName}
          </h2>

          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Family code: {familyCode}
          </p>
        </Link>

        <div className="mt-4 flex items-center justify-between">
          {familyId ? (
  <NotificationBell familyId={familyId} />
) : null}

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-300">
            Active
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${
                isActive
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <Link
          href="/settings"
          className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
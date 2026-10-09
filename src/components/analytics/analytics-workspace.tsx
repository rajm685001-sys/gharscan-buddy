"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ChartNoAxesCombined,
  CircleAlert,
  CookingPot,
  IndianRupee,
  Leaf,
  PackageCheck,
  PackageMinus,
  ShoppingBasket,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import {
  formatDate,
  formatQuantity,
  getCategoryMeta,
  getInventoryStatus,
  getStatusMeta,
} from "@/lib/inventory";
import type {
  AnalyticsSummary,
  CategoryChartData,
  SimpleChartData,
  StatusChartData,
} from "@/types/dashboard";
import type { InventoryItem } from "@/types/inventory";

type AnalyticsWorkspaceProps = {
  familyName: string;
  familyCode: string;
  summary: AnalyticsSummary;
  categoryChartData: CategoryChartData[];
  statusChartData: StatusChartData[];
  expiryTimelineData: SimpleChartData[];
  groceryCompletionData: SimpleChartData[];
  mealStatusData: SimpleChartData[];
  urgentItems: InventoryItem[];
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      color: string;
    };
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-foreground">{item.name}</p>
      <p className="mt-1 text-muted-foreground">
        {item.value} {item.value === 1 ? "item" : "items"}
      </p>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="mt-5 flex h-64 items-center justify-center border border-dashed border-border bg-muted/30 px-6 text-center text-sm leading-6 text-muted-foreground">
      {message}
    </div>
  );
}

function BarDataChart({
  data,
  height = 260,
}: {
  data: SimpleChartData[] | StatusChartData[];
  height?: number;
}) {
  const hasData = data.some((item) => item.value > 0);

  if (!hasData) {
    return <EmptyChart message="No data is available yet." />;
  }

  return (
    <div className="mt-5" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />

          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />

          <Tooltip content={<ChartTooltip />} />

          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsWorkspace({
  familyName,
  familyCode,
  summary,
  categoryChartData,
  statusChartData,
  expiryTimelineData,
  groceryCompletionData,
  mealStatusData,
  urgentItems,
}: AnalyticsWorkspaceProps) {
  const wastePreventionCount = summary.expiringCount;
  const groceryTotal = summary.groceryPending + summary.groceryPurchased;
  const groceryCompletionRate =
    groceryTotal > 0
      ? Math.round((summary.groceryPurchased / groceryTotal) * 100)
      : 0;

  const mealTotal = summary.mealsPlanned + summary.mealsCooked;
  const mealCompletionRate =
    mealTotal > 0
      ? Math.round((summary.mealsCooked / mealTotal) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation
        familyName={familyName}
        familyCode={familyCode}
      />

      <main className="pb-24 lg:ml-72 lg:pb-8">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <header className="border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                  <ChartNoAxesCombined
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Household overview
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                  Inventory analytics
                </h1>

                <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                  Monitor home inventory health, expiry risk, shopping habits,
                  and family meal-planning activity in one place.
                </p>
              </div>

              <Link href="/dashboard" className="button-secondary h-11">
                Back to dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </header>

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Active items",
                value: summary.activeItems,
                description: `${summary.totalItems} total inventory records`,
                icon: PackageCheck,
                className:
                  "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/30",
                iconClassName:
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
              },
              {
                label: "Estimated inventory value",
                value: `₹${Math.round(summary.totalValue).toLocaleString("en-IN")}`,
                description: "Based on saved price and quantity fields",
                icon: IndianRupee,
                className:
                  "border-sky-200 bg-sky-50 dark:border-sky-950 dark:bg-sky-950/30",
                iconClassName:
                  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
              },
              {
                label: "Expiry risk",
                value: summary.expiringCount + summary.expiredCount,
                description: `${summary.expiredCount} expired · ${summary.expiringCount} expiring soon`,
                icon: AlertTriangle,
                className:
                  "border-amber-200 bg-amber-50 dark:border-amber-950 dark:bg-amber-950/30",
                iconClassName:
                  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
              },
              {
                label: "Low stock",
                value: summary.lowStockCount,
                description: `${summary.finishedCount} finished items also tracked`,
                icon: PackageMinus,
                className:
                  "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40",
                iconClassName:
                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
              },
            ].map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className={`border p-5 shadow-sm ${stat.className}`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center ${stat.iconClassName}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <p className="mt-5 text-2xl font-black text-foreground">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-sm font-bold text-foreground">
                    {stat.label}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {stat.description}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-7 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="border border-border bg-card p-5 shadow-sm sm:p-6">
              <div>
                <p className="flex items-center gap-2 text-lg font-black text-foreground">
                  <ChartNoAxesCombined
                    className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  Inventory categories
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Distribution of household records by category.
                </p>
              </div>

              {categoryChartData.length > 0 ? (
                <div className="mt-5 grid items-center gap-5 md:grid-cols-[1fr_0.9fr]">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={94}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>

                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {categoryChartData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <span
                            className="h-3 w-3 shrink-0"
                            style={{ backgroundColor: item.color }}
                            aria-hidden="true"
                          />

                          <span className="truncate">{item.name}</span>
                        </span>

                        <span className="text-sm font-black text-foreground">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyChart message="Add inventory records to see category analysis." />
              )}
            </article>

            <article className="border border-border bg-card p-5 shadow-sm sm:p-6">
              <div>
                <p className="flex items-center gap-2 text-lg font-black text-foreground">
                  <CircleAlert
                    className="h-5 w-5 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  />
                  Inventory health
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Current availability, expiry, and stock condition.
                </p>
              </div>

              <BarDataChart data={statusChartData} />
            </article>
          </section>

          <section className="mt-7 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="border border-border bg-card p-5 shadow-sm sm:p-6">
              <div>
                <p className="flex items-center gap-2 text-lg font-black text-foreground">
                  <CalendarClock
                    className="h-5 w-5 text-red-600 dark:text-red-400"
                    aria-hidden="true"
                  />
                  Expiry timeline
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  See when products require immediate attention.
                </p>
              </div>

              <BarDataChart data={expiryTimelineData} />
            </article>

            <article className="border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm dark:border-emerald-950 dark:bg-emerald-950/20 sm:p-6">
              <span className="flex h-12 w-12 items-center justify-center bg-emerald-600 text-white">
                <Leaf className="h-6 w-6" aria-hidden="true" />
              </span>

              <p className="mt-5 text-xl font-black text-foreground">
                Waste-prevention opportunity
              </p>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                You currently have{" "}
                <span className="font-black text-emerald-700 dark:text-emerald-300">
                  {wastePreventionCount}
                </span>{" "}
                item{wastePreventionCount === 1 ? "" : "s"} nearing expiry.
                Plan meals around these products to reduce household waste.
              </p>

              <Link
                href="/ai-meal-planner"
                className="button-primary mt-6 h-11"
              >
                <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
                Get meal ideas
              </Link>
            </article>
          </section>

          <section className="mt-7 grid gap-6 xl:grid-cols-2">
            <article className="border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-lg font-black text-foreground">
                    <ShoppingBasket
                      className="h-5 w-5 text-sky-600 dark:text-sky-400"
                      aria-hidden="true"
                    />
                    Grocery progress
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {groceryCompletionRate}% of grocery tasks completed.
                  </p>
                </div>

                <span className="border border-sky-200 bg-sky-100 px-3 py-2 text-xs font-black text-sky-700 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300">
                  {summary.groceryPurchased} purchased
                </span>
              </div>

              <BarDataChart data={groceryCompletionData} height={220} />

              <Link href="/grocery-list" className="button-link mt-5">
                Open grocery list
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>

            <article className="border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-lg font-black text-foreground">
                    <CookingPot
                      className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    Meal plan activity
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {mealCompletionRate}% of meal plans marked cooked.
                  </p>
                </div>

                <span className="border border-emerald-200 bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {summary.mealsCooked} cooked
                </span>
              </div>

              <BarDataChart data={mealStatusData} height={220} />

              <Link href="/meal-planner" className="button-link mt-5">
                Open meal planner
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          </section>

          <section className="mt-7 border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-lg font-black text-foreground">
                  <AlertTriangle
                    className="h-5 w-5 text-red-600 dark:text-red-400"
                    aria-hidden="true"
                  />
                  Most urgent inventory items
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Sorted by expiry date so your household can act early.
                </p>
              </div>

              <Link
                href="/notifications"
                className="button-link"
              >
                Notification center
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {urgentItems.length > 0 ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {urgentItems.map((item) => {
                  const category = getCategoryMeta(item.category);
                  const status = getStatusMeta(getInventoryStatus(item));

                  return (
                    <Link
                      key={item.id}
                      href={`/inventory?item=${item.id}`}
                      className="flex items-center gap-3 border border-border bg-background p-3 transition hover:border-emerald-300 hover:shadow-sm dark:hover:border-emerald-800"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-muted text-xl">
                        {category.emoji}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-foreground">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatQuantity(item)} · Expiry:{" "}
                          {formatDate(item.expiry_date)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 border px-2.5 py-1 text-[10px] font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 border border-dashed border-border px-6 py-14 text-center">
                <PackageCheck
                  className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />

                <p className="mt-4 text-lg font-black text-foreground">
                  Your inventory looks healthy
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  No expired or soon-to-expire items are currently detected.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
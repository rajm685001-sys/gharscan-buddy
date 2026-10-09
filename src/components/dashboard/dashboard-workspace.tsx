"use client";

import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  ChefHat,
  CookingPot,
  Database,
  IndianRupee,
  Leaf,
  Loader2,
  Package,
  Plus,
  ScanLine,
  ShoppingBasket,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type {
  CategoryChartData,
  StatusChartData,
} from "@/types/dashboard";

import { AddInventoryItemDialog } from "@/components/inventory/add-inventory-item-dialog";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import {
  formatDate,
  formatQuantity,
  getCategoryMeta,
  getInventoryStatus,
  getStatusMeta,
} from "@/lib/inventory";
import type { InventoryItem, StorageLocation } from "@/types/inventory";
type HomeZone = {
  value: StorageLocation;
  label: string;
  emoji: string;
  description: string;
  color: string;
};

type DashboardWorkspaceProps = {
  familyId: string;
  userId: string;
  userRole: "owner" | "editor" | "viewer";
  familyName: string;
  familyCode: string;
  firstName: string;
  inventoryItems: InventoryItem[];
  pendingGroceryCount: number;
  weeklyMealCount: number;
  categoryChartData: CategoryChartData[];
  statusChartData: StatusChartData[];
  homeZones: HomeZone[];
  zoneCounts: Record<string, number>;
};

export function DashboardWorkspace({
  familyId,
  userId,
  userRole,
  familyName,
  familyCode,
  firstName,
  inventoryItems,
  pendingGroceryCount,
  weeklyMealCount,
  homeZones,
  zoneCounts,
}: DashboardWorkspaceProps) {
  const [isSeeding, setIsSeeding] = useState(false);

  const totalItems = inventoryItems.length;

  const expiringSoonItems = inventoryItems.filter(
    (item) => getInventoryStatus(item) === "expiring_soon",
  );

  const expiredItems = inventoryItems.filter(
    (item) => getInventoryStatus(item) === "expired",
  );

  const lowStockItems = inventoryItems.filter(
    (item) => getInventoryStatus(item) === "low_stock",
  );

  const canAddItems = userRole === "owner" || userRole === "editor";
  const recentItems = inventoryItems.slice(0, 5);

  const foodItems = inventoryItems.filter((item) =>
    ["food", "pantry", "fresh_food", "beverages"].includes(item.category),
  );

  const nutritionMessage =
    foodItems.length > 0
      ? "Nutrition details will appear when product labels include usable nutrition information."
      : "Add food items to start building your nutritional overview.";

  async function loadDemoData() {
    setIsSeeding(true);

    await new Promise((resolve) => setTimeout(resolve, 900));

    setIsSeeding(false);

    window.alert(
      "Demo data loading will be connected to a secure family-scoped seed action in the next refinement.",
    );
  }

  const statCards = [
    {
      label: "Total items",
      value: totalItems,
      icon: Package,
      className:
        "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/30",
    },
    {
      label: "Expiring soon",
      value: expiringSoonItems.length,
      icon: AlertTriangle,
      className:
        "border-amber-200 bg-amber-50 dark:border-amber-950 dark:bg-amber-950/30",
    },
    {
      label: "Low stock",
      value: lowStockItems.length,
      icon: TrendingUp,
      className:
        "border-sky-200 bg-sky-50 dark:border-sky-950 dark:bg-sky-950/30",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation
        familyName={familyName}
        familyCode={familyCode}
      />

      <main className="pb-24 lg:ml-72 lg:pb-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:px-6 lg:px-8">
          <header className="border-b border-border pb-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  {familyName}
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                  Welcome, {firstName}
                </h1>

                <p className="mt-2 text-muted-foreground">
                  Start with what needs your attention today.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {totalItems === 0 && (
                  <button
                    type="button"
                    onClick={loadDemoData}
                    disabled={isSeeding}
                    className="button-secondary h-11 disabled:opacity-60"
                  >
                    {isSeeding ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Database className="h-4 w-4" aria-hidden="true" />
                    )}

                    {isSeeding ? "Loading..." : "Load demo data"}
                  </button>
                )}

                {canAddItems && (
                  <AddInventoryItemDialog
                    familyId={familyId}
                    userId={userId}
                    onItemAdded={() => {
                      window.location.reload();
                    }}
                    triggerLabel="Add item"
                    triggerIcon={<Plus className="h-4 w-4" />}
                  />
                )}

                <Link href="/scan" className="button-primary h-11">
                  <ScanLine className="h-4 w-4" aria-hidden="true" />
                  Scan product
                </Link>
              </div>
            </div>
          </header>

          <section>
            <div className="mb-4">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                At a glance
              </p>

              <h2 className="mt-1 text-2xl font-black text-foreground">
                What is happening at home
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {statCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.label}
                    className={`border p-5 shadow-sm ${card.className}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {card.label}
                        </p>

                        <p className="mt-1 text-3xl font-black text-foreground">
                          {card.value}
                        </p>
                      </div>

                      <Icon
                        className="h-7 w-7 text-foreground/60"
                        aria-hidden="true"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-foreground">
                  Home zones
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Organize your household by where items are stored.
                </p>
              </div>

              <Link href="/inventory" className="button-link">
                View all
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {homeZones.map((zone) => (
                <Link
                  key={zone.value}
                  href={`/inventory?location=${zone.value}`}
                  className={`border border-border p-4 text-center transition hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-800 ${zone.color}`}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {zone.emoji}
                  </span>

                  <p className="mt-3 text-sm font-black capitalize text-foreground">
                    {zone.label}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {zoneCounts[zone.value] ?? 0}{" "}
                    {(zoneCounts[zone.value] ?? 0) === 1 ? "item" : "items"}
                  </p>

                  <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                    {zone.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-black text-foreground">
                Nutritional overview
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Food nutrition insights depend on usable information from
                product labels.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Calories",
                  value: foodItems.length > 0 ? "To be added" : "—",
                  icon: IndianRupee,
                  className:
                    "border-orange-200 bg-orange-50 dark:border-orange-950 dark:bg-orange-950/20",
                },
                {
                  label: "Protein",
                  value: foodItems.length > 0 ? "To be added" : "—",
                  icon: Leaf,
                  className:
                    "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/20",
                },
                {
                  label: "Carbohydrates",
                  value: foodItems.length > 0 ? "To be added" : "—",
                  icon: UtensilsCrossed,
                  className:
                    "border-sky-200 bg-sky-50 dark:border-sky-950 dark:bg-sky-950/20",
                },
                {
                  label: "Fats",
                  value: foodItems.length > 0 ? "To be added" : "—",
                  icon: CookingPot,
                  className:
                    "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.label}
                    className={`border p-5 ${item.className}`}
                  >
                    <Icon
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />

                    <p className="mt-4 text-xl font-black text-foreground">
                      {item.value}
                    </p>

                    <p className="mt-1 text-sm font-bold text-foreground">
                      {item.label}
                    </p>
                  </article>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {nutritionMessage}
            </p>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">
                  Recent items
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Your latest household inventory additions.
                </p>
              </div>

              <Link href="/inventory" className="button-link">
                View all
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {recentItems.length === 0 ? (
              <div className="border border-dashed border-border bg-card p-10 text-center">
                <Package
                  className="mx-auto text-muted-foreground"
                  size={40}
                  aria-hidden="true"
                />

                <p className="mt-4 text-muted-foreground">
                  No items yet. Start by adding your first household item.
                </p>

                <Link
                  href="/inventory"
                  className="button-primary mt-5 h-11"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add first item
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentItems.map((item) => {
                  const category = getCategoryMeta(item.category);
                  const status = getStatusMeta(getInventoryStatus(item));

                  return (
                    <Link
                      key={item.id}
                      href={`/inventory?item=${item.id}`}
                      className="flex items-center justify-between gap-4 border border-border bg-card p-4 transition hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-800"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-muted text-xl">
                          {category.emoji}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatQuantity(item)}
                            {item.brand ? ` · ${item.brand}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {item.expiry_date && (
                          <span
                            className={`border px-2.5 py-1 text-[10px] font-bold ${status.className}`}
                          >
                            {formatDate(item.expiry_date)}
                          </span>
                        )}

                        <span className="text-[11px] text-muted-foreground">
                          {category.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/grocery-list"
              className="group flex items-center gap-3 border border-border bg-card p-5 transition hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-800"
            >
              <div className="bg-emerald-600 p-3 text-white">
                <ShoppingBasket
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">Grocery list</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {pendingGroceryCount} pending item
                  {pendingGroceryCount === 1 ? "" : "s"} · Plan your shopping
                </p>
              </div>

              <ArrowRight
                className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/ai-meal-planner"
              className="group flex items-center gap-3 border border-border bg-card p-5 transition hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-800"
            >
              <div className="bg-emerald-600 p-3 text-white">
                <ChefHat className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">Meal ideas</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Cook with what you already have
                </p>
              </div>

              <ArrowRight
                className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/meal-planner"
              className="group flex items-center gap-3 border border-border bg-card p-5 transition hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-800"
            >
              <div className="bg-emerald-600 p-3 text-white">
                <CookingPot className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">Weekly planner</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {weeklyMealCount} meal
                  {weeklyMealCount === 1 ? "" : "s"} planned this week
                </p>
              </div>

              <ArrowRight
                className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/notifications"
              className="group flex items-center gap-3 border border-border bg-card p-5 transition hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-800"
            >
              <div className="bg-red-500 p-3 text-white">
                <BellRing className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">Expiry alerts</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {expiredItems.length + expiringSoonItems.length} item
                  {expiredItems.length + expiringSoonItems.length === 1
                    ? ""
                    : "s"}{" "}
                  need attention
                </p>
              </div>

              <ArrowRight
                className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
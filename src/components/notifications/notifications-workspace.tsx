"use client";

import {
  BellRing,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Filter,
  PackageOpen,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import {
  buildInventoryNotifications,
  getNotificationMeta,
  getPriorityMeta,
} from "@/lib/notifications";
import type { InventoryItem } from "@/types/inventory";

type NotificationsWorkspaceProps = {
  items: InventoryItem[];
  familyName: string;
  familyCode: string;
};

type NotificationFilter =
  | "all"
  | "urgent"
  | "expiry"
  | "low_stock"
  | "finished";

export function NotificationsWorkspace({
  items,
  familyName,
  familyCode,
}: NotificationsWorkspaceProps) {
  const notifications = useMemo(
    () => buildInventoryNotifications(items),
    [items],
  );

  const [activeFilter, setActiveFilter] =
    useState<NotificationFilter>("all");
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(
    [],
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (activeFilter === "all") {
        return true;
      }

      if (activeFilter === "urgent") {
        return notification.priority === "urgent";
      }

      if (activeFilter === "expiry") {
        return (
          notification.type === "expired" ||
          notification.type === "expiring_soon"
        );
      }

      if (activeFilter === "low_stock") {
        return notification.type === "low_stock";
      }

      return notification.type === "finished";
    });
  }, [activeFilter, notifications]);

  const counts = useMemo(
    () => ({
      total: notifications.length,
      urgent: notifications.filter(
        (notification) => notification.priority === "urgent",
      ).length,
      expiry: notifications.filter(
        (notification) =>
          notification.type === "expired" ||
          notification.type === "expiring_soon",
      ).length,
      lowStock: notifications.filter(
        (notification) => notification.type === "low_stock",
      ).length,
    }),
    [notifications],
  );

  function markAllAsRead() {
    setReadNotificationIds(notifications.map((notification) => notification.id));
  }

  function markAsRead(notificationId: string) {
    setReadNotificationIds((currentIds) =>
      currentIds.includes(notificationId)
        ? currentIds
        : [...currentIds, notificationId],
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation
        familyName={familyName}
        familyCode={familyCode}
      />

      <main className="pb-24 lg:ml-72 lg:pb-8">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-5 border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                Smart alerts
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                Notification center
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                GharScan Buddy checks your home inventory for expiry, low-stock,
                and finished-item alerts.
              </p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={notifications.length === 0}
              className="button-secondary h-11 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              Mark all as read
            </button>
          </header>

          <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "All alerts",
                value: counts.total,
                icon: BellRing,
                className:
                  "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/30",
                iconClassName:
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
              },
              {
                label: "Urgent",
                value: counts.urgent,
                icon: CircleAlert,
                className:
                  "border-red-200 bg-red-50 dark:border-red-950 dark:bg-red-950/30",
                iconClassName:
                  "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
              },
              {
                label: "Expiry alerts",
                value: counts.expiry,
                icon: RefreshCw,
                className:
                  "border-amber-200 bg-amber-50 dark:border-amber-950 dark:bg-amber-950/30",
                iconClassName:
                  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
              },
              {
                label: "Low stock",
                value: counts.lowStock,
                icon: PackageOpen,
                className:
                  "border-sky-200 bg-sky-50 dark:border-sky-950 dark:bg-sky-950/30",
                iconClassName:
                  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
              },
            ].map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className={`border p-4 ${stat.className}`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center ${stat.iconClassName}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <p className="mt-4 text-2xl font-black text-foreground">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    {stat.label}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-7 border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Filter
                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />

                <p className="text-sm font-black text-foreground">
                  Filter alerts
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "urgent", label: "Urgent" },
                  { value: "expiry", label: "Expiry" },
                  { value: "low_stock", label: "Low stock" },
                  { value: "finished", label: "Finished" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() =>
                      setActiveFilter(filter.value as NotificationFilter)
                    }
                    className={`border px-3 py-2 text-xs font-bold transition ${
                      activeFilter === filter.value
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-border bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                    }`}
                    aria-pressed={activeFilter === filter.value}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-foreground">
                  {activeFilter === "all"
                    ? "All notifications"
                    : "Filtered notifications"}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {filteredNotifications.length}{" "}
                  {filteredNotifications.length === 1 ? "alert" : "alerts"}{" "}
                  currently shown
                </p>
              </div>
            </div>

            {filteredNotifications.length > 0 ? (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const meta = getNotificationMeta(notification.type);
                  const Icon = meta.icon;
                  const priority = getPriorityMeta(notification.priority);
                  const isRead = readNotificationIds.includes(notification.id);

                  return (
                    <article
                      key={notification.id}
                      className={`relative overflow-hidden border bg-card p-4 shadow-sm transition sm:p-5 ${
                        isRead
                          ? "border-border opacity-75"
                          : "border-emerald-200 shadow-emerald-950/5 dark:border-emerald-900"
                      }`}
                    >
                      {!isRead && (
                        <span
                          className="absolute left-0 top-0 h-full w-1 bg-emerald-500"
                          aria-hidden="true"
                        />
                      )}

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center ${meta.iconClassName}`}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-black text-foreground sm:text-base">
                              {notification.title}
                            </h3>

                            <span
                              className={`border px-2.5 py-1 text-[10px] font-bold ${meta.badgeClassName}`}
                            >
                              {meta.label}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {notification.description}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                          <span
                            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-bold ${priority.className}`}
                          >
                            <CircleAlert
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                            {priority.label}
                          </span>

                          <Link
                            href={`/inventory?item=${notification.itemId}`}
                            onClick={() => markAsRead(notification.id)}
                            className="button-link"
                          >
                            View item
                            <ChevronRight
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-border bg-card px-6 py-16 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </span>

                <h3 className="mt-5 text-lg font-black text-foreground">
                  You are all caught up
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  No inventory items currently match this alert filter. Keep
                  adding expiry dates and low-stock thresholds to receive
                  useful reminders here.
                </p>

                <Link
                  href="/inventory"
                  className="button-primary mt-6 h-11 px-5"
                >
                  Open inventory
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
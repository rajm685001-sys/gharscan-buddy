import {
  BellRing,
  CalendarClock,
  CircleAlert,
  PackageMinus,
  PackageX,
} from "lucide-react";

import { formatDate, getInventoryStatus } from "@/lib/inventory";
import type { InventoryItem, InventoryStatus } from "@/types/inventory";

export type NotificationType =
  | "expired"
  | "expiring_soon"
  | "low_stock"
  | "finished";

export type InventoryNotification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  itemId: string;
  itemName: string;
  createdAt: string;
  priority: "urgent" | "warning" | "info";
  isRead: boolean;
};

export function getDaysUntilExpiry(expiryDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${expiryDate}T00:00:00`);
  const differenceInMilliseconds = expiry.getTime() - today.getTime();

  return Math.ceil(differenceInMilliseconds / (1000 * 60 * 60 * 24));
}

export function buildInventoryNotifications(
  items: InventoryItem[],
): InventoryNotification[] {
  const notifications: InventoryNotification[] = [];

  for (const item of items) {
    const status = getInventoryStatus(item);

    if (status === "expired") {
      notifications.push({
        id: `expired-${item.id}`,
        type: "expired",
        title: `${item.name} has expired`,
        description: item.expiry_date
          ? `Expired on ${formatDate(item.expiry_date)}. Review the item and discard it safely if needed.`
          : "This item has expired. Review it now.",
        itemId: item.id,
        itemName: item.name,
        createdAt: item.expiry_date ?? item.updated_at,
        priority: "urgent",
        isRead: false,
      });

      continue;
    }

    if (status === "expiring_soon" && item.expiry_date) {
      const days = getDaysUntilExpiry(item.expiry_date);

      notifications.push({
        id: `expiring-${item.id}`,
        type: "expiring_soon",
        title:
          days === 0
            ? `${item.name} expires today`
            : `${item.name} expires in ${days} ${days === 1 ? "day" : "days"}`,
        description: `Expiry date: ${formatDate(item.expiry_date)}. Consider using it in your next meal plan.`,
        itemId: item.id,
        itemName: item.name,
        createdAt: item.expiry_date,
        priority: days <= 2 ? "urgent" : "warning",
        isRead: false,
      });

      continue;
    }

    if (status === "low_stock") {
      notifications.push({
        id: `low-stock-${item.id}`,
        type: "low_stock",
        title: `${item.name} is running low`,
        description: `Only ${item.quantity} ${item.unit} remaining. Your threshold is ${item.minimum_quantity} ${item.unit}.`,
        itemId: item.id,
        itemName: item.name,
        createdAt: item.updated_at,
        priority: "warning",
        isRead: false,
      });

      continue;
    }

    if (status === "finished") {
      notifications.push({
        id: `finished-${item.id}`,
        type: "finished",
        title: `${item.name} is finished`,
        description:
          "This item has no remaining quantity. Add it to your grocery list if you need to restock.",
        itemId: item.id,
        itemName: item.name,
        createdAt: item.updated_at,
        priority: "info",
        isRead: false,
      });
    }
  }

  return notifications.sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}

export function getNotificationMeta(type: NotificationType) {
  const notifications = {
    expired: {
      label: "Expired",
      icon: PackageX,
      iconClassName:
        "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
      badgeClassName:
        "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    },
    expiring_soon: {
      label: "Expiring soon",
      icon: CalendarClock,
      iconClassName:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      badgeClassName:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    },
    low_stock: {
      label: "Low stock",
      icon: PackageMinus,
      iconClassName:
        "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
      badgeClassName:
        "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    },
    finished: {
      label: "Finished",
      icon: BellRing,
      iconClassName:
        "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      badgeClassName:
        "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
  } as const;

  return notifications[type];
}

export function getPriorityMeta(priority: InventoryNotification["priority"]) {
  const priorities = {
    urgent: {
      label: "Urgent",
      icon: CircleAlert,
      className:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300",
    },
    warning: {
      label: "Needs attention",
      icon: CircleAlert,
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-300",
    },
    info: {
      label: "Information",
      icon: BellRing,
      className:
        "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
    },
  } as const;

  return priorities[priority];
}

export function getNotificationStatus(
  item: InventoryItem,
): InventoryStatus {
  return getInventoryStatus(item);
}
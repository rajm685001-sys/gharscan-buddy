import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";
import { getInventoryStatus } from "@/lib/inventory";
import { getStartOfWeek, formatDateInput } from "@/lib/meal-planner";
import { createClient } from "@/lib/supabase/server";
import type {
  CategoryChartData,
  StatusChartData,
} from "@/types/dashboard";
import type { InventoryItem } from "@/types/inventory";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your private household inventory overview.",
  robots: {
    index: false,
    follow: false,
  },
};

const categoryColors: Record<string, string> = {
  food: "#10b981",
  pantry: "#f59e0b",
  fresh_food: "#22c55e",
  beverages: "#0ea5e9",
  medicine: "#ef4444",
  toiletries: "#8b5cf6",
  cleaning: "#06b6d4",
  stationery: "#6366f1",
  kitchen_supplies: "#f97316",
  electronics: "#64748b",
  baby_care: "#ec4899",
  pet_supplies: "#d946ef",
  other: "#84cc16",
};

const categoryLabels: Record<string, string> = {
  food: "Food",
  pantry: "Pantry",
  fresh_food: "Fresh food",
  beverages: "Beverages",
  medicine: "Medicines",
  toiletries: "Toiletries",
  cleaning: "Cleaning",
  stationery: "Stationery",
  kitchen_supplies: "Kitchen supplies",
  electronics: "Electronics",
  baby_care: "Baby care",
  pet_supplies: "Pet supplies",
  other: "Other",
};

const homeZones: Array<{
  value:
    | "pantry"
    | "fridge"
    | "freezer"
    | "medicine_box"
    | "bathroom"
    | "cleaning_shelf"
    | "bedroom"
    | "pooja"
    | "garage"
    | "other";
  label: string;
  emoji: string;
  description: string;
  color: string;
}> = [
  {
    value: "pantry",
    label: "Pantry",
    emoji: "🫙",
    description: "Grains, pulses, snacks",
    color: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    value: "fridge",
    label: "Fridge",
    emoji: "🧊",
    description: "Milk, paneer, vegetables",
    color: "bg-sky-50 dark:bg-sky-950/30",
  },
  {
    value: "freezer",
    label: "Freezer",
    emoji: "❄️",
    description: "Frozen and stored food",
    color: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  {
    value: "medicine_box",
    label: "Medicines",
    emoji: "💊",
    description: "Health and first aid",
    color: "bg-red-50 dark:bg-red-950/30",
  },
  {
    value: "bathroom",
    label: "Bathroom",
    emoji: "🧴",
    description: "Personal care items",
    color: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    value: "cleaning_shelf",
    label: "Cleaning",
    emoji: "🧹",
    description: "Cleaning and laundry",
    color: "bg-teal-50 dark:bg-teal-950/30",
  },
  {
    value: "bedroom",
    label: "Study",
    emoji: "🖊️",
    description: "Stationery and office",
    color: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    value: "pooja",
    label: "Pooja",
    emoji: "🪔",
    description: "Devotional supplies",
    color: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    value: "other",
    label: "Other",
    emoji: "📦",
    description: "Other home essentials",
    color: "bg-lime-50 dark:bg-lime-950/30",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("family_members")
    .select(
      `
      family_id,
      role,
      families (
        name,
        family_code
      )
    `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const weekStart = getStartOfWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const [
    { data: inventoryItems, error: inventoryError },
    { count: pendingGroceryCount },
    { count: weeklyMealCount },
  ] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("family_id", membership.family_id)
      .order("created_at", { ascending: false }),

    supabase
      .from("grocery_items")
      .select("*", { count: "exact", head: true })
      .eq("family_id", membership.family_id)
      .eq("status", "pending"),

    supabase
      .from("meal_plans")
      .select("*", { count: "exact", head: true })
      .eq("family_id", membership.family_id)
      .gte("meal_date", formatDateInput(weekStart))
      .lte("meal_date", formatDateInput(weekEnd)),
  ]);

  if (inventoryError) {
    throw new Error("Unable to load dashboard data.");
  }

  const items = (inventoryItems ?? []) as InventoryItem[];

  const expiringSoon = items.filter(
    (item) => getInventoryStatus(item) === "expiring_soon",
  );

  const lowStockItems = items.filter(
    (item) => getInventoryStatus(item) === "low_stock",
  );

  const categoryCounts = items.reduce<Record<string, number>>(
    (counts, item) => {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const zoneCounts = items.reduce<Record<string, number>>((counts, item) => {
    counts[item.storage_location] =
      (counts[item.storage_location] ?? 0) + 1;
    return counts;
  }, {});

  const categoryChartData: CategoryChartData[] = Object.entries(categoryCounts)
    .map(([category, value]) => ({
      name: categoryLabels[category] ?? "Other",
      value,
      color: categoryColors[category] ?? "#84cc16",
    }))
    .sort((first, second) => second.value - first.value);

  const statusChartData: StatusChartData[] = [
    {
      name: "Available",
      value: items.filter(
        (item) => getInventoryStatus(item) === "available",
      ).length,
      color: "#10b981",
    },
    {
      name: "Expiring",
      value: expiringSoon.length,
      color: "#f59e0b",
    },
    {
      name: "Expired",
      value: items.filter(
        (item) => getInventoryStatus(item) === "expired",
      ).length,
      color: "#ef4444",
    },
    {
      name: "Low stock",
      value: lowStockItems.length,
      color: "#0ea5e9",
    },
    {
      name: "Finished",
      value: items.filter(
        (item) => getInventoryStatus(item) === "finished",
      ).length,
      color: "#64748b",
    },
  ];

  const family = Array.isArray(membership.families)
    ? membership.families[0]
    : membership.families;

  const firstName =
    user.user_metadata.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <DashboardWorkspace
      familyId={membership.family_id}
      userId={user.id}
      userRole={membership.role}
      familyName={family?.name ?? "Family workspace"}
      familyCode={family?.family_code ?? "--------"}
      firstName={firstName}
      inventoryItems={items}
      pendingGroceryCount={pendingGroceryCount ?? 0}
      weeklyMealCount={weeklyMealCount ?? 0}
      categoryChartData={categoryChartData}
      statusChartData={statusChartData}
      homeZones={homeZones}
      zoneCounts={zoneCounts}
    />
  );
}
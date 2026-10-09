import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AnalyticsWorkspace } from "@/components/analytics/analytics-workspace";
import { getInventoryStatus } from "@/lib/inventory";
import { createClient } from "@/lib/supabase/server";
import type {
  AnalyticsSummary,
  CategoryChartData,
  SimpleChartData,
  StatusChartData,
} from "@/types/dashboard";
import type { GroceryItem } from "@/types/grocery";
import type { InventoryItem } from "@/types/inventory";
import type { MealPlan } from "@/types/meal";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View household inventory, grocery, and meal insights.",
  robots: {
    index: false,
    follow: false,
  },
};

const categoryColors: Record<string, string> = {
  food: "#10b981",
  medicine: "#f97316",
  toiletries: "#8b5cf6",
  cleaning: "#0ea5e9",
  electronics: "#64748b",
  pet_supplies: "#ec4899",
  other: "#84cc16",
};

const categoryLabels: Record<string, string> = {
  food: "Food",
  medicine: "Medicine",
  toiletries: "Toiletries",
  cleaning: "Cleaning",
  electronics: "Electronics",
  pet_supplies: "Pet supplies",
  other: "Other",
};

function getDaysUntilExpiry(expiryDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${expiryDate}T00:00:00`);
  const difference = expiry.getTime() - today.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function normalizeCategory(category: string | null | undefined) {
  const normalized = category?.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (normalized && normalized in categoryLabels) {
    return normalized;
  }

  return "other";
}

export default async function AnalyticsPage() {
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

  const [
    { data: inventoryItems, error: inventoryError },
    { data: groceryItems },
    { data: mealPlans },
  ] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("family_id", membership.family_id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("grocery_items")
      .select("*")
      .eq("family_id", membership.family_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("meal_plans")
      .select("*")
      .eq("family_id", membership.family_id)
      .order("meal_date", { ascending: false })
      .limit(100),
  ]);

  if (inventoryError) {
    throw new Error("Unable to load analytics data.");
  }

  const items = (inventoryItems ?? []) as InventoryItem[];
  const groceries = (groceryItems ?? []) as GroceryItem[];
  const meals = (mealPlans ?? []) as MealPlan[];

  const activeItems = items.filter(
    (item) =>
      !item.is_finished &&
      Number(item.quantity) > 0 &&
      getInventoryStatus(item) !== "expired",
  );

  const totalValue = activeItems.reduce((total, item) => {
    const itemPrice = Number(item.price ?? 0);
    const quantity = Number(item.quantity ?? 0);

    return total + itemPrice * Math.max(quantity, 1);
  }, 0);

  const expiringItems = items.filter(
    (item) => getInventoryStatus(item) === "expiring_soon",
  );

  const expiredItems = items.filter(
    (item) => getInventoryStatus(item) === "expired",
  );

  const lowStockItems = items.filter(
    (item) => getInventoryStatus(item) === "low_stock",
  );

  const finishedItems = items.filter(
    (item) => getInventoryStatus(item) === "finished",
  );

  const categoryCounts = items.reduce<Record<string, number>>(
    (counts, item) => {
      const category = normalizeCategory(item.category);

      counts[category] = (counts[category] ?? 0) + 1;

      return counts;
    },
    {},
  );

  const categoryChartData: CategoryChartData[] = Object.entries(categoryCounts)
    .map(([category, value]) => ({
      name: categoryLabels[category],
      value,
      color: categoryColors[category],
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
      value: expiringItems.length,
      color: "#f59e0b",
    },
    {
      name: "Expired",
      value: expiredItems.length,
      color: "#ef4444",
    },
    {
      name: "Low stock",
      value: lowStockItems.length,
      color: "#0ea5e9",
    },
    {
      name: "Finished",
      value: finishedItems.length,
      color: "#64748b",
    },
  ];

  const expiryTimelineData: SimpleChartData[] = [
    {
      name: "Expired",
      value: expiredItems.length,
      color: "#ef4444",
    },
    {
      name: "Today",
      value: items.filter(
        (item) =>
          item.expiry_date &&
          getDaysUntilExpiry(item.expiry_date) === 0 &&
          getInventoryStatus(item) !== "finished",
      ).length,
      color: "#f97316",
    },
    {
      name: "1–3 days",
      value: items.filter((item) => {
        if (!item.expiry_date || getInventoryStatus(item) === "finished") {
          return false;
        }

        const days = getDaysUntilExpiry(item.expiry_date);
        return days >= 1 && days <= 3;
      }).length,
      color: "#f59e0b",
    },
    {
      name: "4–7 days",
      value: items.filter((item) => {
        if (!item.expiry_date || getInventoryStatus(item) === "finished") {
          return false;
        }

        const days = getDaysUntilExpiry(item.expiry_date);
        return days >= 4 && days <= 7;
      }).length,
      color: "#eab308",
    },
    {
      name: "Later",
      value: items.filter((item) => {
        if (!item.expiry_date || getInventoryStatus(item) === "finished") {
          return false;
        }

        return getDaysUntilExpiry(item.expiry_date) > 7;
      }).length,
      color: "#10b981",
    },
  ];

  const groceryCompletionData: SimpleChartData[] = [
    {
      name: "Pending",
      value: groceries.filter((item) => item.status === "pending").length,
      color: "#f59e0b",
    },
    {
      name: "Purchased",
      value: groceries.filter((item) => item.status === "purchased").length,
      color: "#10b981",
    },
  ];

  const mealStatusData: SimpleChartData[] = [
    {
      name: "Planned",
      value: meals.filter((meal) => meal.status === "planned").length,
      color: "#0ea5e9",
    },
    {
      name: "Cooked",
      value: meals.filter((meal) => meal.status === "cooked").length,
      color: "#10b981",
    },
    {
      name: "Skipped",
      value: meals.filter((meal) => meal.status === "skipped").length,
      color: "#64748b",
    },
  ];

  const summary: AnalyticsSummary = {
    totalItems: items.length,
    activeItems: activeItems.length,
    totalValue,
    expiringCount: expiringItems.length,
    expiredCount: expiredItems.length,
    lowStockCount: lowStockItems.length,
    finishedCount: finishedItems.length,
    groceryPending: groceries.filter((item) => item.status === "pending")
      .length,
    groceryPurchased: groceries.filter((item) => item.status === "purchased")
      .length,
    mealsPlanned: meals.filter((meal) => meal.status === "planned").length,
    mealsCooked: meals.filter((meal) => meal.status === "cooked").length,
  };

  const urgentItems = [...expiredItems, ...expiringItems]
    .sort((first, second) => {
      const firstDate = first.expiry_date ?? "9999-12-31";
      const secondDate = second.expiry_date ?? "9999-12-31";

      return firstDate.localeCompare(secondDate);
    })
    .slice(0, 8);

  const family = Array.isArray(membership.families)
    ? membership.families[0]
    : membership.families;

  return (
    <AnalyticsWorkspace
      familyName={family?.name ?? "Family"}
      familyCode={family?.family_code ?? "--------"}
      summary={summary}
      categoryChartData={categoryChartData}
      statusChartData={statusChartData}
      expiryTimelineData={expiryTimelineData}
      groceryCompletionData={groceryCompletionData}
      mealStatusData={mealStatusData}
      urgentItems={urgentItems}
    />
  );
}
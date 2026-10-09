import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MealPlannerWorkspace } from "@/components/meal-planner/meal-planner-workspace";
import { getStartOfWeek, formatDateInput } from "@/lib/meal-planner";
import { createClient } from "@/lib/supabase/server";
import type { GroceryItem } from "@/types/grocery";
import type { InventoryItem } from "@/types/inventory";
import type { MealPlan } from "@/types/meal";

export const metadata: Metadata = {
  title: "Meal planner",
  description: "Plan household meals and organize ingredients.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MealPlannerPage() {
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
    { data: mealPlans, error: mealError },
    { data: inventoryItems },
    { data: groceryItems },
  ] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("*")
      .eq("family_id", membership.family_id)
      .gte("meal_date", formatDateInput(weekStart))
      .lte("meal_date", formatDateInput(weekEnd))
      .order("meal_date", { ascending: true }),

    supabase
      .from("inventory_items")
      .select("*")
      .eq("family_id", membership.family_id)
      .order("updated_at", { ascending: false }),

    supabase
      .from("grocery_items")
      .select("*")
      .eq("family_id", membership.family_id)
      .eq("status", "pending"),
  ]);

  if (mealError) {
    throw new Error("Unable to load meal plan.");
  }

  const family = Array.isArray(membership.families)
    ? membership.families[0]
    : membership.families;

  return (
    <MealPlannerWorkspace
      initialMeals={(mealPlans ?? []) as MealPlan[]}
      inventoryItems={(inventoryItems ?? []) as InventoryItem[]}
      pendingGroceryItems={(groceryItems ?? []) as GroceryItem[]}
      familyId={membership.family_id}
      familyName={family?.name ?? "Family"}
      familyCode={family?.family_code ?? "--------"}
      userId={user.id}
      userRole={membership.role}
    />
  );
}
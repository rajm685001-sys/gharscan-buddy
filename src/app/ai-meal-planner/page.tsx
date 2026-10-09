import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AiMealPlannerWorkspace } from "@/components/meal-planner/ai-meal-planner-workspace";
import { createClient } from "@/lib/supabase/server";
import type { GroceryItem } from "@/types/grocery";
import type { InventoryItem } from "@/types/inventory";

export const metadata: Metadata = {
  title: "AI meal planner",
  description:
    "Generate meal ideas from your household inventory and grocery items.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AiMealPlannerPage() {
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

  const canManageMeals =
    membership.role === "owner" || membership.role === "editor";

  if (!canManageMeals) {
    redirect("/meal-planner");
  }

  const [{ data: inventoryItems }, { data: groceryItems }] =
    await Promise.all([
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

  const family = Array.isArray(membership.families)
    ? membership.families[0]
    : membership.families;

  return (
    <AiMealPlannerWorkspace
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
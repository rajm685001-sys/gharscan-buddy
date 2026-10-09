import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GroceryWorkspace } from "@/components/grocery/grocery-workspace";
import { createClient } from "@/lib/supabase/server";
import type { GroceryItem } from "@/types/grocery";
import type { InventoryItem } from "@/types/inventory";

export const metadata: Metadata = {
  title: "Grocery list",
  description: "Coordinate your household shopping list.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GroceryListPage() {
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
    { data: groceryItems, error: groceryError },
    { data: inventoryItems },
  ] = await Promise.all([
    supabase
      .from("grocery_items")
      .select("*")
      .eq("family_id", membership.family_id)
      .order("created_at", { ascending: false }),

    supabase
      .from("inventory_items")
      .select("*")
      .eq("family_id", membership.family_id)
      .order("updated_at", { ascending: false }),
  ]);

  if (groceryError) {
    throw new Error("Unable to load grocery items.");
  }

  const family = Array.isArray(membership.families)
    ? membership.families[0]
    : membership.families;

  return (
    <GroceryWorkspace
      initialGroceryItems={(groceryItems ?? []) as GroceryItem[]}
      inventoryItems={(inventoryItems ?? []) as InventoryItem[]}
      familyId={membership.family_id}
      familyName={family?.name ?? "Family"}
      familyCode={family?.family_code ?? "--------"}
      userId={user.id}
      userRole={membership.role}
    />
  );
}
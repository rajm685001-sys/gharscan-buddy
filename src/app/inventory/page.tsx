import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InventoryWorkspace } from "@/components/inventory/inventory-workspace";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem } from "@/types/inventory";

export const metadata: Metadata = {
  title: "Inventory",
  description: "View and manage items stored in your household.",
  robots: {
    index: false,
    follow: false,
  },
};

type InventoryPageProps = {
  searchParams: Promise<{
    location?: string;
    item?: string;
  }>;
};

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params = await searchParams;

  const selectedLocation = params.location ?? "all";
  const selectedItemId = params.item ?? "";

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

  const { data: inventoryItems, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("family_id", membership.family_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load inventory items.");
  }

  const family = Array.isArray(membership.families)
    ? membership.families[0]
    : membership.families;

  return (
    <InventoryWorkspace
      initialItems={(inventoryItems ?? []) as InventoryItem[]}
      familyId={membership.family_id}
      familyName={family?.name ?? "Family"}
      familyCode={family?.family_code ?? "--------"}
      userId={user.id}
      userRole={membership.role}
      selectedLocation={selectedLocation}
      selectedItemId={selectedItemId}
    />
  );
}
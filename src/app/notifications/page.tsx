import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationsWorkspace } from "@/components/notifications/notifications-workspace";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem } from "@/types/inventory";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Review expiry, low-stock, and household inventory notifications.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NotificationsPage() {
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
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load notification data.");
  }

  const family = Array.isArray(membership.families)
    ? membership.families[0]
    : membership.families;

  return (
    <NotificationsWorkspace
      items={(inventoryItems ?? []) as InventoryItem[]}
      familyName={family?.name ?? "Family"}
      familyCode={family?.family_code ?? "--------"}
    />
  );
}
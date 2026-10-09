import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ScanWorkspace } from "@/components/scanner/scan-workspace";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Scan item",
  description:
    "Scan a product image and review extracted inventory details.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ScanPage() {
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

  const canManageInventory =
    membership.role === "owner" || membership.role === "editor";

  if (!canManageInventory) {
    redirect("/dashboard");
  }

  const family = Array.isArray(membership.families)
    ? membership.families[0]
    : membership.families;

  return (
    <ScanWorkspace
      familyId={membership.family_id}
      familyName={family?.name ?? "Family"}
      familyCode={family?.family_code ?? "--------"}
      userId={user.id}
      userRole={membership.role}
    />
  );
}
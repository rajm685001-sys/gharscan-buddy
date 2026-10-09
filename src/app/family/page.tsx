import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FamilyWorkspace } from "@/components/family/family-workspace";
import { createClient } from "@/lib/supabase/server";
import type { FamilyMember } from "@/types/family";

export const metadata: Metadata = {
  title: "Family members",
  description: "Manage members and roles in your household workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function FamilyPage() {
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

  const { data: members, error } = await supabase
    .from("family_members")
    .select(
      `
        id,
        family_id,
        user_id,
        role,
        joined_at,
        profile:profiles (
          id,
          display_name,
          avatar_url
        )
      `,
    )
    .eq("family_id", membership.family_id)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load family members.");
  }

  const family = Array.isArray(membership.families)
    ? membership.families[0]
    : membership.families;

  return (
    <FamilyWorkspace
      initialMembers={(members ?? []) as unknown as FamilyMember[]}
      familyId={membership.family_id}
      familyName={family?.name ?? "Family"}
      familyCode={family?.family_code ?? "--------"}
      currentUserId={user.id}
      currentUserRole={membership.role}
    />
  );
}
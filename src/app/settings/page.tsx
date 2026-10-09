import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your GharScan Buddy profile and household settings.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, dietary_preference, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
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
      .maybeSingle(),
  ]);

  if (!membership) {
    redirect("/onboarding");
  }

  const family = Array.isArray(membership.families)
    ? membership.families[0]
    : membership.families;

  return (
    <SettingsWorkspace
      userId={user.id}
      email={user.email ?? ""}
      initialFullName={
        profile?.full_name ?? user.user_metadata.full_name ?? ""
      }
      initialPhone={profile?.phone ?? ""}
      initialDietaryPreference={profile?.dietary_preference ?? ""}
      familyName={family?.name ?? "Family"}
      familyCode={family?.family_code ?? "--------"}
      userRole={membership.role}
    />
  );
}
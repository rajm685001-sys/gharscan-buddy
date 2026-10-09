import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { FamilyOnboarding } from "@/components/onboarding/family-onboarding";

export const metadata: Metadata = {
  title: "Set up your family",
  description: "Create or join your private GharScan Buddy household.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect("/dashboard");
  }

  return <FamilyOnboarding fullName={user.user_metadata.full_name ?? ""} />;
}
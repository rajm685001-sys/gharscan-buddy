export type FamilyRole = "owner" | "editor" | "viewer";

export type FamilyMemberProfile = {
  id: string;
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
};

export type FamilyMember = {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
  profile?: FamilyMemberProfile | null;
};
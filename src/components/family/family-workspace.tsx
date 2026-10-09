"use client";

import {
  AlertCircle,
  Check,
  Copy,
  Crown,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMember, FamilyRole } from "@/types/family";

type FamilyWorkspaceProps = {
  initialMembers: FamilyMember[];
  familyId: string;
  familyName: string;
  familyCode: string;
  currentUserId: string;
  currentUserRole: FamilyRole;
};

type ProfileWithDisplayName = {
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
};

function getMemberName(member: FamilyMember) {
  const profile = member.profile as ProfileWithDisplayName | null | undefined;

  return (
    profile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    "Family member"
  );
}

function getInitials(name: string) {
  const words = name
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function getRoleMeta(role: FamilyRole) {
  const roles = {
    owner: {
      label: "Owner",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      icon: Crown,
    },
    editor: {
      label: "Editor",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      icon: UserCog,
    },
    viewer: {
      label: "Viewer",
      className:
        "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
      icon: UsersRound,
    },
  } as const;

  return roles[role];
}

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function FamilyWorkspace({
  initialMembers,
  familyId,
  familyName,
  familyCode,
  currentUserId,
  currentUserRole,
}: FamilyWorkspaceProps) {
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState("");
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  const isOwner = currentUserRole === "owner";

  const roleCounts = useMemo(
    () => ({
      total: members.length,
      owners: members.filter((member) => member.role === "owner").length,
      editors: members.filter((member) => member.role === "editor").length,
      viewers: members.filter((member) => member.role === "viewer").length,
    }),
    [members],
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`family-members-${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "family_members",
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          window.location.reload();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  async function copyFamilyCode() {
    try {
      await navigator.clipboard.writeText(familyCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setActionError(
        "Unable to copy the Family ID automatically. Please copy it manually.",
      );
    }
  }

  async function updateRole(member: FamilyMember, newRole: FamilyRole) {
    if (!isOwner || member.user_id === currentUserId) {
      return;
    }

    if (newRole === "owner") {
      setActionError(
        "Owner transfer is disabled for now to protect the family workspace.",
      );
      return;
    }

    setActionError("");
    setLoadingMemberId(member.id);

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "update_family_member_role",
      {
        target_membership_id: member.id,
        new_role: newRole,
      },
    );

    if (error) {
      setActionError(error.message);
      setLoadingMemberId(null);
      return;
    }

    setMembers((currentMembers) =>
      currentMembers.map((currentMember) =>
        currentMember.id === member.id
          ? {
              ...currentMember,
              role: (data as FamilyMember).role,
            }
          : currentMember,
      ),
    );

    setLoadingMemberId(null);
  }

  async function removeMember(member: FamilyMember) {
    if (!isOwner || member.user_id === currentUserId) {
      return;
    }

    const name = getMemberName(member);

    const shouldRemove = window.confirm(
      `Remove ${name} from ${familyName}? They will lose access to this family workspace.`,
    );

    if (!shouldRemove) {
      return;
    }

    setActionError("");
    setLoadingMemberId(member.id);

    const supabase = createClient();

    const { error } = await supabase.rpc("remove_family_member", {
      target_membership_id: member.id,
    });

    if (error) {
      setActionError(error.message);
      setLoadingMemberId(null);
      return;
    }

    setMembers((currentMembers) =>
      currentMembers.filter((currentMember) => currentMember.id !== member.id),
    );

    setLoadingMemberId(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation
        familyName={familyName}
        familyCode={familyCode}
      />

      <main className="pb-24 lg:ml-72 lg:pb-8">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                Shared household
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                Family members
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage who can access your family&apos;s inventory, grocery
                list, meal planner, and notifications.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-950 dark:bg-emerald-950/30">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Family ID
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="font-mono text-lg font-black tracking-[0.18em] text-foreground">
                  {familyCode}
                </span>
                <button
                  type="button"
                  onClick={copyFamilyCode}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>

          <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total members",
                value: roleCounts.total,
                className:
                  "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/30",
              },
              {
                label: "Owners",
                value: roleCounts.owners,
                className:
                  "border-amber-200 bg-amber-50 dark:border-amber-950 dark:bg-amber-950/30",
              },
              {
                label: "Editors",
                value: roleCounts.editors,
                className:
                  "border-sky-200 bg-sky-50 dark:border-sky-950 dark:bg-sky-950/30",
              },
              {
                label: "Viewers",
                value: roleCounts.viewers,
                className:
                  "border-violet-200 bg-violet-50 dark:border-violet-950 dark:bg-violet-950/30",
              },
            ].map((stat) => (
              <article
                key={stat.label}
                className={`rounded-2xl border p-4 ${stat.className}`}
              >
                <p className="text-2xl font-black text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {stat.label}
                </p>
              </article>
            ))}
          </section>

          {actionError && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{actionError}</p>
            </div>
          )}

          <section className="mt-7 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <article className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <div>
                <p className="flex items-center gap-2 text-lg font-black text-foreground">
                  <UsersRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Your household members
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isOwner
                    ? "You can change Editor and Viewer roles or remove members."
                    : "Only the family owner can change roles or remove members."}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {members.map((member) => {
                  const role = getRoleMeta(member.role);
                  const RoleIcon = role.icon;
                  const name = getMemberName(member);
                  const isCurrentUser = member.user_id === currentUserId;
                  const isLoading = loadingMemberId === member.id;

                  return (
                    <article
                      key={member.id}
                      className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 transition hover:border-emerald-300 hover:shadow-sm dark:hover:border-emerald-800 sm:flex-row sm:items-center"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {getInitials(name)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-black text-foreground">
                            {name}
                          </p>

                          {isCurrentUser && (
                            <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">
                              You
                            </span>
                          )}

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${role.className}`}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {role.label}
                          </span>
                        </div>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          Member since {formatJoinedDate(member.joined_at)}
                        </p>
                      </div>

                      {isOwner && !isCurrentUser && (
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <select
                            value={member.role}
                            disabled={isLoading}
                            onChange={(event) =>
                              updateRole(
                                member,
                                event.target.value as FamilyRole,
                              )
                            }
                            className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-bold text-foreground outline-none transition focus:border-emerald-500 disabled:opacity-50"
                            aria-label={`Change ${name}'s role`}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>

                            {member.role === "owner" && (
                              <option value="owner">Owner</option>
                            )}
                          </select>

                          <button
                            type="button"
                            disabled={isLoading || member.role === "owner"}
                            onClick={() => removeMember(member)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                            aria-label={`Remove ${name}`}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </article>

            <aside className="space-y-6">
              <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>

                <h2 className="mt-5 text-lg font-black text-foreground">
                  How family sharing works
                </h2>

                <ol className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      1
                    </span>
                    Share your eight-character Family ID with someone you trust.
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      2
                    </span>
                    They create an account and choose Join Family during onboarding.
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      3
                    </span>
                    New members start as Viewers. The Owner can promote trusted
                    members to Editor.
                  </li>
                </ol>
              </article>

              <article className="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-600 p-5 text-white shadow-xl shadow-emerald-950/15">
                <Crown className="h-6 w-6 text-amber-200" />

                <h2 className="mt-5 text-lg font-black">
                  Role permissions
                </h2>

                <div className="mt-4 space-y-3 text-sm text-emerald-50">
                  <p>
                    <span className="font-black text-white">Owner:</span> full
                    control, delete records, manage members.
                  </p>

                  <p>
                    <span className="font-black text-white">Editor:</span> add,
                    scan, update, and complete household tasks.
                  </p>

                  <p>
                    <span className="font-black text-white">Viewer:</span> view
                    family information without editing.
                  </p>
                </div>
              </article>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
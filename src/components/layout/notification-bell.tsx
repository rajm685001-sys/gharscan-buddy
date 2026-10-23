"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  family_id: string;
  title: string;
  message: string;
  type: "expiry_warning" | "expired";
  is_read: boolean;
  created_at: string;
};

export function NotificationBell({ familyId }: { familyId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("family_id", familyId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20);

      setNotifications((data ?? []) as Notification[]);
    }

    loadNotifications();

    const channel = supabase
      .channel(`notifications-${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          setNotifications((current) => [
            newNotification,
            ...current.filter(
              (notification) => notification.id !== newNotification.id,
            ),
          ]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;

          setNotifications((current) =>
            updatedNotification.is_read
              ? current.filter(
                  (notification) =>
                    notification.id !== updatedNotification.id,
                )
              : current.map((notification) =>
                  notification.id === updatedNotification.id
                    ? updatedNotification
                    : notification,
                ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  async function markAsRead(notificationId: string) {
    const supabase = createClient();

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  }

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-black text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-80 border border-border bg-card p-4 shadow-xl">
          <p className="text-sm font-black text-foreground">
            Expiry alerts
          </p>

          {notifications.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No new expiry alerts.
            </p>
          ) : (
            <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-xl border border-border p-3"
                >
                  <p className="text-sm font-bold text-foreground">
                    {notification.title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {notification.message}
                  </p>

                  <button
                    type="button"
                    onClick={() => markAsRead(notification.id)}
                    className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Mark as read
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
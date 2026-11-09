"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type NotificationItem = {
  id: string;
  order_id: string | null;
  title: string;
  body: string | null;
  is_read: boolean;
  when: string;
};

export default function NotificationList({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const unread = notifications.filter((n) => !n.is_read).length;

  async function open(n: NotificationItem) {
    if (!n.is_read) {
      const supabase = createClient();
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    }
    if (n.order_id) {
      router.push(`/orders/${n.order_id}`);
    } else {
      router.refresh();
    }
  }

  async function markAllRead() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{unread} unread</p>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            disabled={busy}
            className="text-sm text-accent hover:underline disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {notifications.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => open(n)}
              className={`w-full rounded-lg border p-4 text-left transition hover:border-accent ${
                n.is_read
                  ? "border-line bg-surface"
                  : "border-accent/60 bg-surface-2"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{n.title}</p>
                {!n.is_read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                )}
              </div>
              {n.body && <p className="mt-1 text-sm text-muted">{n.body}</p>}
              <p className="mt-2 text-xs text-muted">{n.when}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
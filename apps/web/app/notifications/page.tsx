import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import NotificationList from "@/components/NotificationList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("notifications")
    .select("id, order_id, title, body, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <p className="p-8 text-red-400">Could not load notifications: {error.message}</p>
    );
  }

  const notifications = (data ?? []).map((n) => ({
    id: n.id as string,
    order_id: n.order_id as string | null,
    title: n.title as string,
    body: n.body as string | null,
    is_read: n.is_read as boolean,
    when: formatDateTime(n.created_at as string),
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-8 font-display text-4xl uppercase">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-10 text-center">
          <p className="mb-4 text-muted">
            Nothing here yet. Order updates and offers will show up in this inbox.
          </p>
          <Link
            href="/#shop"
            className="inline-block rounded bg-accent px-6 py-3 font-medium text-accent-contrast"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </main>
  );
}
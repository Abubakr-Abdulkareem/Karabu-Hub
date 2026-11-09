import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatNaira } from "@/lib/format";
import OrderStatusBadge from "@/components/OrderStatusBadge";

type OrderRow = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total, created_at, order_items(product_name, quantity)")
    .eq("user_id", user.id)
    .neq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="p-8 text-red-400">Could not load your orders: {error.message}</p>;
  }

  const orders = (data ?? []) as unknown as OrderRow[];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-8 font-display text-4xl uppercase">My orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-10 text-center">
          <p className="mb-4 text-muted">You have not placed any orders yet.</p>
          <Link
            href="/#shop"
            className="inline-block rounded bg-accent px-6 py-3 font-medium text-accent-contrast"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => {
            const first = order.order_items[0];
            const extra = order.order_items.length - 1;

            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 hover:border-accent sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDateTime(order.created_at)}
                    </p>
                    {first && (
                      <p className="mt-1 text-sm">
                        {first.product_name} × {first.quantity}
                        {extra > 0 && (
                          <span className="text-muted"> and {extra} more</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <OrderStatusBadge status={order.status} />
                    <p className="font-medium">{formatNaira(Number(order.total))}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
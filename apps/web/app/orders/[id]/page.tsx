import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatNaira } from "@/lib/format";
import OrderStatusBadge, { statusLabels } from "@/components/OrderStatusBadge";

type OrderDetail = {
  id: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  created_at: string;
  recipient_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  order_items: {
    id: string;
    product_name: string;
    size: string | null;
    color: string | null;
    unit_price: number;
    quantity: number;
  }[];
};

const steps = ["paid", "processing", "out_for_delivery", "delivered"];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("orders")
    .select(
      "id, status, subtotal, delivery_fee, discount, total, created_at, recipient_name, phone, street, city, state, order_items(id, product_name, size, color, unit_price, quantity)"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const order = data as unknown as OrderDetail | null;
  if (!order || order.status === "pending") notFound();

  const currentIndex = steps.indexOf(order.status);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/orders" className="mb-4 inline-block text-sm text-muted hover:text-foreground">
        ← Back to my orders
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-muted">{formatDateTime(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status === "cancelled" ? (
        <p className="mb-8 rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          This order was cancelled.
        </p>
      ) : (
        <div className="mb-8 rounded-lg border border-line bg-surface p-6">
          <div className="mb-4 h-1 rounded bg-line">
            <div
              className="h-1 rounded bg-accent"
              style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <ol className="grid grid-cols-4 gap-2">
            {steps.map((step, i) => (
              <li key={step} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={`h-3 w-3 rounded-full ${
                    i <= currentIndex ? "bg-accent" : "bg-line"
                  }`}
                />
                <span
                  className={`text-xs sm:text-sm ${
                    i <= currentIndex ? "text-foreground" : "text-muted"
                  }`}
                >
                  {statusLabels[step]}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-line bg-surface p-6">
          <h2 className="mb-4 font-display text-2xl uppercase">Items</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {item.product_name}{" "}
                    <span className="text-muted">× {item.quantity}</span>
                  </p>
                  <p className="text-muted">
                    {[item.color, item.size].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p>{formatNaira(Number(item.unit_price) * item.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatNaira(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Delivery</span>
              <span>{formatNaira(Number(order.delivery_fee))}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Discount</span>
                <span>-{formatNaira(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3 font-medium">
              <span>Total</span>
              <span>{formatNaira(Number(order.total))}</span>
            </div>
          </div>
        </section>

        <section className="h-fit rounded-lg border border-line bg-surface p-6 text-sm">
          <h2 className="mb-4 font-display text-2xl uppercase">Delivery</h2>
          <p className="font-medium">{order.recipient_name}</p>
          <p className="text-muted">{order.phone}</p>
          <p className="mt-2 text-muted">
            {order.street}, {order.city}, {order.state}
          </p>
        </section>
      </div>
    </main>
  );
}
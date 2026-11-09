import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatNaira } from "@/lib/format";
import OrderStatusSelect from "@/components/OrderStatusSelect";

type AdminOrder = {
  id: string;
  status: string;
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
    quantity: number;
  }[];
};

const filters = [
  { value: "", label: "All" },
  { value: "paid", label: "New (paid)" },
  { value: "processing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(
      "id, status, total, created_at, recipient_name, phone, street, city, state, order_items(id, product_name, size, color, quantity)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const validStatus = filters.some((f) => f.value && f.value === status);
  query = validStatus ? query.eq("status", status!) : query.neq("status", "pending");

  const { data, error } = await query;

  if (error) {
    return <p className="text-red-400">Could not load orders: {error.message}</p>;
  }

  const orders = (data ?? []) as unknown as AdminOrder[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = (status ?? "") === f.value || (!validStatus && f.value === "");
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/orders?status=${f.value}` : "/admin/orders"}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                active
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-line text-muted hover:border-accent hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <p className="py-10 text-center text-muted">No orders here yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="grid gap-4 rounded-lg border border-line bg-surface p-4 md:grid-cols-[1fr_1fr_200px]"
            >
              <div>
                <p className="font-medium">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm text-muted">{formatDateTime(order.created_at)}</p>
                <ul className="mt-3 flex flex-col gap-1 text-sm">
                  {order.order_items.map((item) => (
                    <li key={item.id}>
                      {item.product_name} × {item.quantity}
                      <span className="text-muted">
                        {" "}
                        {[item.color, item.size].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-medium">{formatNaira(Number(order.total))}</p>
              </div>

              <div className="text-sm">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted">
                  Deliver to
                </p>
                <p className="font-medium">{order.recipient_name}</p>
                <a href={`tel:${order.phone}`} className="text-accent hover:underline">
                  {order.phone}
                </a>
                <p className="mt-1 text-muted">
                  {order.street}, {order.city}, {order.state}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted">Status</p>
                <OrderStatusSelect orderId={order.id} status={order.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
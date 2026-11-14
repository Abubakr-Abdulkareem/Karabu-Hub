import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatNaira } from "@/lib/format";
import AdminOrderList, { type AdminOrderView } from "@/components/AdminOrderList";

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

  const orders: AdminOrderView[] = ((data ?? []) as unknown as AdminOrder[]).map((o) => ({
    id: o.id,
    status: o.status,
    totalLabel: formatNaira(Number(o.total)),
    dateLabel: formatDateTime(o.created_at),
    recipient_name: o.recipient_name,
    phone: o.phone,
    address: `${o.street}, ${o.city}, ${o.state}`,
    items: o.order_items,
  }));

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
        <AdminOrderList orders={orders} />
      )}
    </div>
  );
}
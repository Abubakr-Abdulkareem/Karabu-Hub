import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutForm from "@/components/CheckoutForm";

type CartRow = {
  id: string;
  quantity: number;
  product_variants: {
    size: string | null;
    color: string | null;
    price: number;
    stock: number;
    products: { name: string };
  };
};

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [cartRes, feesRes, addressRes, profileRes] = await Promise.all([
    supabase
      .from("cart_items")
      .select("id, quantity, product_variants(size, color, price, stock, products(name))")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase.from("delivery_fees").select("state, fee").order("state"),
    supabase
      .from("addresses")
      .select("recipient_name, phone, street, city, state")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
  ]);

  const rows = ((cartRes.data ?? []) as unknown as CartRow[]).filter(
    (row) => row.product_variants?.products
  );

  if (rows.length === 0) redirect("/cart");
  if (rows.some((row) => row.quantity > row.product_variants.stock)) {
    redirect("/cart");
  }

  const items = rows.map((row) => ({
    id: row.id,
    name: row.product_variants.products.name,
    label: [row.product_variants.color, row.product_variants.size]
      .filter(Boolean)
      .join(" · "),
    quantity: row.quantity,
    lineTotal: row.product_variants.price * row.quantity,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const fees = (feesRes.data ?? []).map((f) => ({
    state: f.state as string,
    fee: Number(f.fee),
  }));

  const saved = addressRes.data;
  const initial = {
    recipient_name: saved?.recipient_name ?? profileRes.data?.full_name ?? "",
    phone: saved?.phone ?? profileRes.data?.phone ?? "",
    street: saved?.street ?? "",
    city: saved?.city ?? "",
    state: saved?.state ?? "",
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 font-display text-4xl uppercase">Checkout</h1>
      <CheckoutForm items={items} subtotal={subtotal} fees={fees} initial={initial} />
    </main>
  );
}
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CartRow = {
  quantity: number;
  product_variants: {
    id: string;
    size: string | null;
    color: string | null;
    price: number;
    stock: number;
    products: { name: string };
  };
};

const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return fail("Please log in first.", 401);

  const body = await request.json();
  const recipient_name = String(body.recipient_name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const street = String(body.street ?? "").trim();
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim();
  const saveAddress = Boolean(body.save_address);

  const phoneDigits = phone.replace(/\D/g, "");
  if (!recipient_name || !street || !city || !state) {
    return fail("Please fill in all the delivery details.");
  }
  if (phoneDigits.length < 10 || phoneDigits.length > 14) {
    return fail("Please enter a valid phone number.");
  }

  // Read the cart as the logged-in customer
  const { data: cartData, error: cartError } = await supabase
    .from("cart_items")
    .select(
      "quantity, product_variants(id, size, color, price, stock, products(name))"
    )
    .eq("user_id", user.id);

  if (cartError) return fail(cartError.message, 500);

  const items = ((cartData ?? []) as unknown as CartRow[]).filter(
    (item) => item.product_variants?.products
  );
  if (items.length === 0) return fail("Your cart is empty.");

  for (const item of items) {
    const v = item.product_variants;
    if (item.quantity > v.stock) {
      return fail(`${v.products.name} only has ${v.stock} left in stock.`);
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.product_variants.price * item.quantity,
    0
  );

  // Orders can only be created by the server, with the secret key
  const admin = createAdminClient();

  const { data: feeRow } = await admin
    .from("delivery_fees")
    .select("fee")
    .eq("state", state)
    .maybeSingle();
  if (!feeRow) return fail("We don't deliver to that state yet.");

  const deliveryFee = Number(feeRow.fee);
  const total = subtotal + deliveryFee;
  const reference = `KH-${randomUUID()}`;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      subtotal,
      delivery_fee: deliveryFee,
      discount: 0,
      total,
      paystack_reference: reference,
      recipient_name,
      phone,
      street,
      city,
      state,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return fail("Could not create your order. Please try again.", 500);
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      variant_id: item.product_variants.id,
      product_name: item.product_variants.products.name,
      size: item.product_variants.size,
      color: item.product_variants.color,
      unit_price: item.product_variants.price,
      quantity: item.quantity,
    }))
  );

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return fail("Could not create your order. Please try again.", 500);
  }

  // Remember the address for next time (skip if it's already saved)
  if (saveAddress) {
    const { data: existing } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .eq("street", street)
      .eq("city", city)
      .eq("state", state)
      .maybeSingle();

    if (!existing) {
      await supabase
        .from("addresses")
        .insert({ user_id: user.id, recipient_name, phone, street, city, state });
    }
  }

  // Start the Paystack payment (amount is in kobo)
  const paystackRes = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(total * 100),
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/callback`,
        metadata: { order_id: order.id },
      }),
    }
  );
  const paystackData = await paystackRes.json();

  if (!paystackRes.ok || !paystackData.status) {
    await admin.from("orders").delete().eq("id", order.id);
    return fail("Could not start the payment. Please try again.", 502);
  }

  return NextResponse.json({ url: paystackData.data.authorization_url });
}
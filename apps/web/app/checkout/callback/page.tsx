import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNaira } from "@/lib/format";

export default async function CheckoutCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!reference) redirect("/cart");

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, total, status")
    .eq("paystack_reference", reference)
    .maybeSingle();

  // Only the customer who placed the order may see this
  if (!order || order.user_id !== user.id) redirect("/cart");

  // Ask Paystack directly whether the payment really went through
  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
    }
  );
  const verify = await verifyRes.json();

  const paid =
    verifyRes.ok &&
    verify.status === true &&
    verify.data?.status === "success" &&
    verify.data?.currency === "NGN" &&
    verify.data?.amount === Math.round(Number(order.total) * 100);

  if (paid) {
    // Marks the order paid, reduces stock, clears the cart (only runs once)
    await admin.rpc("fulfill_order", { p_order_id: order.id });
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      {paid ? (
        <>
          <h1 className="font-display text-4xl uppercase">Payment successful</h1>
          <p className="mt-4 text-muted">
            Thank you! We received {formatNaira(Number(order.total))} and your order
            is being prepared. We'll notify you when it's on its way.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/#shop"
              className="rounded bg-accent px-6 py-3 font-medium text-accent-contrast"
            >
              Continue shopping
            </Link>
            <Link
              href="/orders"
              className="rounded border border-accent px-6 py-3 font-medium text-accent"
            >
              View my orders
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-display text-4xl uppercase">Payment not completed</h1>
          <p className="mt-4 text-muted">
            We couldn't confirm your payment, so you haven't been charged for this
            order. Your cart is still saved.
          </p>
          <Link
            href="/cart"
            className="mt-8 inline-block rounded bg-accent px-6 py-3 font-medium text-accent-contrast"
          >
            Back to cart
          </Link>
        </>
      )}
    </main>
  );
}
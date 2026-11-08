import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";
import CartItemControls from "@/components/CartItemControls";

type CartRow = {
  id: string;
  quantity: number;
  product_variants: {
    id: string;
    size: string | null;
    color: string | null;
    price: number;
    stock: number;
    products: {
      name: string;
      slug: string;
      product_images: { url: string; position: number }[];
    };
  };
};

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      "id, quantity, product_variants(id, size, color, price, stock, products(name, slug, product_images(url, position)))"
    )
    .eq("user_id", user.id)
    .order("created_at");

  if (error) {
    return <p className="p-8 text-red-400">Could not load your cart: {error.message}</p>;
  }

  const items = ((data ?? []) as unknown as CartRow[]).filter(
    (item) => item.product_variants?.products
  );

  const subtotal = items.reduce(
    (sum, item) => sum + item.product_variants.price * item.quantity,
    0
  );
  const hasStockIssue = items.some(
    (item) => item.quantity > item.product_variants.stock
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 font-display text-4xl uppercase">Your cart</h1>

      {items.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-10 text-center">
          <p className="mb-4 text-muted">Your cart is empty.</p>
          <Link
            href="/#shop"
            className="inline-block rounded bg-accent px-6 py-3 font-medium text-accent-contrast"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="flex flex-col gap-4">
            {items.map((item) => {
              const variant = item.product_variants;
              const product = variant.products;
              const image = [...product.product_images].sort(
                (a, b) => a.position - b.position
              )[0];

              return (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-line bg-surface p-4"
                >
                  <Link href={`/products/${product.slug}`} className="shrink-0">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={product.name}
                        width={96}
                        height={128}
                        className="h-32 w-24 rounded object-cover"
                      />
                    ) : (
                      <div className="h-32 w-24 rounded bg-surface-2" />
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-medium uppercase tracking-wide"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-muted">
                        {[variant.color, variant.size].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-1 text-sm">{formatNaira(variant.price)}</p>
                      {item.quantity > variant.stock && (
                        <p className="mt-1 text-sm text-red-400">
                          Only {variant.stock} left in stock. Please reduce the quantity.
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <CartItemControls
                        itemId={item.id}
                        quantity={item.quantity}
                        stock={variant.stock}
                      />
                      <p className="font-medium">
                        {formatNaira(variant.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-lg border border-line bg-surface p-6">
            <h2 className="mb-4 font-display text-2xl uppercase">Order summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Delivery fee is added at checkout.
            </p>
            <div className="mt-4 flex justify-between border-t border-line pt-4 font-medium">
              <span>Total</span>
              <span>{formatNaira(subtotal)}</span>
            </div>

            {hasStockIssue ? (
              <p className="mt-4 text-sm text-red-400">
                Fix the stock issue above to continue.
              </p>
            ) : (
              <Link
                href="/checkout"
                className="mt-6 block rounded bg-accent p-3 text-center font-medium text-accent-contrast hover:bg-accent-strong"
              >
                Proceed to checkout
              </Link>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
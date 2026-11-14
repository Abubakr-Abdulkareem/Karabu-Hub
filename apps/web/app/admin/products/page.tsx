import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  gender: string;
  is_active: boolean;
  categories: { name: string } | null;
  product_variants: { price: number; stock: number }[];
  product_images: { url: string; position: number }[];
};

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, gender, is_active, categories(name), product_variants(price, stock), product_images(url, position)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-red-400">Could not load products: {error.message}</p>;
  }

  const products = (data ?? []) as unknown as Row[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{products.length} products</p>
        <Link
          href="/admin/products/new"
          className="rounded bg-accent px-5 py-2 text-sm font-medium text-accent-contrast hover:bg-accent-strong"
        >
          + Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="py-10 text-center text-muted">No products yet. Add your first one.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((p) => {
            const image = [...p.product_images].sort((a, b) => a.position - b.position)[0];
            const prices = p.product_variants.map((v) => v.price);
            const min = prices.length ? Math.min(...prices) : null;
            const max = prices.length ? Math.max(...prices) : null;
            const stock = p.product_variants.reduce((sum, v) => sum + v.stock, 0);

            return (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="flex items-center gap-4 rounded-lg border border-line bg-surface p-3 hover:border-accent"
                >
                  {image ? (
                    <Image
                      src={image.url}
                      alt={p.name}
                      width={64}
                      height={80}
                      className="h-20 w-16 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-20 w-16 shrink-0 rounded bg-surface-2" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs capitalize text-muted">
                      {p.categories?.name ?? "No category"} · {p.gender}
                    </p>
                    {min !== null && max !== null && (
                      <p className="mt-1 text-sm">
                        {min === max ? formatNaira(min) : `${formatNaira(min)} – ${formatNaira(max)}`}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                    {!p.is_active && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">Hidden</span>
                    )}
                    {stock === 0 ? (
                      <span className="text-red-300">Out of stock</span>
                    ) : stock <= 5 ? (
                      <span className="text-amber-300">Low: {stock}</span>
                    ) : (
                      <span className="text-muted">{stock} in stock</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
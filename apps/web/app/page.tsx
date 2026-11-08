import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

type Product = {
  id: string;
  name: string;
  slug: string;
  product_variants: { price: number; compare_at_price: number | null }[];
  product_images: { url: string; position: number }[];
};

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, product_variants(price, compare_at_price), product_images(url, position)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="p-8 text-red-600">Could not load products: {error.message}</p>;
  }

  const products = (data ?? []) as unknown as Product[];

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Karabu Hub</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => {
          const image = [...product.product_images].sort(
            (a, b) => a.position - b.position
          )[0];
          const prices = product.product_variants.map((v) => v.price);
          const lowest = prices.length ? Math.min(...prices) : null;

          return (
            <div key={product.id} className="rounded-lg border p-3">
              {image && (
                <Image
                  src={image.url}
                  alt={product.name}
                  width={600}
                  height={800}
                  className="mb-3 aspect-3/4 w-full rounded object-cover"
                />
              )}
              <h2 className="font-medium">{product.name}</h2>
              {lowest !== null && (
                <p className="text-sm text-gray-600">From {formatNaira(lowest)}</p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
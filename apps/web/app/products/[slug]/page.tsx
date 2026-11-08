import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VariantPicker, { type Variant } from "@/components/VariantPicker";

type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  categories: { name: string } | null;
  product_variants: Variant[];
  product_images: { url: string; position: number }[];
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, description, brand, categories(name), product_variants(id, size, color, price, compare_at_price, stock), product_images(url, position)"
    )
    .eq("slug", slug)
    .order("created_at", { referencedTable: "product_variants" })
    .maybeSingle();

  if (!data) notFound();

  const product = data as unknown as ProductDetail;
  const images = [...product.product_images].sort(
    (a, b) => a.position - b.position
  );

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/" className="mb-4 inline-block text-sm underline">
        Back to shop
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          {images[0] && (
            <Image
              src={images[0].url}
              alt={product.name}
              width={600}
              height={800}
              className="aspect-3/4 w-full rounded object-cover"
            />
          )}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((img) => (
                <Image
                  key={img.url}
                  src={img.url}
                  alt={product.name}
                  width={200}
                  height={260}
                  className="aspect-3/4 w-full rounded object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {product.categories && (
            <p className="text-sm text-gray-500">{product.categories.name}</p>
          )}
          <h1 className="text-3xl font-bold">{product.name}</h1>
          {product.brand && (
            <p className="text-sm text-gray-600">By {product.brand}</p>
          )}
          {product.description && <p>{product.description}</p>}
          <VariantPicker variants={product.product_variants} />
        </div>
      </div>
    </main>
  );
}
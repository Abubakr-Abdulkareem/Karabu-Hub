import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VariantPicker, { type Variant } from "@/components/VariantPicker";
import BackButton from "@/components/BackButton";
import ProductGallery from "@/components/ProductGallery";

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

    const {
    data: { user },
  } = await supabase.auth.getUser();

  const cartQuantities: Record<string, number> = {};
  if (user) {
    const { data: cartRows } = await supabase
      .from("cart_items")
      .select("variant_id, quantity")
      .eq("user_id", user.id)
      .in(
        "variant_id",
        product.product_variants.map((v) => v.id)
      );
    (cartRows ?? []).forEach((row) => {
      cartQuantities[row.variant_id] = row.quantity;
    });
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <BackButton fallbackHref="/#shop" />

      <div className="grid gap-8 md:grid-cols-2">
        <div className="md:sticky md:top-24 md:self-start">
          {images.length > 0 ? (
            <ProductGallery images={images.map((img) => img.url)} alt={product.name} />
          ) : (
            <div className="aspect-3/4 w-full rounded bg-surface-2" />
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
          <VariantPicker
            variants={product.product_variants}
            cartQuantities={cartQuantities}
          />
        </div>
      </div>
    </main>
  );
}
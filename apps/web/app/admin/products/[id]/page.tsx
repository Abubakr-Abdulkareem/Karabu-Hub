import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/components/BackButton";
import ProductForm, { type CategoryOption } from "@/components/ProductForm";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  gender: string;
  category_id: string | null;
  is_active: boolean;
  product_variants: {
    id: string;
    size: string | null;
    color: string | null;
    price: number;
    compare_at_price: number | null;
    stock: number;
    sku: string | null;
    created_at: string;
  }[];
  product_images: { id: string; url: string; position: number }[];
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [productRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, description, brand, gender, category_id, is_active, product_variants(id, size, color, price, compare_at_price, stock, sku, created_at), product_images(id, url, position)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name, parent_id").order("created_at"),
  ]);

  const product = productRes.data as unknown as ProductRow | null;
  if (!product) notFound();

  return (
    <div>
      <BackButton fallbackHref="/admin/products" />
      <h2 className="mb-6 font-display text-3xl uppercase">Edit product</h2>
      <ProductForm
        key={product.id}
        categories={(categoriesRes.data ?? []) as CategoryOption[]}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          brand: product.brand ?? "",
          gender: product.gender,
          category_id: product.category_id ?? "",
          is_active: product.is_active,
          variants: [...product.product_variants]
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map((v) => ({
              id: v.id,
              size: v.size ?? "",
              color: v.color ?? "",
              price: String(v.price),
              compare_at_price: v.compare_at_price === null ? "" : String(v.compare_at_price),
              stock: String(v.stock),
              sku: v.sku ?? "",
            })),
          images: [...product.product_images]
            .sort((a, b) => a.position - b.position)
            .map((i) => ({ id: i.id, url: i.url })),
        }}
      />
    </div>
  );
}
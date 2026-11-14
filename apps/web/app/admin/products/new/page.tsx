import { createClient } from "@/lib/supabase/server";
import BackButton from "@/components/BackButton";
import ProductForm, { type CategoryOption } from "@/components/ProductForm";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .order("created_at");

  return (
    <div>
      <BackButton fallbackHref="/admin/products" />
      <h2 className="mb-6 font-display text-3xl uppercase">Add product</h2>
      <ProductForm
        categories={(data ?? []) as CategoryOption[]}
        initial={{
          name: "",
          slug: "",
          description: "",
          brand: "",
          gender: "unisex",
          category_id: "",
          is_active: true,
          variants: [
            { size: "", color: "", price: "", compare_at_price: "", stock: "0", sku: "" },
          ],
          images: [],
        }}
      />
    </div>
  );
}
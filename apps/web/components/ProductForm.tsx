"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type CategoryOption = {
  id: string;
  name: string;
  parent_id: string | null;
};

type VariantField = {
  key: string;
  id?: string;
  size: string;
  color: string;
  price: string;
  compare_at_price: string;
  stock: string;
  sku: string;
};

type ImageItem = {
  key: string;
  id?: string;
  url: string;
  file?: File;
};

export type ProductFormInitial = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  gender: string;
  category_id: string;
  is_active: boolean;
  variants: {
    id?: string;
    size: string;
    color: string;
    price: string;
    compare_at_price: string;
    stock: string;
    sku: string;
  }[];
  images: { id: string; url: string }[];
};

type VariantRow = {
  size: string | null;
  color: string | null;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
};

const BUCKET = "product-images";
const MAX_FILE_MB = 5;

let keyCounter = 0;
const nextKey = () => `k${++keyCounter}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const pathsFrom = (urls: string[]) =>
  urls
    .map((u) => u.split(`/${BUCKET}/`)[1])
    .filter((p): p is string => Boolean(p));

const friendly = (error: { code?: string; message: string } | null) =>
  error?.code === "23505"
    ? "That name or SKU is already used by another product. Please change it."
    : error?.message ?? "Something went wrong.";

export default function ProductForm({
  categories,
  initial,
}: {
  categories: CategoryOption[];
  initial: ProductFormInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial.id);

  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(initial.description);
  const [brand, setBrand] = useState(initial.brand);
  const [gender, setGender] = useState(initial.gender);
  const [categoryId, setCategoryId] = useState(initial.category_id);
  const [isActive, setIsActive] = useState(initial.is_active);

  const [variants, setVariants] = useState<VariantField[]>(
    initial.variants.map((v) => ({ ...v, key: nextKey() }))
  );
  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([]);

  const [images, setImages] = useState<ImageItem[]>(
    initial.images.map((img) => ({ key: nextKey(), id: img.id, url: img.url }))
  );
  const [removedImages, setRemovedImages] = useState<{ id: string; url: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = categories
    .filter((c) => !c.parent_id)
    .flatMap((top) => [
      { id: top.id, label: top.name },
      ...categories
        .filter((c) => c.parent_id === top.id)
        .map((c) => ({ id: c.id, label: `— ${c.name}` })),
    ]);

  function updateVariant(
    key: string,
    field: "size" | "color" | "price" | "compare_at_price" | "stock" | "sku",
    value: string
  ) {
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, [field]: value } : v)));
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { key: nextKey(), size: "", color: "", price: "", compare_at_price: "", stock: "0", sku: "" },
    ]);
  }

  function removeVariant(v: VariantField) {
    if (v.id) setRemovedVariantIds((prev) => [...prev, v.id as string]);
    setVariants((prev) => prev.filter((x) => x.key !== v.key));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const accepted: ImageItem[] = [];

    for (const file of Array.from(e.target.files ?? [])) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`${file.name} is bigger than ${MAX_FILE_MB} MB.`);
        continue;
      }
      accepted.push({ key: nextKey(), url: URL.createObjectURL(file), file });
    }

    setImages((prev) => [...prev, ...accepted]);
    e.target.value = "";
  }

  function removeImage(img: ImageItem) {
    if (img.id) setRemovedImages((prev) => [...prev, { id: img.id as string, url: img.url }]);
    setImages((prev) => prev.filter((x) => x.key !== img.key));
  }

  function makeMain(img: ImageItem) {
    setImages((prev) => [img, ...prev.filter((x) => x.key !== img.key)]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanSlug = slugify(slug || name);
    if (!cleanName || !cleanSlug) return setError("Please enter a product name.");
    if (variants.length === 0) {
      return setError("Add at least one option (size or colour) with a price.");
    }
    if (images.length === 0) return setError("Add at least one photo.");

    const parsed: { id?: string; row: VariantRow }[] = [];
    for (const v of variants) {
      const price = Number(v.price);
      const stock = Number(v.stock.trim() === "" ? "0" : v.stock);
      const compare = v.compare_at_price.trim() === "" ? null : Number(v.compare_at_price);

      if (v.price.trim() === "" || !Number.isFinite(price) || price < 0) {
        return setError("Every option needs a valid price.");
      }
      if (!Number.isInteger(stock) || stock < 0) {
        return setError("Stock must be a whole number, 0 or more.");
      }
      if (compare !== null && (!Number.isFinite(compare) || compare < 0)) {
        return setError("Old price must be a valid number.");
      }

      parsed.push({
        id: v.id,
        row: {
          size: v.size.trim() || null,
          color: v.color.trim() || null,
          sku: v.sku.trim() || null,
          price,
          compare_at_price: compare,
          stock,
        },
      });
    }

    setSaving(true);
    const supabase = createClient();
    const uploadedPaths: string[] = [];
    let productId = initial.id;
    const isNew = !productId;

    async function bail(message: string) {
      if (isNew && productId) {
        if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths);
        await supabase.from("products").delete().eq("id", productId);
      }
      setError(message);
      setSaving(false);
    }

    const productData = {
      name: cleanName,
      slug: cleanSlug,
      description: description.trim() || null,
      brand: brand.trim() || null,
      gender,
      category_id: categoryId || null,
      is_active: isActive,
    };

    if (productId) {
      const { error } = await supabase.from("products").update(productData).eq("id", productId);
      if (error) return bail(friendly(error));
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select("id")
        .single();
      if (error || !data) return bail(friendly(error));
      productId = data.id as string;
    }

    // Options (sizes / colours)
    if (removedVariantIds.length > 0) {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .in("id", removedVariantIds);
      if (error) return bail(friendly(error));
    }

    for (const p of parsed.filter((x) => x.id)) {
      const { error } = await supabase
        .from("product_variants")
        .update(p.row)
        .eq("id", p.id as string);
      if (error) return bail(friendly(error));
    }

    const newRows = parsed
      .filter((x) => !x.id)
      .map((x) => ({ ...x.row, product_id: productId }));
    if (newRows.length > 0) {
      const { error } = await supabase.from("product_variants").insert(newRows);
      if (error) return bail(friendly(error));
    }

    // Photos
    if (removedImages.length > 0) {
      await supabase
        .from("product_images")
        .delete()
        .in("id", removedImages.map((i) => i.id));
      const paths = pathsFrom(removedImages.map((i) => i.url));
      if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
    }

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      if (img.file) {
        const ext = (img.file.name.split(".").pop() ?? "jpg").toLowerCase();
        const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, img.file, { contentType: img.file.type });
        if (uploadError) return bail(`Photo upload failed: ${uploadError.message}`);
        uploadedPaths.push(path);

        const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error } = await supabase
          .from("product_images")
          .insert({ product_id: productId, url: publicData.publicUrl, position: i });
        if (error) return bail(friendly(error));
      } else if (img.id) {
        await supabase.from("product_images").update({ position: i }).eq("id", img.id);
      }
    }

    router.push("/admin/products");
    router.refresh();
  }

  async function handleDelete() {
    if (!initial.id) return;
    if (!window.confirm("Delete this product for good? Past orders keep their details.")) return;

    setSaving(true);
    const supabase = createClient();
    const paths = pathsFrom(images.filter((i) => i.id).map((i) => i.url));

    const { error } = await supabase.from("products").delete().eq("id", initial.id);
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);

    router.push("/admin/products");
    router.refresh();
  }

  const field = "rounded p-2 text-sm";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="font-display text-2xl uppercase sm:col-span-2">Basic info</h2>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Product name
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            required
            className={field}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Web address
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className={field}
          />
          <span className="text-xs text-muted">
            /products/{slugify(slug || name) || "..."}
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={field}>
            <option value="">No category</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          For
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={field}>
            <option value="unisex">Everyone (unisex)</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Brand (optional)
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className={field} />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={field}
          />
        </label>

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Visible in the shop (untick to hide it)
        </label>
      </section>

      <section>
        <h2 className="font-display text-2xl uppercase">Photos</h2>
        <p className="mb-4 text-sm text-muted">
          The first photo is the main one. Portrait photos work best, up to {MAX_FILE_MB} MB each.
        </p>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img, index) => (
            <div key={img.key} className="relative overflow-hidden rounded border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="aspect-3/4 w-full object-cover" />
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-contrast">
                  MAIN
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeMain(img)}
                  className="absolute bottom-1 left-1 rounded bg-background/80 px-2 py-0.5 text-[10px]"
                >
                  Make main
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(img)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 rounded bg-background/80 p-1 text-red-300"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <label className="flex aspect-3/4 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-line text-sm text-muted hover:border-accent hover:text-foreground">
            <Plus size={20} />
            Add photos
            <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
          </label>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl uppercase">Sizes, colours and prices</h2>
        <p className="mb-4 text-sm text-muted">
          One row for each version you sell, for example Navy / M. Fill in an old price to show a
          SALE badge and a crossed-out price.
        </p>

        <div className="flex flex-col gap-3">
          {variants.map((v) => (
            <div
              key={v.key}
              className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]"
            >
              <label className="flex flex-col gap-1 text-xs text-muted">
                Size
                <input
                  value={v.size}
                  onChange={(e) => updateVariant(v.key, "size", e.target.value)}
                  placeholder="M, 42, 50ml"
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                Colour
                <input
                  value={v.color}
                  onChange={(e) => updateVariant(v.key, "color", e.target.value)}
                  placeholder="Navy"
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                Price (₦)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={v.price}
                  onChange={(e) => updateVariant(v.key, "price", e.target.value)}
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                Old price (₦)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={v.compare_at_price}
                  onChange={(e) => updateVariant(v.key, "compare_at_price", e.target.value)}
                  placeholder="optional"
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                Stock
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={v.stock}
                  onChange={(e) => updateVariant(v.key, "stock", e.target.value)}
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                SKU
                <input
                  value={v.sku}
                  onChange={(e) => updateVariant(v.key, "sku", e.target.value)}
                  placeholder="optional"
                  className={field}
                />
              </label>
              <button
                type="button"
                onClick={() => removeVariant(v)}
                aria-label="Remove option"
                className="col-span-2 flex items-center justify-center gap-2 self-end rounded border border-line p-2 text-sm text-red-300 hover:border-red-400 md:col-span-1"
              >
                <Trash2 size={16} />
                <span className="md:hidden">Remove</span>
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addVariant}
          className="mt-3 inline-flex items-center gap-2 rounded border border-accent px-4 py-2 text-sm text-accent hover:bg-accent hover:text-accent-contrast"
        >
          <Plus size={16} />
          Add another size / colour
        </button>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-accent px-8 py-3 font-medium text-accent-contrast hover:bg-accent-strong disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Save changes" : "Add product"}
        </button>
        <Link
          href="/admin/products"
          className="rounded border border-line px-8 py-3 text-center text-muted hover:text-foreground"
        >
          Cancel
        </Link>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded border border-line px-8 py-3 text-red-300 hover:border-red-400 disabled:opacity-50 sm:ml-auto"
          >
            Delete product
          </button>
        )}
      </div>
    </form>
  );
}
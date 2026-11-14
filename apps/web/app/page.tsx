import Image from "next/image";
import Link from "next/link";
import {
  Headphones,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProductCard, {
  biggestDiscount,
  lowestPrice,
  type CardProduct,
} from "@/components/ProductCard";
import ProductRow from "@/components/ProductRow";

type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
};

type Product = CardProduct & {
  created_at: string;
  category_id: string | null;
};

type SearchParams = {
  q?: string;
  category?: string;
  gender?: string;
  min?: string;
  max?: string;
  sort?: string;
};

function buildHref(params: SearchParams, changes: Partial<SearchParams>) {
  const merged = { ...params, ...changes };
  const query = new URLSearchParams();
  Object.entries(merged).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `/?${qs}#shop` : "/#shop";
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${
        active
          ? "border-accent bg-accent text-accent-contrast"
          : "border-line text-muted hover:border-accent hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

const benefits = [
  { icon: Truck, title: "Fast delivery", text: "Track your order live" },
  { icon: ShieldCheck, title: "Secure payment", text: "Pay safely with Paystack" },
  { icon: PackageCheck, title: "Quality picks", text: "Carefully selected items" },
  { icon: Headphones, title: "Support", text: "We are here to help" },
];

const firstImage = (p: Product) =>
  [...p.product_images].sort((a, b) => a.position - b.position)[0]?.url;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: categoryData } = await supabase
    .from("categories")
    .select("id, parent_id, name, slug")
    .order("created_at");
  const categories = (categoryData ?? []) as Category[];

  const topCategories = categories.filter((c) => !c.parent_id);
  const activeCategory = categories.find((c) => c.slug === params.category);
  const activeTop = activeCategory?.parent_id
    ? categories.find((c) => c.id === activeCategory.parent_id)
    : activeCategory;
  const subCategories = activeTop
    ? categories.filter((c) => c.parent_id === activeTop.id)
    : [];

  const categoryIds = activeCategory
    ? [
        activeCategory.id,
        ...categories.filter((c) => c.parent_id === activeCategory.id).map((c) => c.id),
      ]
    : null;

  const min = Number(params.min);
  const max = Number(params.max);
  const hasMin = !!params.min && !Number.isNaN(min);
  const hasMax = !!params.max && !Number.isNaN(max);
  const variantJoin =
    hasMin || hasMax ? "product_variants!inner" : "product_variants";

  // Hidden products only come back for admins (the database blocks them for everyone else)
  let query = supabase
    .from("products")
    .select(
      `id, name, slug, created_at, is_active, category_id, ${variantJoin}(price, compare_at_price, color), product_images(url, position)`
    );

  if (categoryIds) query = query.in("category_id", categoryIds);
  if (params.gender === "men" || params.gender === "women") {
    query = query.in("gender", [params.gender, "unisex"]);
  }
  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (hasMin) query = query.gte("product_variants.price", min);
  if (hasMax) query = query.lte("product_variants.price", max);

  const { data, error } = await query;

  if (error) {
    return (
      <p className="p-8 text-red-400">Could not load products: {error.message}</p>
    );
  }

  const products = ((data ?? []) as unknown as Product[])
    .filter((p) => p.product_variants.length > 0)
    .sort((a, b) => {
      if (params.sort === "price_asc") return lowestPrice(a) - lowestPrice(b);
      if (params.sort === "price_desc") return lowestPrice(b) - lowestPrice(a);
      return b.created_at.localeCompare(a.created_at);
    });

  // Homepage sections only show when nobody is searching or filtering
  const isFiltered = Boolean(
    params.q || params.category || params.gender || hasMin || hasMax || params.sort
  );
  const visible = products.filter((p) => p.is_active);

  const newArrivals = isFiltered || visible.length < 5 ? [] : visible.slice(0, 8);

  const onSale = isFiltered
    ? []
    : visible
        .filter((p) => biggestDiscount(p) > 0)
        .sort((a, b) => biggestDiscount(b) - biggestDiscount(a))
        .slice(0, 8);

  const tiles = isFiltered
    ? []
    : (topCategories
        .map((cat) => {
          const ids = [
            cat.id,
            ...categories.filter((c) => c.parent_id === cat.id).map((c) => c.id),
          ];
          const inCategory = visible.filter(
            (p) => p.category_id && ids.includes(p.category_id)
          );
          const image = inCategory.map(firstImage).find(Boolean);
          return { name: cat.name, slug: cat.slug, count: inCategory.length, image };
        })
        .filter((t) => t.count > 0 && t.image) as {
        name: string;
        slug: string;
        count: number;
        image: string;
      }[]);

  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-linear-to-br from-[#16263a] via-background to-background">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="mb-4 text-xs tracking-[0.3em] text-accent">[ NEW COLLECTION ]</p>
          <h1 className="font-display text-6xl uppercase leading-[0.95] md:text-8xl">
            Wear it.
            <br />
            Own it.
          </h1>
          <p className="mt-6 max-w-md text-muted">
            Clothes, shoes, bags, watches, perfumes and more. Fresh picks, easy checkout.
          </p>
          <Link
            href="#shop"
            className="mt-8 inline-block rounded bg-accent px-6 py-3 font-medium text-accent-contrast hover:bg-accent-strong"
          >
            Shop now
          </Link>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-6 md:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon size={24} className="shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      {tiles.length >= 2 && (
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <h2 className="mb-5 font-display text-3xl uppercase">Shop by category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {tiles.map((tile) => (
              <Link
                key={tile.slug}
                href={`/?category=${tile.slug}#shop`}
                className="group cut-corner relative block overflow-hidden bg-surface-2"
              >
                <Image
                  src={tile.image}
                  alt={tile.name}
                  width={600}
                  height={750}
                  className="aspect-4/5 w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/90 to-transparent p-4">
                  <p className="font-display text-xl uppercase">{tile.name}</p>
                  <p className="text-xs text-muted">
                    {tile.count} {tile.count === 1 ? "item" : "items"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductRow title="New arrivals" products={newArrivals} href="#shop" />
      <ProductRow title="On sale" products={onSale} />

      {/* Shop */}
      <section id="shop" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-4xl uppercase">All products</h2>
          <p className="text-sm text-muted">{products.length} items</p>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <Chip href={buildHref(params, { category: undefined })} active={!params.category}>
            All
          </Chip>
          {topCategories.map((c) => (
            <Chip
              key={c.id}
              href={buildHref(params, { category: c.slug })}
              active={activeTop?.slug === c.slug}
            >
              {c.name}
            </Chip>
          ))}
        </div>

        {activeTop && subCategories.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            <Chip
              href={buildHref(params, { category: activeTop.slug })}
              active={activeCategory?.slug === activeTop.slug}
            >
              All {activeTop.name}
            </Chip>
            {subCategories.map((c) => (
              <Chip
                key={c.id}
                href={buildHref(params, { category: c.slug })}
                active={activeCategory?.slug === c.slug}
              >
                {c.name}
              </Chip>
            ))}
          </div>
        )}

        <form
          action="/#shop"
          method="get"
          className="mb-8 mt-4 grid gap-3 rounded-lg border border-line bg-surface p-4 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
        >
          {params.category && (
            <input type="hidden" name="category" value={params.category} />
          )}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-muted" />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search products"
              className="w-full rounded p-2 pl-9"
            />
          </div>
          <select name="gender" defaultValue={params.gender ?? ""} className="rounded p-2">
            <option value="">Men & women</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
          <input
            name="min"
            type="number"
            min="0"
            defaultValue={params.min}
            placeholder="Min price"
            className="rounded p-2"
          />
          <input
            name="max"
            type="number"
            min="0"
            defaultValue={params.max}
            placeholder="Max price"
            className="rounded p-2"
          />
          <select name="sort" defaultValue={params.sort ?? ""} className="rounded p-2">
            <option value="">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-accent px-4 py-2 font-medium text-accent-contrast hover:bg-accent-strong"
            >
              Apply
            </button>
            <Link
              href="/#shop"
              className="rounded border border-line px-4 py-2 text-muted hover:text-foreground"
            >
              Clear
            </Link>
          </div>
        </form>

        {products.length === 0 ? (
          <p className="py-16 text-center text-muted">
            No products match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* WhatsApp help (only shows when a number is set) */}
      {whatsappNumber && !isFiltered && (
        <section className="mx-auto max-w-6xl px-6 pb-4">
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-line bg-surface p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl uppercase">Need help choosing?</h2>
              <p className="mt-1 text-sm text-muted">
                Ask about sizes, availability or delivery. We reply on WhatsApp.
              </p>
            </div>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                "Hello Karabu Hub, I need some help."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded bg-accent px-6 py-3 font-medium text-accent-contrast hover:bg-accent-strong"
            >
              <MessageCircle size={18} />
              Chat on WhatsApp
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
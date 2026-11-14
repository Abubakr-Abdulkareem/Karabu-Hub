import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/format";

export type CardProduct = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  product_variants: {
    price: number;
    compare_at_price: number | null;
    color: string | null;
  }[];
  product_images: { url: string; position: number }[];
};

export function lowestPrice(product: CardProduct) {
  return Math.min(...product.product_variants.map((v) => v.price));
}

// Biggest discount (in %) across a product's options, 0 if none
export function biggestDiscount(product: CardProduct) {
  let best = 0;
  for (const v of product.product_variants) {
    if (v.compare_at_price && v.compare_at_price > v.price) {
      best = Math.max(best, Math.round((1 - v.price / v.compare_at_price) * 100));
    }
  }
  return best;
}

export default function ProductCard({ product }: { product: CardProduct }) {
  const image = [...product.product_images].sort((a, b) => a.position - b.position)[0];
  const colors = Array.from(
    new Set(
      product.product_variants
        .map((v) => v.color)
        .filter((c): c is string => c !== null)
    )
  );
  const discount = biggestDiscount(product);

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="cut-corner relative overflow-hidden bg-surface-2">
        {image ? (
          <Image
            src={image.url}
            alt={product.name}
            width={600}
            height={800}
            className={`aspect-3/4 w-full object-cover transition duration-300 group-hover:scale-105 ${
              product.is_active ? "" : "opacity-50"
            }`}
          />
        ) : (
          <div className="aspect-3/4 w-full bg-surface-2" />
        )}

        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded bg-accent px-2 py-0.5 text-xs font-semibold text-accent-contrast">
            -{discount}%
          </span>
        )}
        {!product.is_active && (
          <span className="absolute right-2 top-2 rounded bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
            HIDDEN
          </span>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-medium uppercase tracking-wide">{product.name}</h3>
        {colors.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {colors.map((color) => (
              <span
                key={color}
                title={color}
                className="h-3 w-3 rounded-full border border-line"
                style={{ backgroundColor: color.toLowerCase() }}
              />
            ))}
          </div>
        )}
        <p className="mt-1 text-sm text-muted">From {formatNaira(lowestPrice(product))}</p>
      </div>
    </Link>
  );
}
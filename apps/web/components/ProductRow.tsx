import Link from "next/link";
import ProductCard, { type CardProduct } from "./ProductCard";

export default function ProductRow({
  title,
  products,
  href,
}: {
  title: string;
  products: CardProduct[];
  href?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pt-12">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="font-display text-3xl uppercase">{title}</h2>
        {href && (
          <Link href={href} className="text-sm text-accent hover:underline">
            View all →
          </Link>
        )}
      </div>

      <div className="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <div key={product.id} className="w-40 shrink-0 snap-start sm:w-52">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
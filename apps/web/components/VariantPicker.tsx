"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";

export type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
};

export default function VariantPicker({
  variants,
  cartQuantities,
}: {
  variants: Variant[];
  cartQuantities: Record<string, number>;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [quantities, setQuantities] = useState(cartQuantities);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) {
    return <p className="text-muted">Currently unavailable.</p>;
  }

  const inCart = quantities[selected.id] ?? 0;

  const colors = Array.from(
    new Set(variants.map((v) => v.color).filter((c): c is string => c !== null))
  );
  const sameColor = variants.filter((v) => v.color === selected.color);

  async function changeQuantity(next: number) {
    if (next > selected.stock) {
      setMessage(`Only ${selected.stock} left in stock.`);
      return;
    }

    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push("/login");
      return;
    }

    const { error } =
      next === 0
        ? await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", user.id)
            .eq("variant_id", selected.id)
        : await supabase
            .from("cart_items")
            .upsert(
              { user_id: user.id, variant_id: selected.id, quantity: next },
              { onConflict: "user_id,variant_id" }
            );

    if (error) {
      setMessage(error.message);
    } else {
      setQuantities((prev) => ({ ...prev, [selected.id]: next }));
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold">{formatNaira(selected.price)}</span>
        {selected.compare_at_price && (
          <span className="text-muted line-through">
            {formatNaira(selected.compare_at_price)}
          </span>
        )}
      </div>

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Colour: {selected.color}</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() =>
                  setSelectedId(variants.find((v) => v.color === color)!.id)
                }
                className={`rounded border px-3 py-1 text-sm ${
                  selected.color === color
                    ? "border-accent bg-accent text-accent-contrast"
                    : ""
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Size: {selected.size}</p>
        <div className="flex flex-wrap gap-2">
          {sameColor.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              disabled={v.stock === 0}
              className={`rounded border px-3 py-1 text-sm disabled:opacity-40 ${
                selected.id === v.id
                  ? "border-accent bg-accent text-accent-contrast"
                  : ""
              }`}
            >
              {v.size}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted">
        {selected.stock === 0
          ? "Out of stock"
          : selected.stock <= 5
          ? `Only ${selected.stock} left`
          : "In stock"}
      </p>

      {inCart === 0 ? (
        <button
          onClick={() => changeQuantity(1)}
          disabled={loading || selected.stock === 0}
          className="rounded bg-accent p-3 font-medium text-accent-contrast disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add to cart"}
        </button>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded border border-line">
            <button
              onClick={() => changeQuantity(inCart - 1)}
              disabled={loading}
              aria-label="Decrease quantity"
              className="p-3 disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <span className="w-10 text-center">{inCart}</span>
            <button
              onClick={() => changeQuantity(inCart + 1)}
              disabled={loading || inCart >= selected.stock}
              aria-label="Increase quantity"
              className="p-3 disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>
          <span className="text-sm text-muted">in your cart</span>
          <Link href="/cart" className="text-sm underline">
            View cart
          </Link>
        </div>
      )}

      {message && <p className="text-sm text-red-400">{message}</p>}
    </div>
  );
}
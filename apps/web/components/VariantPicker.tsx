"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function VariantPicker({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) {
    return <p className="text-gray-600">Currently unavailable.</p>;
  }

  const colors = Array.from(
    new Set(variants.map((v) => v.color).filter((c): c is string => c !== null))
  );
  const sameColor = variants.filter((v) => v.color === selected.color);

  async function addToCart() {
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("variant_id", selected.id)
      .maybeSingle();

    const newQuantity = (existing?.quantity ?? 0) + 1;

    if (newQuantity > selected.stock) {
      setMessage(`Only ${selected.stock} left in stock.`);
      setLoading(false);
      return;
    }

    const { error } = existing
      ? await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("id", existing.id)
      : await supabase
          .from("cart_items")
          .insert({ user_id: user.id, variant_id: selected.id, quantity: 1 });

    setMessage(error ? error.message : "Added to cart.");
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold">{formatNaira(selected.price)}</span>
        {selected.compare_at_price && (
          <span className="text-gray-500 line-through">
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
                  selected.color === color ? "border-black bg-black text-white" : ""
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
                selected.id === v.id ? "border-black bg-black text-white" : ""
              }`}
            >
              {v.size}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-600">
        {selected.stock === 0
          ? "Out of stock"
          : selected.stock <= 5
          ? `Only ${selected.stock} left`
          : "In stock"}
      </p>

      <button
        onClick={addToCart}
        disabled={loading || selected.stock === 0}
        className="rounded bg-black p-3 text-white disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add to cart"}
      </button>

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
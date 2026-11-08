"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CartItemControls({
  itemId,
  quantity,
  stock,
}: {
  itemId: string;
  quantity: number;
  stock: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setQuantity(next: number) {
    if (next < 1 || next > stock) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("cart_items").update({ quantity: next }).eq("id", itemId);
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("cart_items").delete().eq("id", itemId);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded border border-line">
        <button
          onClick={() => setQuantity(quantity - 1)}
          disabled={busy || quantity <= 1}
          aria-label="Decrease quantity"
          className="p-2 disabled:opacity-40"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          disabled={busy || quantity >= stock}
          aria-label="Increase quantity"
          className="p-2 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>
      <button
        onClick={remove}
        disabled={busy}
        aria-label="Remove item"
        className="text-muted hover:text-red-400 disabled:opacity-40"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
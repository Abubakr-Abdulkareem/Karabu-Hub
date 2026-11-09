"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { statusLabels } from "@/components/OrderStatusBadge";

const statuses = ["paid", "processing", "out_for_delivery", "delivered", "cancelled"];

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: string) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: next })
      .eq("id", orderId);

    if (error) {
      setValue(previous);
      setError(error.message);
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div>
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={saving}
        className="w-full rounded p-2 text-sm disabled:opacity-50"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {statusLabels[s]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
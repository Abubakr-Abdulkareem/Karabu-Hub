"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Fields = {
  full_name: string;
  phone: string;
  height_cm: string;
  chest_cm: string;
  waist_cm: string;
  hips_cm: string;
  shoe_size: string;
};

function toNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isNaN(n) || n < 0 ? NaN : n;
}

export default function ProfileForm({
  userId,
  initial,
}: {
  userId: string;
  initial: Fields;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Fields>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const set =
    (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const measurements = {
      height_cm: toNumber(form.height_cm),
      chest_cm: toNumber(form.chest_cm),
      waist_cm: toNumber(form.waist_cm),
      hips_cm: toNumber(form.hips_cm),
    };
    if (Object.values(measurements).some((v) => v !== null && Number.isNaN(v))) {
      setMessage({ ok: false, text: "Measurements must be numbers." });
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        ...measurements,
        shoe_size: form.shoe_size.trim() || null,
      })
      .eq("id", userId);

    setSaving(false);
    if (error) {
      setMessage({ ok: false, text: error.message });
    } else {
      setMessage({ ok: true, text: "Saved." });
      router.refresh();
    }
  }

  const input = "w-full rounded p-2";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Full name
          <input value={form.full_name} onChange={set("full_name")} required className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Phone number
          <input type="tel" value={form.phone} onChange={set("phone")} className={input} />
        </label>
      </section>

      <section>
        <h2 className="font-display text-2xl uppercase">Size profile</h2>
        <p className="mb-4 text-sm text-muted">
          Optional. We will use this to recommend your size. You can leave it empty.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Height (cm)
            <input type="number" min="0" step="0.1" value={form.height_cm} onChange={set("height_cm")} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Chest (cm)
            <input type="number" min="0" step="0.1" value={form.chest_cm} onChange={set("chest_cm")} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Waist (cm)
            <input type="number" min="0" step="0.1" value={form.waist_cm} onChange={set("waist_cm")} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hips (cm)
            <input type="number" min="0" step="0.1" value={form.hips_cm} onChange={set("hips_cm")} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Shoe size
            <input value={form.shoe_size} onChange={set("shoe_size")} className={input} />
          </label>
        </div>
      </section>

      {message && (
        <p className={`text-sm ${message.ok ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-accent p-3 font-medium text-accent-contrast hover:bg-accent-strong disabled:opacity-50 sm:w-fit sm:px-8"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
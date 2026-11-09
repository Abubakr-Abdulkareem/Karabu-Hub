"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/format";

type Item = {
  id: string;
  name: string;
  label: string;
  quantity: number;
  lineTotal: number;
};

type Props = {
  items: Item[];
  subtotal: number;
  fees: { state: string; fee: number }[];
  initial: {
    recipient_name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
  };
};

export default function CheckoutForm({ items, subtotal, fees, initial }: Props) {
  const [recipientName, setRecipientName] = useState(initial.recipient_name);
  const [phone, setPhone] = useState(initial.phone);
  const [street, setStreet] = useState(initial.street);
  const [city, setCity] = useState(initial.city);
  const [state, setState] = useState(initial.state);
  const [saveAddress, setSaveAddress] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const deliveryFee = fees.find((f) => f.state === state)?.fee ?? null;
  const total = subtotal + (deliveryFee ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_name: recipientName,
          phone,
          street,
          city,
          state,
          save_address: saveAddress,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network problem. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="font-display text-2xl uppercase">Delivery details</h2>

        <label className="flex flex-col gap-1 text-sm">
          Full name
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
            className="w-full rounded p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Phone number
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="08012345678"
            className="w-full rounded p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Street address
          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
            className="w-full rounded p-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            City / Area
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full rounded p-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            State
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              className="w-full rounded p-2"
            >
              <option value="">Select state</option>
              {fees.map((f) => (
                <option key={f.state} value={f.state}>
                  {f.state}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={saveAddress}
            onChange={(e) => setSaveAddress(e.target.checked)}
          />
          Save this address for next time
        </label>
      </form>

      <aside className="h-fit rounded-lg border border-line bg-surface p-6">
        <h2 className="mb-4 font-display text-2xl uppercase">Order summary</h2>

        <ul className="mb-4 flex flex-col gap-3 border-b border-line pb-4 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <div>
                <p className="font-medium">
                  {item.name} <span className="text-muted">× {item.quantity}</span>
                </p>
                {item.label && <p className="text-muted">{item.label}</p>}
              </div>
              <p>{formatNaira(item.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <div className="flex justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span>{formatNaira(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted">Delivery</span>
          <span>
            {deliveryFee === null ? "Select a state" : formatNaira(deliveryFee)}
          </span>
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-medium">
          <span>Total</span>
          <span>{formatNaira(total)}</span>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          form="checkout-form"
          disabled={loading || deliveryFee === null}
          className="mt-6 w-full rounded bg-accent p-3 font-medium text-accent-contrast hover:bg-accent-strong disabled:opacity-50"
        >
          {loading ? "Redirecting to payment..." : `Pay ${formatNaira(total)}`}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          Secure payment by Paystack
        </p>
      </aside>
    </div>
  );
}
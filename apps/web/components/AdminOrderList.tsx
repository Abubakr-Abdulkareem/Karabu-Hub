"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderStatusSelect from "@/components/OrderStatusSelect";

export type AdminOrderView = {
  id: string;
  status: string;
  totalLabel: string;
  dateLabel: string;
  recipient_name: string;
  phone: string;
  address: string;
  items: {
    id: string;
    product_name: string;
    size: string | null;
    color: string | null;
    quantity: number;
  }[];
};

export default function AdminOrderList({ orders }: { orders: AdminOrderView[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => {
        const open = openId === order.id;

        return (
          <li
            key={order.id}
            className={`overflow-hidden rounded-lg border bg-surface ${
              open ? "border-accent" : "border-line"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : order.id)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-surface-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  #{order.id.slice(0, 8).toUpperCase()}
                  <span className="font-normal text-muted"> · {order.recipient_name}</span>
                </p>
                <p className="text-xs text-muted">
                  {order.dateLabel} · {order.items.length}{" "}
                  {order.items.length === 1 ? "item" : "items"}
                </p>
                <div className="mt-1 sm:hidden">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <div className="hidden sm:block">
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="shrink-0 text-sm font-medium">{order.totalLabel}</p>
              <ChevronDown
                size={18}
                className={`shrink-0 text-muted transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {open && (
              <div className="grid gap-5 border-t border-line p-4 md:grid-cols-[1fr_1fr_200px]">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted">Items</p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.product_name} × {item.quantity}
                        <span className="text-muted">
                          {" "}
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-sm">
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted">Deliver to</p>
                  <p className="font-medium">{order.recipient_name}</p>
                  <a href={`tel:${order.phone}`} className="text-accent hover:underline">
                    {order.phone}
                  </a>
                  <p className="mt-1 text-muted">{order.address}</p>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted">Status</p>
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
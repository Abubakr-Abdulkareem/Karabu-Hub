"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  User,
} from "lucide-react";
import LogoutButton from "./LogoutButton";

type Props = {
  name: string;
  email: string;
  isAdmin: boolean;
  cartCount: number;
  unreadCount: number;
};

export default function UserMenu({ name, email, isAdmin, cartCount, unreadCount }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const initial = (name || email || "U").charAt(0).toUpperCase();

  const links = [
    { href: "/account", label: "My account", icon: User, count: 0 },
    { href: "/orders", label: "My orders", icon: Package, count: 0 },
    { href: "/notifications", label: "Notifications", icon: Bell, count: unreadCount },
    { href: "/cart", label: "Cart", icon: ShoppingBag, count: cartCount },
  ];
  if (isAdmin) {
    links.push({ href: "/admin", label: "Admin dashboard", icon: LayoutDashboard, count: 0 });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-2 text-sm font-medium hover:border-accent"
      >
        {initial}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate font-medium">{name || "My account"}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>

          <ul className="py-1">
            {links.map(({ href, label, icon: Icon, count }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-surface-2"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} className="text-muted" />
                    {label}
                  </span>
                  {count > 0 && (
                    <span className="rounded-full bg-accent px-2 text-xs font-bold text-accent-contrast">
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-line py-1">
            <LogoutButton className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-300 hover:bg-surface-2">
              <LogOut size={16} />
              Log out
            </LogoutButton>
          </div>
        </div>
      )}
    </div>
  );
}
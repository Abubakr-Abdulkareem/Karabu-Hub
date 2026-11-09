"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, LayoutGrid, ShoppingBag, User } from "lucide-react";

type Props = { loggedIn: boolean; cartCount: number; unreadCount: number };

export default function MobileNav({ loggedIn, cartCount, unreadCount }: Props) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Home", icon: Home, count: 0 },
    { href: "/categories", label: "Categories", icon: LayoutGrid, count: 0 },
    { href: "/cart", label: "Cart", icon: ShoppingBag, count: cartCount },
    { href: "/notifications", label: "Alerts", icon: Bell, count: unreadCount },
    {
      href: loggedIn ? "/account" : "/login",
      label: loggedIn ? "Account" : "Log in",
      icon: User,
      count: 0,
    },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon, count }) => (
          <li key={label}>
            <Link
              href={href}
              className={`relative flex flex-col items-center gap-1 py-2 text-[11px] ${
                isActive(href) ? "text-accent" : "text-muted"
              }`}
            >
              <span className="relative">
                <Icon size={22} />
                {count > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-contrast">
                    {count}
                  </span>
                )}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
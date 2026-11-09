"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Add new admin sections here as we build them
const links = [{ href: "/admin/orders", label: "Orders" }];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-2 overflow-x-auto border-b border-line pb-4">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm ${
              active
                ? "border-accent bg-accent text-accent-contrast"
                : "border-line text-muted hover:border-accent hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
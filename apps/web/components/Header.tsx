import Link from "next/link";
import { Bell, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-contrast">
      {count}
    </span>
  );
}

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  let cartCount = 0;
  let unreadCount = 0;

  if (user) {
    const [profileRes, cartRes, notifRes] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase.from("cart_items").select("quantity").eq("user_id", user.id),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
    ]);
    name = profileRes.data?.full_name ?? user.email ?? null;
    cartCount = (cartRes.data ?? []).reduce((sum, item) => sum + item.quantity, 0);
    unreadCount = notifRes.count ?? 0;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-2xl uppercase tracking-wide">
          Karabu<span className="text-accent">Hub</span>
        </Link>

        <nav className="hidden gap-6 text-sm text-muted md:flex">
          <Link href="/#shop" className="hover:text-foreground">Shop</Link>
          <Link href="/?gender=men#shop" className="hover:text-foreground">Men</Link>
          <Link href="/?gender=women#shop" className="hover:text-foreground">Women</Link>
          {user && (
            <Link href="/orders" className="hover:text-foreground">My orders</Link>
          )}
        </nav>

        <div className="flex items-center gap-5 text-sm">
          {user ? (
            <>
              <Link href="/notifications" aria-label="Notifications" className="relative">
                <Bell size={20} />
                {unreadCount > 0 && <Badge count={unreadCount} />}
              </Link>
              <Link href="/cart" aria-label="Cart" className="relative">
                <ShoppingBag size={20} />
                {cartCount > 0 && <Badge count={cartCount} />}
              </Link>
              <span className="hidden text-muted md:inline">Hi, {name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted hover:text-foreground">Log in</Link>
              <Link
                href="/register"
                className="rounded bg-accent px-3 py-1.5 font-medium text-accent-contrast"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
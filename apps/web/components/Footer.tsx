import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl uppercase">
            Karabu<span className="text-accent">Hub</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            Clothes, shoes, bags, watches, perfumes and more.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-wide">Shop</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/#shop" className="hover:text-foreground">All products</Link></li>
            <li><Link href="/?gender=men#shop" className="hover:text-foreground">Men</Link></li>
            <li><Link href="/?gender=women#shop" className="hover:text-foreground">Women</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-wide">My account</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/cart" className="hover:text-foreground">Cart</Link></li>
            <li><Link href="/orders" className="hover:text-foreground">My orders</Link></li>
            <li><Link href="/notifications" className="hover:text-foreground">Notifications</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Karabu Hub. All rights reserved.
      </div>
    </footer>
  );
}
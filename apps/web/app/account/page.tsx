import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Package, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import LogoutButton from "@/components/LogoutButton";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, height_cm, chest_cm, waist_cm, hips_cm, shoe_size")
    .eq("id", user.id)
    .single();

  const initial = {
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    height_cm: profile?.height_cm?.toString() ?? "",
    chest_cm: profile?.chest_cm?.toString() ?? "",
    waist_cm: profile?.waist_cm?.toString() ?? "",
    hips_cm: profile?.hips_cm?.toString() ?? "",
    shoe_size: profile?.shoe_size ?? "",
  };

  const shortcuts = [
    { href: "/orders", label: "My orders", icon: Package },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/cart", label: "Cart", icon: ShoppingBag },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-4xl uppercase">My account</h1>
      <p className="mb-8 text-sm text-muted">{user.email}</p>

      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        {shortcuts.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 hover:border-accent"
          >
            <Icon size={20} className="text-accent" />
            {label}
          </Link>
        ))}
      </div>

      <ProfileForm userId={user.id} initial={initial} />

      <LogoutButton className="mt-10 w-full rounded border border-line p-3 text-red-300 hover:border-red-400 sm:w-auto sm:px-8" />
    </main>
  );
}
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    name = profile?.full_name ?? user.email ?? null;
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link href="/" className="text-lg font-bold">
          Karabu Hub
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <span>Hi, {name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="underline">
                Log in
              </Link>
              <Link href="/register" className="underline">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, parent_id, name, slug")
    .order("created_at");

  const categories = data ?? [];
  const topLevel = categories.filter((c) => !c.parent_id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 font-display text-4xl uppercase">Categories</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topLevel.map((category) => {
          const subs = categories.filter((c) => c.parent_id === category.id);
          return (
            <div key={category.id} className="cut-corner bg-surface-2 p-6">
              <Link
                href={`/?category=${category.slug}#shop`}
                className="font-display text-2xl uppercase hover:text-accent"
              >
                {category.name}
              </Link>

              {subs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {subs.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/?category=${sub.slug}#shop`}
                      className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-accent hover:text-foreground"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}

              <Link
                href={`/?category=${category.slug}#shop`}
                className="mt-4 inline-block text-sm text-accent hover:underline"
              >
                Shop all →
              </Link>
            </div>
          );
        })}
      </div>
    </main>
  );
}
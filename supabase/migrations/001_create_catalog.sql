-- Categories (can be nested, e.g. Footwear > Slides)
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Products (the general item, e.g. "Classic Polo Shirt")
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  brand text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Variants (the sellable version: size + colour, with its own price and stock)
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text unique,
  size text,
  color text,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Images
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  url text not null,
  position integer not null default 0
);

-- Security: anyone can read the catalog, nobody can write from the app
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;

create policy "Anyone can view categories" on categories for select using (true);
create policy "Anyone can view active products" on products for select using (is_active = true);
create policy "Anyone can view active variants" on product_variants for select using (is_active = true);
create policy "Anyone can view product images" on product_images for select using (true);
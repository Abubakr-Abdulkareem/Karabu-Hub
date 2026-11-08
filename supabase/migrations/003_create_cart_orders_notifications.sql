-- Helper: is the current user an admin?
create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Admins can manage the catalog
create policy "Admins manage categories" on categories
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage products" on products
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage variants" on product_variants
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage images" on product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- Cart
create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending','paid','processing','out_for_delivery','delivered','cancelled')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null check (total >= 0),
  paystack_reference text unique,
  paid_at timestamptz,
  recipient_name text not null,
  phone text not null,
  street text not null,
  city text not null,
  state text not null,
  created_at timestamptz not null default now()
);

-- Order items (name and price are copied so old orders never change)
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  product_name text not null,
  size text,
  color text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);

-- In-app notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  type text not null default 'general',
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Security
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table notifications enable row level security;

create policy "Users manage own cart" on cart_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users view own orders" on orders
  for select using (auth.uid() = user_id);
create policy "Admins view all orders" on orders
  for select using (public.is_admin());
create policy "Admins update orders" on orders
  for update using (public.is_admin());

create policy "Users view own order items" on order_items
  for select using (exists (
    select 1 from orders o where o.id = order_id and o.user_id = auth.uid()
  ));
create policy "Admins view all order items" on order_items
  for select using (public.is_admin());

create policy "Users view own notifications" on notifications
  for select using (auth.uid() = user_id);
create policy "Users update own notifications" on notifications
  for update using (auth.uid() = user_id);

-- Customers may only mark notifications as read
revoke update on notifications from anon, authenticated;
grant update (is_read) on notifications to authenticated;

-- Automatic notification whenever an order's status changes
create function public.notify_order_status()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, order_id, type, title, body)
    values (
      new.user_id,
      new.id,
      'order_status',
      case new.status
        when 'paid' then 'Payment received'
        when 'processing' then 'Your order is being prepared'
        when 'out_for_delivery' then 'Your order is out for delivery'
        when 'delivered' then 'Your order has been delivered'
        when 'cancelled' then 'Your order was cancelled'
        else 'Order update'
      end,
      'Your order is now: ' || replace(new.status, '_', ' ') || '.'
    );
  end if;
  return new;
end;
$$;

create trigger on_order_status_change
  after update on orders
  for each row execute function public.notify_order_status();
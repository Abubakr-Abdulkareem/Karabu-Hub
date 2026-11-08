-- Delivery fee per state
create table delivery_fees (
  state text primary key,
  fee numeric(12,2) not null check (fee >= 0)
);

alter table delivery_fees enable row level security;

create policy "Anyone can view delivery fees" on delivery_fees
  for select using (true);
create policy "Admins manage delivery fees" on delivery_fees
  for all using (public.is_admin()) with check (public.is_admin());

-- PLACEHOLDER fees: change these to your real prices
insert into delivery_fees (state, fee) values
  ('Lagos', 2500),
  ('Ogun', 3500), ('Oyo', 3500), ('Osun', 3500), ('Ondo', 3500),
  ('Ekiti', 3500), ('FCT Abuja', 3500),
  ('Abia', 5000), ('Adamawa', 5000), ('Akwa Ibom', 5000), ('Anambra', 5000),
  ('Bauchi', 5000), ('Bayelsa', 5000), ('Benue', 5000), ('Borno', 5000),
  ('Cross River', 5000), ('Delta', 5000), ('Ebonyi', 5000), ('Edo', 5000),
  ('Enugu', 5000), ('Gombe', 5000), ('Imo', 5000), ('Jigawa', 5000),
  ('Kaduna', 5000), ('Kano', 5000), ('Katsina', 5000), ('Kebbi', 5000),
  ('Kogi', 5000), ('Kwara', 5000), ('Nasarawa', 5000), ('Niger', 5000),
  ('Plateau', 5000), ('Rivers', 5000), ('Sokoto', 5000), ('Taraba', 5000),
  ('Yobe', 5000), ('Zamfara', 5000);

-- Marks an order paid, reduces stock and clears the cart.
-- Safe to call twice: it only works while the order is still 'pending'.
create function public.fulfill_order(p_order_id uuid)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid;
begin
  update public.orders
  set status = 'paid', paid_at = now()
  where id = p_order_id and status = 'pending'
  returning user_id into v_user;

  if v_user is null then
    return false;
  end if;

  update public.product_variants v
  set stock = greatest(v.stock - oi.quantity, 0)
  from public.order_items oi
  where oi.order_id = p_order_id and oi.variant_id = v.id;

  delete from public.cart_items where user_id = v_user;

  return true;
end;
$$;

-- Only our server (service role) may call it, never a customer's browser
revoke execute on function public.fulfill_order(uuid) from public, anon, authenticated;
grant execute on function public.fulfill_order(uuid) to service_role;
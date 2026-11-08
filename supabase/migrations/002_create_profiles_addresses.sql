-- Profiles: one per customer, linked to Supabase login accounts
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  is_admin boolean not null default false,
  -- optional measurements, used only for size recommendations
  height_cm numeric(5,1),
  chest_cm numeric(5,1),
  waist_cm numeric(5,1),
  hips_cm numeric(5,1),
  shoe_size text,
  created_at timestamptz not null default now()
);

-- Delivery addresses
create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  street text not null,
  city text not null,
  state text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Security
alter table profiles enable row level security;
alter table addresses enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users manage own addresses" on addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Stop customers from making themselves admin:
-- they may only update these specific columns
revoke update on profiles from anon, authenticated;
grant update (full_name, phone, avatar_url, height_cm, chest_cm, waist_cm, hips_cm, shoe_size)
  on profiles to authenticated;

-- Auto-create a profile when someone signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
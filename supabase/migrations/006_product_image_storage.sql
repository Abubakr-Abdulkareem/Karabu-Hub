-- A public bucket for product photos
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can view photos; only admins can add, change or remove them
create policy "Public read product-images bucket" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Admins upload to product-images bucket" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins update product-images bucket" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

create policy "Admins delete from product-images bucket" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
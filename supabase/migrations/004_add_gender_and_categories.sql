-- Men / women / unisex on products
alter table products
  add column gender text not null default 'unisex'
  check (gender in ('men', 'women', 'unisex'));

-- Sub-categories under Clothing
insert into categories (parent_id, name, slug)
select id, 'Tops', 'tops' from categories where slug = 'clothing';
insert into categories (parent_id, name, slug)
select id, 'Trousers', 'trousers' from categories where slug = 'clothing';

-- More top-level categories
insert into categories (name, slug) values
  ('Watches', 'watches'),
  ('Accessories', 'accessories'),
  ('Glasses', 'glasses');

-- Update the test products
update products set category_id = (select id from categories where slug = 'tops'), gender = 'men' where slug = 'classic-polo-shirt';
update products set gender = 'men' where slug = 'leather-slides';
update products set gender = 'women' where slug = 'everyday-tote-bag';

-- More test products so you can try the filters
insert into products (category_id, name, slug, description, brand, gender)
select id, 'Slim Fit Chinos', 'slim-fit-chinos', 'Stretch cotton chinos with a clean fit.', 'Karabu', 'men' from categories where slug = 'trousers';
insert into products (category_id, name, slug, description, brand, gender)
select id, 'Classic Wrist Watch', 'classic-wrist-watch', 'Stainless steel watch with a leather strap.', 'Karabu', 'unisex' from categories where slug = 'watches';
insert into products (category_id, name, slug, description, brand, gender)
select id, 'Round Sunglasses', 'round-sunglasses', 'UV-protected round frames.', 'Karabu', 'women' from categories where slug = 'glasses';
insert into products (category_id, name, slug, description, brand, gender)
select id, 'Floral Blouse', 'floral-blouse', 'Light, breezy blouse for warm days.', 'Karabu', 'women' from categories where slug = 'tops';

insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'CHINO-32-KHK', '32', 'Khaki', 22000, 8 from products where slug = 'slim-fit-chinos';
insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'CHINO-34-KHK', '34', 'Khaki', 22000, 6 from products where slug = 'slim-fit-chinos';
insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'CHINO-32-NVY', '32', 'Navy', 22000, 5 from products where slug = 'slim-fit-chinos';

insert into product_variants (product_id, sku, size, color, price, compare_at_price, stock)
select id, 'WATCH-BLK', 'One size', 'Black', 45000, 60000, 5 from products where slug = 'classic-wrist-watch';
insert into product_variants (product_id, sku, size, color, price, compare_at_price, stock)
select id, 'WATCH-SLV', 'One size', 'Silver', 48000, 60000, 3 from products where slug = 'classic-wrist-watch';

insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'SUN-BLK', 'One size', 'Black', 9000, 15 from products where slug = 'round-sunglasses';

insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'BLOUSE-S-WHT', 'S', 'White', 14000, 6 from products where slug = 'floral-blouse';
insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'BLOUSE-M-WHT', 'M', 'White', 14000, 9 from products where slug = 'floral-blouse';

insert into product_images (product_id, url, position)
select id, 'https://placehold.co/600x800.png?text=Chinos', 0 from products where slug = 'slim-fit-chinos';
insert into product_images (product_id, url, position)
select id, 'https://placehold.co/600x800.png?text=Watch', 0 from products where slug = 'classic-wrist-watch';
insert into product_images (product_id, url, position)
select id, 'https://placehold.co/600x800.png?text=Sunglasses', 0 from products where slug = 'round-sunglasses';
insert into product_images (product_id, url, position)
select id, 'https://placehold.co/600x800.png?text=Blouse', 0 from products where slug = 'floral-blouse';

-- Make all placeholder images match the blue theme
update product_images
set url = replace(url, 'placehold.co/600x800.png', 'placehold.co/600x800/1a2635/7fb3e6.png');
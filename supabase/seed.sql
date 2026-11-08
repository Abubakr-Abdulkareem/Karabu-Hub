insert into categories (name, slug) values
  ('Clothing', 'clothing'),
  ('Shoes', 'shoes'),
  ('Bags', 'bags'),
  ('Perfumes', 'perfumes');

insert into products (category_id, name, slug, description, brand)
select id, 'Classic Polo Shirt', 'classic-polo-shirt', 'Soft cotton polo for everyday wear.', 'Karabu'
from categories where slug = 'clothing';

insert into products (category_id, name, slug, description, brand)
select id, 'Leather Slides', 'leather-slides', 'Comfortable slides for any day.', 'Karabu'
from categories where slug = 'shoes';

insert into products (category_id, name, slug, description, brand)
select id, 'Everyday Tote Bag', 'everyday-tote-bag', 'Roomy tote with a sturdy strap.', 'Karabu'
from categories where slug = 'bags';

insert into products (category_id, name, slug, description, brand)
select id, 'Oud Perfume', 'oud-perfume', 'Warm, long-lasting fragrance.', 'Karabu'
from categories where slug = 'perfumes';

insert into product_variants (product_id, sku, size, color, price, compare_at_price, stock)
select id, 'POLO-M-NAVY', 'M', 'Navy', 15000, 18000, 10 from products where slug = 'classic-polo-shirt';
insert into product_variants (product_id, sku, size, color, price, compare_at_price, stock)
select id, 'POLO-L-NAVY', 'L', 'Navy', 15000, 18000, 8 from products where slug = 'classic-polo-shirt';
insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'POLO-M-WHITE', 'M', 'White', 16000, 5 from products where slug = 'classic-polo-shirt';

insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'SLIDE-42-BLK', '42', 'Black', 12000, 6 from products where slug = 'leather-slides';
insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'SLIDE-44-BLK', '44', 'Black', 12000, 4 from products where slug = 'leather-slides';

insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'TOTE-BRN', 'One size', 'Brown', 25000, 7 from products where slug = 'everyday-tote-bag';

insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'OUD-50', '50ml', null, 30000, 12 from products where slug = 'oud-perfume';
insert into product_variants (product_id, sku, size, color, price, stock)
select id, 'OUD-100', '100ml', null, 50000, 9 from products where slug = 'oud-perfume';

insert into product_images (product_id, url, position)
select id, 'https://placehold.co/600x800.png?text=Polo+Shirt', 0 from products where slug = 'classic-polo-shirt';
insert into product_images (product_id, url, position)
select id, 'https://placehold.co/600x800.png?text=Slides', 0 from products where slug = 'leather-slides';
insert into product_images (product_id, url, position)
select id, 'https://placehold.co/600x800.png?text=Tote+Bag', 0 from products where slug = 'everyday-tote-bag';
insert into product_images (product_id, url, position)
select id, 'https://placehold.co/600x800.png?text=Perfume', 0 from products where slug = 'oud-perfume';
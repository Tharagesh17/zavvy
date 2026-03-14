-- PERFORMANCE OPTIMIZATIONS
-- Run this to improve query speeds for product lookups and dashboard lists.

-- 1. Index Foreign Keys (Crucial for Joins)
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_links_product_id ON public.product_links(product_id);
CREATE INDEX IF NOT EXISTS idx_product_links_seller_id ON public.product_links(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);

-- 2. Index Frequently Filtered Columns
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_links_is_active ON public.product_links(is_active);
CREATE INDEX IF NOT EXISTS idx_product_links_short_code ON public.product_links(short_code); -- Unique already handles this, but including for clarity if Unique is dropped later.

-- 3. Composite Index for Dashboard (Seller + Created At sorting)
CREATE INDEX IF NOT EXISTS idx_orders_seller_created_at ON public.orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_seller_created_at ON public.products(seller_id, created_at DESC);

-- 4. Atomic Increment Function (Better Concurrency)
CREATE OR REPLACE FUNCTION increment_link_clicks(link_short_code text)
RETURNS void AS $$
BEGIN
  UPDATE public.product_links
  SET clicks = clicks + 1
  WHERE short_code = link_short_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

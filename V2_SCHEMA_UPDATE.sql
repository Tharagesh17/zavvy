-- ============================================
-- ZAVVY ENGINE V2 SCHEMA UPDATE
-- ============================================
-- Run this script in the Supabase SQL Editor.
-- It is designed to be idempotent.

-- ============================================
-- 1. PROFILES: Trial & Pro Management
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='trial_ends_at') THEN
    ALTER TABLE public.profiles ADD COLUMN trial_ends_at timestamptz DEFAULT (now() + interval '14 days');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_pro') THEN
    ALTER TABLE public.profiles ADD COLUMN is_pro boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subscription_id') THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_id text;
  END IF;
END $$;

-- ============================================
-- 2. COLLECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(seller_id, slug)
);
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can manage own collections" ON public.collections;
CREATE POLICY "Sellers can manage own collections" ON public.collections FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sellers WHERE id = seller_id));

DROP POLICY IF EXISTS "Everyone can view collections" ON public.collections;
CREATE POLICY "Everyone can view collections" ON public.collections FOR SELECT USING (true);


-- ============================================
-- 3. PRODUCTS: Link to Collections
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='collection_id') THEN
    ALTER TABLE public.products ADD COLUMN collection_id uuid REFERENCES public.collections (id) ON DELETE SET NULL;
  END IF;
END $$;


-- ============================================
-- 4. PRODUCT VARIANTS (Extract from JSONB)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  size text,
  color text,
  stock_count integer NOT NULL DEFAULT 0,
  price_override integer, -- null means use product price
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can manage own variants" ON public.product_variants;
CREATE POLICY "Sellers can manage own variants" ON public.product_variants FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sellers WHERE id = (SELECT seller_id FROM public.products WHERE id = product_id)));

DROP POLICY IF EXISTS "Everyone can view variants" ON public.product_variants;
CREATE POLICY "Everyone can view variants" ON public.product_variants FOR SELECT USING (true);


-- ============================================
-- 5. ORDERS: UTR & Unique Constraint
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='utr_number') THEN
    ALTER TABLE public.orders ADD COLUMN utr_number text;
  END IF;
END $$;

-- Enforce unique UTR numbers to prevent double-spending/fraud
-- Note: we ignore NULLs using a partial index
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_utr ON public.orders (utr_number) WHERE utr_number IS NOT NULL;


-- ============================================
-- 6. SECURITY: Trial Enforcement on Products
-- ============================================
-- Override the existing "Sellers can manage own products" policy
-- to enforce the 14-day trial / is_pro lock out.
DROP POLICY IF EXISTS "Sellers can insert own products" ON public.products;
CREATE POLICY "Sellers can insert own products" ON public.products 
FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.sellers WHERE id = seller_id)
  AND (
    (SELECT is_pro FROM public.profiles WHERE id = auth.uid()) = true
    OR 
    (SELECT trial_ends_at FROM public.profiles WHERE id = auth.uid()) > now()
  )
);

-- We leave UPDATE/DELETE as-is so they can edit existing products even if expired.

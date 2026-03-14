-- ZAVVY SUPABASE SETUP (FINAL MVP)
-- Run this entire script in the Supabase SQL Editor.
-- It is designed to be idempotent (safe to run multiple times), but for a fresh start, you can uncomment the DROP commands.

-- 1. CLEANUP (Uncomment to RESET database)
-- DROP TABLE IF EXISTS public.payouts CASCADE;
-- DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
-- DROP TABLE IF EXISTS public.virtual_accounts CASCADE;
-- DROP TABLE IF EXISTS public.orders CASCADE;
-- DROP TABLE IF EXISTS public.product_links CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.sellers CASCADE;
-- DROP TABLE IF EXISTS public.otp_send_attempts CASCADE;
-- DROP TABLE IF EXISTS public.platform_config CASCADE;

-- 2. CREATE TABLES

-- SELLERS
CREATE TABLE IF NOT EXISTS public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  phone text NOT NULL,
  business_name text,
  upi_id text, -- New field for Manual UPI
  tier text NOT NULL DEFAULT 'pro' CHECK (tier IN ('basic', 'pro')),
  
  -- Legacy / SmartCollect Fields (kept for compatibility)
  bank_account_number text,
  bank_ifsc text,
  bank_holder_name text,
  is_bank_verified boolean NOT NULL DEFAULT false,
  pickup_address jsonb, -- { line1, city, state, pincode }
  
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price integer NOT NULL, -- in paise (e.g. 10000 = ₹100.00)
  stock integer NOT NULL DEFAULT 0,
  images jsonb, -- array of urls
  variants jsonb, -- { size: "M", color: "red" }
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- PRODUCT LINKS
CREATE TABLE IF NOT EXISTS public.product_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  short_code text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_links ENABLE ROW LEVEL SECURITY;

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  product_link_id uuid REFERENCES public.product_links (id) ON DELETE SET NULL,
  
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_address jsonb,
  
  amount integer NOT NULL, -- in paise
  quantity integer NOT NULL DEFAULT 1,
  
  payment_method text NOT NULL DEFAULT 'manual_upi', -- Changed default for MVP
  payment_status text DEFAULT 'pending', -- pending, awaiting_approval, paid, failed, refunded
  order_status text DEFAULT 'pending', -- pending, shipped, delivered, cancelled
  
  screenshot_url text, -- For manual UPI proof
  payment_note text,   -- Optional seller note
  
  delivery_status text,
  razorpay_order_id text, -- Legacy
  virtual_vpa text,       -- Legacy
  
  seller_approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- VIRTUAL ACCOUNTS (Legacy SmartCollect)
CREATE TABLE IF NOT EXISTS public.virtual_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_va_id text NOT NULL,
  vpa_address text NOT NULL,
  order_id uuid REFERENCES public.orders (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

-- WALLET TRANSACTIONS (Legacy)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount integer NOT NULL,
  balance_type text NOT NULL CHECK (balance_type IN ('pending', 'available')),
  description text,
  razorpay_payout_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- PAYOUTS (Legacy)
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  amount integer NOT NULL,
  razorpay_payout_id text,
  status text NOT NULL DEFAULT 'processing',
  utr_number text,
  processed_at timestamptz
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- OTP RATE LIMITING (Auth)
CREATE TABLE IF NOT EXISTS public.otp_send_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- PLATFORM CONFIG
CREATE TABLE IF NOT EXISTS public.platform_config (
  id boolean PRIMARY KEY DEFAULT TRUE,
  razorpay_merchant_id text,
  nodal_account_number text,
  commission_percent numeric NOT NULL DEFAULT 5.0,
  constraint platform_config_singleton check (id)
);

-- 3. STORAGE
-- Create 'products' bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- 1. Everyone can view images
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'products');

-- 2. Authenticated users (sellers/buyers) can upload
-- Note: Ideally we split buckets, but for MVP one bucket is fine.
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

-- 3. Owners can delete
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND auth.uid() = owner);


-- 4. RLS POLICIES

-- Sellers
DROP POLICY IF EXISTS "Users can view own seller profile" ON public.sellers;
CREATE POLICY "Users can view own seller profile" ON public.sellers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own seller profile" ON public.sellers;
CREATE POLICY "Users can update own seller profile" ON public.sellers FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own seller profile" ON public.sellers;
CREATE POLICY "Users can insert own seller profile" ON public.sellers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products
DROP POLICY IF EXISTS "Sellers can view own products" ON public.products;
CREATE POLICY "Sellers can view own products" ON public.products FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.sellers WHERE id = seller_id));

DROP POLICY IF EXISTS "Everyone can view active products" ON public.products;
CREATE POLICY "Everyone can view active products" ON public.products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Sellers can manage own products" ON public.products;
CREATE POLICY "Sellers can manage own products" ON public.products FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sellers WHERE id = seller_id));

-- Product Links
DROP POLICY IF EXISTS "Sellers can view own links" ON public.product_links;
CREATE POLICY "Sellers can view own links" ON public.product_links FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.sellers WHERE id = seller_id));

DROP POLICY IF EXISTS "Public can view active links" ON public.product_links;
CREATE POLICY "Public can view active links" ON public.product_links FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Sellers can manage links" ON public.product_links;
CREATE POLICY "Sellers can manage links" ON public.product_links FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sellers WHERE id = seller_id));

-- Orders
DROP POLICY IF EXISTS "Sellers can view own orders" ON public.orders;
CREATE POLICY "Sellers can view own orders" ON public.orders FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.sellers WHERE id = seller_id));

DROP POLICY IF EXISTS "Public (Buyers) can create orders" ON public.orders;
CREATE POLICY "Public (Buyers) can create orders" ON public.orders FOR INSERT WITH CHECK (true);
-- Note: We might want buyers to view their OWN orders if they have a session, but typically they are anonymous, effectively.
-- The current public page uses a server-side read which bypasses RLS (Service Role), so that is fine.

-- 5. UPGRADE EXISTING TABLES (Safe Migration)
-- If the tables already exist, ensure the new columns are present.

DO $$ 
BEGIN
  -- Sellers: upi_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='upi_id') THEN
    ALTER TABLE public.sellers ADD COLUMN upi_id text;
  END IF;

  -- Orders: screenshot_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='screenshot_url') THEN
    ALTER TABLE public.orders ADD COLUMN screenshot_url text;
  END IF;

  -- Orders: payment_note
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_note') THEN
    ALTER TABLE public.orders ADD COLUMN payment_note text;
  END IF;
END $$;

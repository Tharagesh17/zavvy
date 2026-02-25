-- ============================================
-- ZAVVY SUPABASE SETUP (COMPLETE MVP + SHIPROCKET)
-- ============================================
-- Run this entire script in the Supabase SQL Editor.
-- It is designed to be idempotent (safe to run multiple times).

-- 1. CLEANUP (Uncomment to RESET database - USE WITH CAUTION!)
-- DROP TABLE IF EXISTS public.payouts CASCADE;
-- DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
-- DROP TABLE IF EXISTS public.virtual_accounts CASCADE;
-- DROP TABLE IF EXISTS public.orders CASCADE;
-- DROP TABLE IF EXISTS public.product_links CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.sellers CASCADE;
-- DROP TABLE IF EXISTS public.otp_send_attempts CASCADE;
-- DROP TABLE IF EXISTS public.platform_config CASCADE;

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- SELLERS
CREATE TABLE IF NOT EXISTS public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  phone text NOT NULL,
  business_name text,
  upi_id text,
  tier text NOT NULL DEFAULT 'pro' CHECK (tier IN ('basic', 'pro')),
  
  -- Bank Details (Legacy)
  bank_account_number text,
  bank_ifsc text,
  bank_holder_name text,
  is_bank_verified boolean NOT NULL DEFAULT false,
  pickup_address jsonb, -- { line1, city, state, pincode }
  
  -- COD Feature
  cod_enabled boolean NOT NULL DEFAULT false,
  
  -- Shiprocket Integration
  shiprocket_token text,
  shiprocket_token_expires_at timestamptz,
  shiprocket_email text,
  
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
  
  payment_method text NOT NULL DEFAULT 'manual_upi',
  payment_status text DEFAULT 'pending', -- pending, awaiting_approval, paid, failed, refunded
  order_status text DEFAULT 'pending', -- pending, shipped, delivered, cancelled
  
  screenshot_url text,
  payment_note text,
  
  -- COD Feature
  cod_status text CHECK (cod_status IN ('pending_approval', 'approved', 'rejected')),
  
  -- Shiprocket Integration
  shipment_id text,
  awb_code text,
  tracking_status text,
  tracking_url text,
  courier_name text,
  estimated_delivery_date timestamptz,
  
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

-- ============================================
-- 3. STORAGE BUCKETS & POLICIES
-- ============================================

-- Create 'products' bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND auth.uid() = owner);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

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

-- ============================================
-- 5. PERFORMANCE INDEXES
-- ============================================

-- Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_links_product_id ON public.product_links(product_id);
CREATE INDEX IF NOT EXISTS idx_product_links_seller_id ON public.product_links(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);

-- Frequently Filtered Columns
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_links_is_active ON public.product_links(is_active);
CREATE INDEX IF NOT EXISTS idx_product_links_short_code ON public.product_links(short_code);

-- Composite Indexes for Dashboard
CREATE INDEX IF NOT EXISTS idx_orders_seller_created_at ON public.orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_seller_created_at ON public.products(seller_id, created_at DESC);

-- COD Feature Indexes
CREATE INDEX IF NOT EXISTS idx_orders_cod_status ON public.orders(cod_status);

-- Shiprocket Indexes
CREATE INDEX IF NOT EXISTS idx_orders_awb_code ON public.orders(awb_code);
CREATE INDEX IF NOT EXISTS idx_orders_shipment_id ON public.orders(shipment_id);

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Atomic Click Counter
CREATE OR REPLACE FUNCTION increment_link_clicks(link_short_code text)
RETURNS void AS $$
BEGIN
  UPDATE public.product_links
  SET clicks = clicks + 1
  WHERE short_code = link_short_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. SAFE COLUMN ADDITIONS (Idempotent)
-- ============================================

DO $$ 
BEGIN
  -- Sellers: upi_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='upi_id') THEN
    ALTER TABLE public.sellers ADD COLUMN upi_id text;
  END IF;

  -- Sellers: cod_enabled
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='cod_enabled') THEN
    ALTER TABLE public.sellers ADD COLUMN cod_enabled boolean NOT NULL DEFAULT false;
  END IF;

  -- Sellers: Shiprocket fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='shiprocket_token') THEN
    ALTER TABLE public.sellers ADD COLUMN shiprocket_token text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='shiprocket_token_expires_at') THEN
    ALTER TABLE public.sellers ADD COLUMN shiprocket_token_expires_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='shiprocket_email') THEN
    ALTER TABLE public.sellers ADD COLUMN shiprocket_email text;
  END IF;

  -- Orders: screenshot_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='screenshot_url') THEN
    ALTER TABLE public.orders ADD COLUMN screenshot_url text;
  END IF;

  -- Orders: payment_note
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_note') THEN
    ALTER TABLE public.orders ADD COLUMN payment_note text;
  END IF;

  -- Orders: cod_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='cod_status') THEN
    ALTER TABLE public.orders ADD COLUMN cod_status text CHECK (cod_status IN ('pending_approval', 'approved', 'rejected'));
  END IF;

  -- Orders: Shiprocket fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipment_id') THEN
    ALTER TABLE public.orders ADD COLUMN shipment_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='awb_code') THEN
    ALTER TABLE public.orders ADD COLUMN awb_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_status') THEN
    ALTER TABLE public.orders ADD COLUMN tracking_status text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_url') THEN
    ALTER TABLE public.orders ADD COLUMN tracking_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='courier_name') THEN
    ALTER TABLE public.orders ADD COLUMN courier_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='estimated_delivery_date') THEN
    ALTER TABLE public.orders ADD COLUMN estimated_delivery_date timestamptz;
  END IF;
END $$;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- All tables, indexes, policies, and Shiprocket integration are ready.
-- Next steps:
-- 1. Connect Shiprocket account in /dashboard/settings
-- 2. Test shipment creation
-- 3. Deploy to production

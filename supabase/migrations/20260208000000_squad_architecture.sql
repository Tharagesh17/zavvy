-- ============================================
-- ZAVVY MULTI-TIER SYSTEM - COMPLETE MIGRATION
-- ============================================
-- Run this entire script in the Supabase SQL Editor.
-- It is designed to be idempotent (safe to run multiple times).

-- 0. CLEANUP (Uncomment to RESET database - USE WITH CAUTION!)
-- DROP TABLE IF EXISTS public.shipments CASCADE;
-- DROP TABLE IF EXISTS public.payments CASCADE;
-- DROP TABLE IF EXISTS public.seller_keys CASCADE;
-- DROP TYPE IF EXISTS payment_tier CASCADE;
-- DROP TYPE IF EXISTS payment_method CASCADE;
-- DROP TYPE IF EXISTS shipment_status CASCADE;
-- DROP TYPE IF EXISTS payment_status_detailed CASCADE;

-- ============================================
-- 1. ENUM TYPES
-- ============================================
DO $$ BEGIN
    CREATE TYPE payment_tier AS ENUM ('free', 'pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('upi_manual', 'razorpay', 'cod');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shipment_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_detailed AS ENUM ('pending', 'needs_review', 'verified', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. CORE TABLES (Sellers, Products, Orders)
-- ============================================

-- SELLERS (Enhanced)
CREATE TABLE IF NOT EXISTS public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  phone text NOT NULL,
  business_name text,
  tier payment_tier NOT NULL DEFAULT 'free',
  
  -- Bank/UPI Details
  upi_id text,
  bank_account_number text,
  bank_ifsc text,
  bank_holder_name text,
  
  -- Feature Flags
  cod_enabled boolean NOT NULL DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price integer NOT NULL, -- in paise
  stock integer NOT NULL DEFAULT 0,
  images jsonb, 
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ORDERS (Enhanced for Squad Architecture)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_address jsonb,
  
  amount integer NOT NULL, -- in paise
  quantity integer NOT NULL DEFAULT 1,
  
  -- Squad Fields
  tier payment_tier DEFAULT 'free',
  payment_method payment_method DEFAULT 'upi_manual',
  payment_status payment_status_detailed DEFAULT 'pending',
  shipping_status shipment_status DEFAULT 'pending',
  
  payment_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. SQUAD TABLES (Payments, Shipments, Security)
-- ============================================

-- PAYMENTS (Verification Evidence)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES sellers(id),
    amount DECIMAL(10, 2) NOT NULL,
    method payment_method NOT NULL,
    status payment_status_detailed DEFAULT 'pending',
    
    -- For Razorpay
    transaction_id TEXT, 
    razorpay_order_id TEXT,
    razorpay_signature TEXT,
    
    -- For Manual UPI
    screenshot_url TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- SHIPMENTS (Logistics Squad)
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES sellers(id),
    
    -- Shiprocket Details
    shiprocket_order_id TEXT,
    shiprocket_shipment_id TEXT,
    tracking_code TEXT,
    courier_name TEXT,
    label_url TEXT,
    manifest_url TEXT,
    
    is_cod BOOLEAN DEFAULT false,
    pickup_scheduled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- SELLER KEYS (Security Squad - Encrypted)
CREATE TABLE IF NOT EXISTS public.seller_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE UNIQUE,
    
    -- Encrypted fields (iv:tag:content HEX strings)
    encrypted_shiprocket_email TEXT,
    encrypted_shiprocket_password TEXT,
    encrypted_razorpay_key_id TEXT,
    encrypted_razorpay_key_secret TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.seller_keys ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Sellers
DROP POLICY IF EXISTS "Sellers view own profile" ON sellers;
CREATE POLICY "Sellers view own profile" ON sellers FOR SELECT USING (auth.uid() = user_id);

-- Products
DROP POLICY IF EXISTS "Public view active products" ON products;
CREATE POLICY "Public view active products" ON products FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Sellers manage own products" ON products;
CREATE POLICY "Sellers manage own products" ON products FOR ALL USING (auth.uid() = (SELECT user_id FROM sellers WHERE id = seller_id));

-- Orders
DROP POLICY IF EXISTS "Public create orders" ON orders;
CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Sellers view own orders" ON orders;
CREATE POLICY "Sellers view own orders" ON orders FOR SELECT USING (auth.uid() = (SELECT user_id FROM sellers WHERE id = seller_id));
DROP POLICY IF EXISTS "Sellers update own orders" ON orders;
CREATE POLICY "Sellers update own orders" ON orders FOR UPDATE USING (auth.uid() = (SELECT user_id FROM sellers WHERE id = seller_id));

-- Payments
DROP POLICY IF EXISTS "Sellers view payments" ON payments;
CREATE POLICY "Sellers view payments" ON payments FOR SELECT USING (seller_id = (SELECT id FROM sellers WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Public create payments" ON payments;
CREATE POLICY "Public create payments" ON payments FOR INSERT WITH CHECK (true);

-- Shipments
DROP POLICY IF EXISTS "Sellers view shipments" ON shipments;
CREATE POLICY "Sellers view shipments" ON shipments FOR SELECT USING (seller_id = (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Seller Keys (STRICT)
DROP POLICY IF EXISTS "Sellers manage own keys" ON seller_keys;
CREATE POLICY "Sellers manage own keys" ON seller_keys FOR ALL USING (seller_id = (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- ============================================
-- 5. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders(seller_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);

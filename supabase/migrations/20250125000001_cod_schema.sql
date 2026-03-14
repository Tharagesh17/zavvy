-- COD FEATURE SCHEMA UPDATE
-- Run this script in the Supabase SQL Editor.

-- 1. ADD 'cod_enabled' TO SELLERS
-- This allows sellers to toggle COD on/off. Default is OFF for safety.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='cod_enabled') THEN
        ALTER TABLE public.sellers ADD COLUMN cod_enabled boolean NOT NULL DEFAULT false;
    END IF;
END $$;

-- 2. ADD 'cod_status' TO ORDERS
-- This tracks the approval lifecycle of a COD order.
-- Values: 'pending_approval', 'approved', 'rejected'
-- For non-COD orders, this field will remain NULL.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='cod_status') THEN
        ALTER TABLE public.orders ADD COLUMN cod_status text CHECK (cod_status IN ('pending_approval', 'approved', 'rejected'));
    END IF;
END $$;

-- 3. ADD INDEX FOR DASHBOARD PERFORMANCE
-- Sellers will frequently filter for 'pending_approval' orders.
CREATE INDEX IF NOT EXISTS idx_orders_cod_status ON public.orders(cod_status);

-- 4. UPDATE RLS POLICIES (Optional but recommended sanity check)
-- Ensure sellers can update the new status fields.
-- The existing policy "Sellers can manage own orders" (likely "view own orders" + update logic?) 
-- Checking existing policies...
-- In SUPABASE_SETUP.sql, we have:
-- CREATE POLICY "Sellers can view own orders" ...
-- We need to ensure sellers can UPDATE these specific fields if we are being strict, 
-- but usually "Sellers can manage own orders" or specific UPDATE policies cover it.
-- For now, relying on existing RLS or Service Role execution for status updates 
-- (as most status updates happen via server actions using service role).

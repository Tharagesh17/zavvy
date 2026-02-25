-- supabase/migrations/20260223000000_orders_shipping_details.sql

-- Add awb_number and courier_name to the orders table
-- This allows sellers to track shipments, and buyers to see tracking info

ALTER TABLE "public"."orders" 
ADD COLUMN IF NOT EXISTS "awb_number" text,
ADD COLUMN IF NOT EXISTS "courier_name" text;

-- Add index on awb_number for faster lookup if tracking endpoints are added in the future
CREATE INDEX IF NOT EXISTS "idx_orders_awb_number" ON "public"."orders"("awb_number");

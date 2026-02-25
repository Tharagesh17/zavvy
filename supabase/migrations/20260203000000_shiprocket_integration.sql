-- Shiprocket Integration Migration
-- Adds fields for Shiprocket token storage and shipment tracking

-- Add Shiprocket fields to sellers table
ALTER TABLE public.sellers 
  ADD COLUMN IF NOT EXISTS shiprocket_token text,
  ADD COLUMN IF NOT EXISTS shiprocket_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS shiprocket_email text;

-- Add Shiprocket fields to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipment_id text,
  ADD COLUMN IF NOT EXISTS awb_code text,
  ADD COLUMN IF NOT EXISTS tracking_status text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS estimated_delivery_date timestamptz;

-- Index for tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_awb_code ON public.orders(awb_code);
CREATE INDEX IF NOT EXISTS idx_orders_shipment_id ON public.orders(shipment_id);

-- Comments for documentation
COMMENT ON COLUMN sellers.shiprocket_token IS 'Encrypted Shiprocket auth token (10-day expiry)';
COMMENT ON COLUMN sellers.shiprocket_token_expires_at IS 'Token expiry timestamp';
COMMENT ON COLUMN sellers.shiprocket_email IS 'Shiprocket account email for re-authentication';
COMMENT ON COLUMN orders.awb_code IS 'Air Waybill tracking number from Shiprocket';
COMMENT ON COLUMN orders.shipment_id IS 'Shiprocket shipment ID';
COMMENT ON COLUMN orders.tracking_status IS 'Current delivery status from Shiprocket';
COMMENT ON COLUMN orders.tracking_url IS 'Public tracking URL';
COMMENT ON COLUMN orders.courier_name IS 'Delivery partner name (e.g., Delhivery, BlueDart)';

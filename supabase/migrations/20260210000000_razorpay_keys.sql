-- Add Razorpay key columns to sellers table
-- These will store ENCRYPTED values (managed by application layer)

ALTER TABLE public.sellers 
  ADD COLUMN IF NOT EXISTS razorpay_key_id text,
  ADD COLUMN IF NOT EXISTS razorpay_key_secret text;

-- Add comments for documentation
COMMENT ON COLUMN sellers.razorpay_key_id IS 'Encrypted Razorpay Key ID';
COMMENT ON COLUMN sellers.razorpay_key_secret IS 'Encrypted Razorpay Key Secret';

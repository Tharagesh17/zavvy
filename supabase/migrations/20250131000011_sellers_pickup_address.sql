-- Add pickup_address to sellers (for onboarding)
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS pickup_address jsonb;

COMMENT ON COLUMN public.sellers.pickup_address IS 'Pickup address: { line1, city, state, pincode }';

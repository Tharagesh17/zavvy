-- SmartCollect: remove personal_upi, default tier to pro
ALTER TABLE public.sellers DROP COLUMN IF EXISTS personal_upi;
ALTER TABLE public.sellers ALTER COLUMN tier SET DEFAULT 'pro';

COMMENT ON TABLE public.sellers IS 'Seller accounts; SmartCollect only, tier=pro';

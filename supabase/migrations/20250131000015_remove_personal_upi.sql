-- Remove personal_upi as we are moving to SmartCollect only model
ALTER TABLE public.sellers DROP COLUMN IF EXISTS personal_upi;

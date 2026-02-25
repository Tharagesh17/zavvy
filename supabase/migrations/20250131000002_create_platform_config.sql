-- Platform config singleton (PLATFORM-NODAL)
CREATE TABLE public.platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_merchant_id text,
  nodal_account_number text,
  commission_percent numeric(5, 2) NOT NULL DEFAULT 5,
  CONSTRAINT platform_config_singleton CHECK (true)
);

-- Ensure only one row (enforce in app or trigger)
CREATE UNIQUE INDEX platform_config_singleton_idx ON public.platform_config ((true));

COMMENT ON TABLE public.platform_config IS 'Single row: platform Razorpay and nodal config';

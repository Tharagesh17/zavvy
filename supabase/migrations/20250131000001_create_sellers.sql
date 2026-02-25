-- Sellers table (PLATFORM-NODAL)
-- user_id links to auth.users for RLS; one user = one seller
CREATE TABLE public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  phone text NOT NULL,
  business_name text,
  tier text NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'pro')),
  bank_account_number text, -- encrypted at application layer
  bank_ifsc text,
  bank_holder_name text,
  is_bank_verified boolean NOT NULL DEFAULT false,
  personal_upi text, -- for tier basic (tier 1)
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sellers IS 'Seller accounts; user_id links to Supabase Auth for RLS';
COMMENT ON COLUMN public.sellers.bank_account_number IS 'Encrypt before storing; decrypt in app';

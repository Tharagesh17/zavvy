-- Payouts (RazorpayX payouts to seller bank) (PLATFORM-NODAL)
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  amount integer NOT NULL, -- in smallest unit (e.g. paise)
  razorpay_payout_id text,
  status text,
  utr_number text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payouts_seller_id ON public.payouts (seller_id);
CREATE INDEX idx_payouts_status ON public.payouts (status);

COMMENT ON TABLE public.payouts IS 'Payouts to seller bank via RazorpayX';

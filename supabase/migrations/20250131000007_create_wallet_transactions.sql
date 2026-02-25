-- Wallet transactions (seller wallet ledger) (PLATFORM-NODAL)
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount integer NOT NULL, -- in smallest unit (e.g. paise)
  balance_type text NOT NULL CHECK (balance_type IN ('pending', 'available')),
  description text,
  razorpay_payout_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_transactions_seller_id ON public.wallet_transactions (seller_id);
CREATE INDEX idx_wallet_transactions_order_id ON public.wallet_transactions (order_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions (created_at);

COMMENT ON TABLE public.wallet_transactions IS 'Seller wallet ledger (pending/available)';

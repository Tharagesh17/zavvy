-- Virtual accounts (Razorpay VA per order for Smart Collect) (PLATFORM-NODAL)
CREATE TABLE public.virtual_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_va_id text NOT NULL,
  vpa_address text NOT NULL,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX idx_virtual_accounts_order_id ON public.virtual_accounts (order_id);
CREATE INDEX idx_virtual_accounts_status ON public.virtual_accounts (status);

COMMENT ON TABLE public.virtual_accounts IS 'One VA per order for Smart Collect payments';

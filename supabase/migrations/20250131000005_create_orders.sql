-- Orders table (PLATFORM-NODAL)
-- virtual_account_id and wallet_transaction_id added in later migration (circular FKs)
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  product_link_id uuid REFERENCES public.product_links (id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_address jsonb,
  amount integer NOT NULL, -- in smallest unit (e.g. paise)
  quantity integer NOT NULL DEFAULT 1,
  payment_method text NOT NULL CHECK (payment_method IN ('direct_upi', 'smart_collect')),
  payment_status text,
  order_status text,
  delivery_status text,
  razorpay_order_id text,
  virtual_vpa text, -- denormalized from virtual_accounts for display
  screenshot_url text, -- for tier 1 (direct UPI)
  seller_approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_seller_id ON public.orders (seller_id);
CREATE INDEX idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX idx_orders_created_at ON public.orders (created_at);

COMMENT ON TABLE public.orders IS 'Orders; virtual_account_id and wallet_transaction_id added after VA/wallet tables';

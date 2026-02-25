-- RLS: Sellers can only access their own rows
-- Helper: current seller id from auth.uid()
CREATE OR REPLACE FUNCTION public.current_seller_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.sellers WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Enable RLS on all tables
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Sellers: own row only (match by user_id)
CREATE POLICY "Sellers can read own row"
  ON public.sellers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Sellers can update own row"
  ON public.sellers FOR UPDATE
  USING (user_id = auth.uid());

-- Insert: typically done in signup flow (service role or trigger); allow authenticated to insert own
CREATE POLICY "Users can insert own seller row"
  ON public.sellers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Products: own seller_id only
CREATE POLICY "Sellers can manage own products"
  ON public.products
  FOR ALL
  USING (seller_id = public.current_seller_id())
  WITH CHECK (seller_id = public.current_seller_id());

-- Product links: own seller_id only
CREATE POLICY "Sellers can manage own product_links"
  ON public.product_links
  FOR ALL
  USING (seller_id = public.current_seller_id())
  WITH CHECK (seller_id = public.current_seller_id());

-- Orders: own seller_id only
CREATE POLICY "Sellers can manage own orders"
  ON public.orders
  FOR ALL
  USING (seller_id = public.current_seller_id())
  WITH CHECK (seller_id = public.current_seller_id());

-- Virtual accounts: access via order belonging to seller
CREATE POLICY "Sellers can view own virtual_accounts"
  ON public.virtual_accounts FOR SELECT
  USING (
    order_id IN (SELECT id FROM public.orders WHERE seller_id = public.current_seller_id())
  );

CREATE POLICY "Sellers can insert virtual_accounts for own orders"
  ON public.virtual_accounts FOR INSERT
  WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE seller_id = public.current_seller_id())
  );

CREATE POLICY "Sellers can update own virtual_accounts"
  ON public.virtual_accounts FOR UPDATE
  USING (
    order_id IN (SELECT id FROM public.orders WHERE seller_id = public.current_seller_id())
  );

-- Wallet transactions: own seller_id only
CREATE POLICY "Sellers can view own wallet_transactions"
  ON public.wallet_transactions FOR SELECT
  USING (seller_id = public.current_seller_id());

-- Insert/Update wallet_transactions usually done by backend; allow seller for consistency
CREATE POLICY "Sellers can insert own wallet_transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (seller_id = public.current_seller_id());

-- Payouts: own seller_id only (read-only for sellers; create via backend)
CREATE POLICY "Sellers can view own payouts"
  ON public.payouts FOR SELECT
  USING (seller_id = public.current_seller_id());

-- Platform config: read-only for authenticated (sellers need commission etc.); write via service role only
CREATE POLICY "Authenticated can read platform_config"
  ON public.platform_config FOR SELECT
  TO authenticated
  USING (true);

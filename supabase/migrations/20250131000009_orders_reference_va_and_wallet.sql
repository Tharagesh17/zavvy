-- Add FKs from orders to virtual_accounts and wallet_transactions (break circular dependency)
ALTER TABLE public.orders
  ADD COLUMN virtual_account_id uuid REFERENCES public.virtual_accounts (id) ON DELETE SET NULL,
  ADD COLUMN wallet_transaction_id uuid REFERENCES public.wallet_transactions (id) ON DELETE SET NULL;

CREATE INDEX idx_orders_virtual_account_id ON public.orders (virtual_account_id);
CREATE INDEX idx_orders_wallet_transaction_id ON public.orders (wallet_transaction_id);

-- Products table (PLATFORM-NODAL)
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price integer NOT NULL, -- amount in smallest currency unit (e.g. paise)
  stock integer NOT NULL DEFAULT 0,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  variants jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_seller_id ON public.products (seller_id);

COMMENT ON TABLE public.products IS 'Seller product catalog';
COMMENT ON COLUMN public.products.price IS 'Amount in smallest unit (e.g. paise)';

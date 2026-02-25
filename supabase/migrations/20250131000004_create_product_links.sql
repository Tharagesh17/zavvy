-- Product links (short links for sharing) (PLATFORM-NODAL)
CREATE TABLE public.product_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  short_code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_links_seller_id ON public.product_links (seller_id);
CREATE INDEX idx_product_links_product_id ON public.product_links (product_id);
CREATE INDEX idx_product_links_short_code ON public.product_links (short_code);

COMMENT ON TABLE public.product_links IS 'Short links per product for sharing';

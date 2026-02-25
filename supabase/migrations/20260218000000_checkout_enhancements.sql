-- Add buyer_email and items columns to orders table

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS buyer_email text,
  ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.orders.buyer_email IS 'Optional buyer email address';
COMMENT ON COLUMN public.orders.items IS 'List of purchased items with variants and quantities. Schema: [{ variant: { Size: "M", Color: "Red" }, quantity: 1, price: 1000 }]';

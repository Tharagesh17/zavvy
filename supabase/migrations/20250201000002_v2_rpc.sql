-- V2_RPC.sql

-- RPC 1: Decrement Variant Stock Atoms
CREATE OR REPLACE FUNCTION decrement_variant_stock(v_id uuid, v_qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_count = stock_count - v_qty
  WHERE id = v_id AND stock_count >= v_qty;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for variant %', v_id;
  END IF;
  
  -- Also decrement the base product stock for backward compat
  UPDATE public.products p
  SET stock = stock - v_qty
  FROM public.product_variants pv
  WHERE pv.id = v_id AND p.id = pv.product_id;
END;
$$;

-- RPC 2: Increment Variant Stock Atoms (for Telegram [+5 Stock])
CREATE OR REPLACE FUNCTION increment_variant_stock(v_id uuid, v_qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_count = stock_count + v_qty
  WHERE id = v_id;

  -- Also increment the base product stock
  UPDATE public.products p
  SET stock = stock + v_qty
  FROM public.product_variants pv
  WHERE pv.id = v_id AND p.id = pv.product_id;
END;
$$;

-- RPC 3: Fallback generic decrement for non-variants
CREATE OR REPLACE FUNCTION decrement_stock(product_id uuid, quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - quantity
  WHERE id = product_id AND stock >= quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', product_id;
  END IF;
END;
$$;

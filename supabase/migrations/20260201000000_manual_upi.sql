-- Migration to add UPI ID to sellers and verify order screenshots
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS upi_id text;

-- Ensure orders has screenshot_url (it was listed as legacy in schema)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS screenshot_url text;

-- Add payment_comment if seller wants to leave a note
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_note text;

-- Update payment_status check if necessary (pending, paid, failed, refunded) is already there
-- We can add 'awaiting_approval' to be more precise
-- ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
-- ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'awaiting_approval', 'paid', 'failed', 'refunded'));

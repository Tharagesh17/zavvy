-- Fix for COD Order Approval: Add missing updated_at column
-- Run this in Supabase SQL Editor

-- Add updated_at column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add seller_approved_at column (also referenced in code)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS seller_approved_at TIMESTAMPTZ;

-- Create trigger to automatically update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if exists, then create new one
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows to have a value
UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL;

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('updated_at', 'seller_approved_at');

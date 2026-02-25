-- Enable pg_trgm for fuzzy text matching (OCR receipts often have typos)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add paise_tag column for unique payment identification
ALTER TABLE "public"."orders"
ADD COLUMN IF NOT EXISTS "paise_tag" smallint DEFAULT 0;

-- Ensure UTR uniqueness (fraud prevention)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_orders_utr_unique"
ON "public"."orders"("utr_number")
WHERE "utr_number" IS NOT NULL;

-- Fuzzy order matching function for OCR results
-- Matches buyer_name and product_name with similarity thresholds
CREATE OR REPLACE FUNCTION find_matching_order(
    p_seller_id uuid,
    p_buyer_name text,
    p_product_name text DEFAULT NULL
)
RETURNS TABLE (
    order_id uuid,
    buyer_name text,
    product_name text,
    name_similarity real,
    product_similarity real,
    combined_score real
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id AS order_id,
        o.buyer_name,
        p.name AS product_name,
        similarity(LOWER(o.buyer_name), LOWER(p_buyer_name)) AS name_similarity,
        CASE
            WHEN p_product_name IS NOT NULL AND p.name IS NOT NULL
            THEN similarity(LOWER(p.name), LOWER(p_product_name))
            ELSE 0.0::real
        END AS product_similarity,
        -- Combined score: buyer name weighs 60%, product name 40%
        (
            similarity(LOWER(o.buyer_name), LOWER(p_buyer_name)) * 0.6 +
            CASE
                WHEN p_product_name IS NOT NULL AND p.name IS NOT NULL
                THEN similarity(LOWER(p.name), LOWER(p_product_name)) * 0.4
                ELSE 0.0
            END
        )::real AS combined_score
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.seller_id = p_seller_id
      AND o.order_status IN ('confirmed', 'processing', 'pending')
      AND o.awb_number IS NULL
      AND similarity(LOWER(o.buyer_name), LOWER(p_buyer_name)) > 0.3
    ORDER BY combined_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

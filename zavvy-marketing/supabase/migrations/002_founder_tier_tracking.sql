-- Migration: Founder Tier Tracking for Real-Time Urgency
-- Purpose: Track Pro/Founder tier signups to display "X SPOTS LEFT" dynamically
-- Safe to run multiple times (idempotent)

-- 1. Create tracking table
CREATE TABLE IF NOT EXISTS founder_tier_tracking (
    id BIGSERIAL PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Initialize with zero count (only if table is empty)
INSERT INTO founder_tier_tracking (count)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM founder_tier_tracking);

-- 3. Function to increment founder count atomically
CREATE OR REPLACE FUNCTION increment_founder_count()
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE founder_tier_tracking
    SET count = count + 1,
        last_updated = NOW()
    WHERE id = (SELECT id FROM founder_tier_tracking ORDER BY id LIMIT 1)
    RETURNING count INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to get spots remaining (max 50)
CREATE OR REPLACE FUNCTION get_founder_spots_left()
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
    max_spots INTEGER := 50;
BEGIN
    SELECT count INTO current_count
    FROM founder_tier_tracking
    ORDER BY id LIMIT 1;
    
    RETURN GREATEST(0, max_spots - COALESCE(current_count, 0));
END;
$$ LANGUAGE plpgsql;

-- 5. Add index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_founder_tier_tracking_count 
ON founder_tier_tracking(count);

-- 6. Grant permissions (adjust role as needed)
GRANT SELECT ON founder_tier_tracking TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_founder_spots_left() TO anon, authenticated;

-- Verification queries (comment out in production)
-- SELECT * FROM founder_tier_tracking;
-- SELECT get_founder_spots_left(); -- Should return 50 initially

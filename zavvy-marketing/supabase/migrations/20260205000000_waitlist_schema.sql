-- Create waitlist table with Free/Pro tiers
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  tier_interest TEXT NOT NULL CHECK (tier_interest IN ('free', 'pro')),
  is_early_bird BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast counting
CREATE INDEX idx_waitlist_tier ON public.waitlist(tier_interest);

-- Function to count Pro users
CREATE OR REPLACE FUNCTION count_pro_users()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.waitlist WHERE tier_interest = 'pro';
$$ LANGUAGE SQL STABLE;

-- Trigger to check Pro tier cap (50 users)
CREATE OR REPLACE FUNCTION check_pro_tier_cap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tier_interest = 'pro' THEN
    IF (SELECT count_pro_users()) >= 50 THEN
      RAISE EXCEPTION 'Pro tier is sold out (50/50 spots filled)';
    END IF;
    NEW.is_early_bird := true; -- First 50 Pro users are early birds
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_pro_cap
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION check_pro_tier_cap();

-- RLS Policies
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only service_role can view waitlist"
  ON public.waitlist FOR SELECT
  USING (auth.role() = 'service_role');

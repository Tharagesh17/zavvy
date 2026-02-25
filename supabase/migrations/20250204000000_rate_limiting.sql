-- ============================================
-- ZAVVY RATE LIMITING TABLE
-- ============================================
-- Run this in Supabase SQL Editor

-- Create rate limit tracking table
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- e.g., "user:user123" or "ip:192.168.1.1"
  action text NOT NULL,     -- e.g., "otp", "login", "api"
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient cleanup and queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_identifier ON public.rate_limit_logs(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_action ON public.rate_limit_logs(action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_attempted_at ON public.rate_limit_logs(attempted_at);

-- Composite index for rate limit checks
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_identifier_action_time 
ON public.rate_limit_logs(identifier, action, attempted_at);

-- Enable RLS (admin-only access recommended)
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limit logs
DROP POLICY IF EXISTS "Service role only" ON public.rate_limit_logs;
CREATE POLICY "Service role only" ON public.rate_limit_logs
  FOR ALL USING (false); -- Block all client access

-- ============================================
-- CLEANUP FUNCTION (Run periodically)
-- ============================================
-- This function can be called via cron job to clean old entries
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limit_logs
  WHERE attempted_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

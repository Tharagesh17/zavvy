-- OTP send rate limit: 3 attempts per 5 minutes per phone
CREATE TABLE public.otp_send_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_send_attempts_phone_attempted_at
  ON public.otp_send_attempts (phone, attempted_at DESC);

-- RLS: no direct access from app users; use service role in server actions
ALTER TABLE public.otp_send_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for otp_send_attempts"
  ON public.otp_send_attempts
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.otp_send_attempts IS 'Rate limit OTP sends: 3 per 5 min per phone (server action uses service role)';

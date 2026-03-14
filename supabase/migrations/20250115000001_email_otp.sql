-- ============================================
-- EMAIL OTP AUTH MIGRATION
-- ============================================

-- 1. Create PROFILES table if it doesn't exist
-- This table tracks user-specific metadata and onboarding status.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  has_completed_onboarding boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Add has_completed_onboarding to PROFILES if table already existed but column was missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='has_completed_onboarding') THEN
    ALTER TABLE public.profiles ADD COLUMN has_completed_onboarding boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- 3. Unify Rate Limiting into otp_send_attempts
-- Ensure the table can handle email identifiers as well as phone and multiple actions
DO $$ 
BEGIN
  -- Create table if it doesn't exist at all
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='otp_send_attempts') THEN
    CREATE TABLE public.otp_send_attempts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      identifier text NOT NULL,
      action text NOT NULL DEFAULT 'otp',
      attempted_at timestamptz NOT NULL DEFAULT now()
    );
  ELSE
    -- If table exists, add new columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='otp_send_attempts' AND column_name='identifier') THEN
      -- If 'phone' exists, we can rename it or add 'identifier' and copy data
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='otp_send_attempts' AND column_name='phone') THEN
        ALTER TABLE public.otp_send_attempts RENAME COLUMN phone TO identifier;
      ELSE
        ALTER TABLE public.otp_send_attempts ADD COLUMN identifier text;
        -- If we just added it and it's null, we might need to handle existing rows
        -- but usually it's better to make it NOT NULL after potentially setting a default
        UPDATE public.otp_send_attempts SET identifier = 'legacy' WHERE identifier IS NULL;
        ALTER TABLE public.otp_send_attempts ALTER COLUMN identifier SET NOT NULL;
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='otp_send_attempts' AND column_name='action') THEN
      ALTER TABLE public.otp_send_attempts ADD COLUMN action text NOT NULL DEFAULT 'otp';
    END IF;
  END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_otp_send_attempts_identifier_action ON public.otp_send_attempts(identifier, action, attempted_at DESC);

-- Cleanup old table if it exists (optional)
-- DROP TABLE IF EXISTS public.rate_limit_logs;

-- 4. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role can manage profiles" ON public.profiles FOR ALL USING (auth.role() = 'service_role');

-- 6. Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, has_completed_onboarding)
  VALUES (new.id, new.email, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Add columns to sellers to link with profiles (optional but recommended)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='sellers') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sellers' AND column_name='profile_id') THEN
      ALTER TABLE public.sellers ADD COLUMN profile_id uuid REFERENCES public.profiles (id);
    END IF;
  END IF;
END $$;

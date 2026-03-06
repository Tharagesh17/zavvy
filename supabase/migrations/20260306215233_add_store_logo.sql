-- Migration: Add store logo URL to sellers and create storage bucket
--

-- Add logo_url to sellers table
ALTER TABLE public.sellers
ADD COLUMN logo_url text;

COMMENT ON COLUMN public.sellers.logo_url IS 'URL of the uploaded store logo';

-- Create store_logos bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('store_logos', 'store_logos', true)
ON CONFLICT (id) DO NOTHING;

-- Sellers (authenticated) can upload/update/delete in their folder; public can read
CREATE POLICY "Public read store logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store_logos');

CREATE POLICY "Authenticated upload store logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'store_logos');

CREATE POLICY "Authenticated update own store logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'store_logos');

CREATE POLICY "Authenticated delete store logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'store_logos');

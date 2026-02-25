-- Storage bucket for product images (create if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Sellers (authenticated) can upload/update/delete in their folder; public can read
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "Authenticated upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

CREATE POLICY "Authenticated update own product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products');

CREATE POLICY "Authenticated delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products');

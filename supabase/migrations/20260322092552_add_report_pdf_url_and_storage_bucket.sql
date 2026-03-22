/*
  # Add Report PDF URL to Service Orders + Storage Bucket Setup

  1. Changes
     - Adds `report_pdf_url` column to `service_orders` for storing the generated PDF link
     - Adds `report_generated_at` column to track when the PDF was generated
     - Creates storage bucket `visit-reports` for PDF storage (public read)
  
  2. Security
     - Authenticated users can upload to visit-reports bucket
     - Public read access for sharing via WhatsApp links
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'report_pdf_url'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN report_pdf_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'report_generated_at'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN report_generated_at TIMESTAMPTZ;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visit-reports',
  'visit-reports',
  true,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read visit-reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'visit-reports');

CREATE POLICY "Authenticated upload visit-reports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'visit-reports');

CREATE POLICY "Anon upload visit-reports"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'visit-reports');

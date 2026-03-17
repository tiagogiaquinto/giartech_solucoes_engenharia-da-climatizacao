/*
  # Bucket de Fotos de Funcionários

  Garante que o bucket `employee-photos` existe com política pública de leitura
  e acesso autenticado para upload/delete.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-photos',
  'employee-photos',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'employee-photos public read'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "employee-photos public read"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'employee-photos')
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'employee-photos anon insert'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "employee-photos anon insert"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'employee-photos')
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'employee-photos anon delete'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "employee-photos anon delete"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'employee-photos')
    $pol$;
  END IF;
END $$;

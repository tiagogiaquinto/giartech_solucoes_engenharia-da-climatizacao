/*
  # Storage de Fotos dos Funcionários

  1. Criação
    - Bucket 'employee-photos' para armazenar fotos
    - Políticas de acesso público para leitura
    - Políticas de upload autenticado
  
  2. Segurança
    - Qualquer um pode VER as fotos (público)
    - Apenas autenticados podem FAZER UPLOAD
    - Limite de tamanho: 5MB
    - Formatos: image/jpeg, image/png, image/webp
*/

-- Criar bucket de fotos se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-photos',
  'employee-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Permitir que qualquer um VEJA as fotos (público)
DROP POLICY IF EXISTS "Public Access to employee photos" ON storage.objects;
CREATE POLICY "Public Access to employee photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'employee-photos');

-- Permitir que qualquer usuário autenticado faça UPLOAD
DROP POLICY IF EXISTS "Authenticated users can upload employee photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload employee photos"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'employee-photos');

-- Permitir que qualquer usuário autenticado ATUALIZE suas fotos
DROP POLICY IF EXISTS "Authenticated users can update employee photos" ON storage.objects;
CREATE POLICY "Authenticated users can update employee photos"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'employee-photos')
WITH CHECK (bucket_id = 'employee-photos');

-- Permitir que qualquer usuário autenticado DELETE fotos
DROP POLICY IF EXISTS "Authenticated users can delete employee photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete employee photos"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (bucket_id = 'employee-photos');

-- Comentários
COMMENT ON COLUMN employees.photo_url IS 'URL completa da foto do funcionário armazenada no Supabase Storage bucket employee-photos';

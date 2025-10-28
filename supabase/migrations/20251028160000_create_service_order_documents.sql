/*
  # Sistema Completo de Documentos para Ordens de Serviço

  1. Nova Tabela: `service_order_documents`
    - Upload de arquivos (fotos, PDFs, etc)
    - Categorização automática
    - Vínculo com ordens de serviço
    - Metadados completos
    - Versionamento

  2. Categorias de Documentos:
    - fotos_antes: Fotos do local antes do serviço
    - fotos_durante: Fotos durante a execução
    - fotos_depois: Fotos após conclusão
    - assinaturas: Assinaturas digitais
    - contratos: Contratos assinados
    - notas_fiscais: Notas fiscais
    - laudos: Laudos técnicos
    - projetos: Projetos e plantas
    - outros: Outros documentos

  3. Segurança
    - RLS habilitado
    - Políticas de acesso
*/

-- Criar tabela de documentos de OS
CREATE TABLE IF NOT EXISTS service_order_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,

  -- Informações do arquivo
  file_name text NOT NULL,
  file_type text NOT NULL, -- mime type (image/jpeg, application/pdf, etc)
  file_size bigint NOT NULL, -- tamanho em bytes
  file_url text NOT NULL, -- URL do arquivo (Supabase Storage ou base64)

  -- Categorização
  category text NOT NULL DEFAULT 'outros',
  subcategory text,

  -- Metadados
  title text,
  description text,
  tags text[] DEFAULT ARRAY[]::text[],

  -- Informações de captura (para fotos)
  capture_location text, -- localização GPS
  capture_device text, -- dispositivo usado
  capture_metadata jsonb, -- EXIF e outros metadados

  -- Versionamento
  version integer NOT NULL DEFAULT 1,
  is_latest boolean NOT NULL DEFAULT true,
  previous_version_id uuid REFERENCES service_order_documents(id),

  -- Visibilidade e status
  is_visible_to_client boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active', -- active, archived, deleted

  -- Auditoria
  uploaded_by uuid REFERENCES employees(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Índices
  CONSTRAINT valid_category CHECK (
    category IN (
      'fotos_antes',
      'fotos_durante',
      'fotos_depois',
      'assinaturas',
      'contratos',
      'notas_fiscais',
      'laudos',
      'projetos',
      'orcamentos',
      'outros'
    )
  ),
  CONSTRAINT valid_status CHECK (status IN ('active', 'archived', 'deleted'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_service_order_documents_service_order
  ON service_order_documents(service_order_id);

CREATE INDEX IF NOT EXISTS idx_service_order_documents_category
  ON service_order_documents(category);

CREATE INDEX IF NOT EXISTS idx_service_order_documents_uploaded_at
  ON service_order_documents(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_order_documents_status
  ON service_order_documents(status)
  WHERE status = 'active';

-- Índice para busca full-text
CREATE INDEX IF NOT EXISTS idx_service_order_documents_search
  ON service_order_documents
  USING gin(to_tsvector('portuguese',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(file_name, '')
  ));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_service_order_documents_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER service_order_documents_updated_at
  BEFORE UPDATE ON service_order_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_documents_updated_at();

-- Função para contar documentos por categoria
CREATE OR REPLACE FUNCTION get_service_order_documents_count(p_service_order_id uuid)
RETURNS TABLE (
  category text,
  count bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    category,
    COUNT(*) as count
  FROM service_order_documents
  WHERE service_order_id = p_service_order_id
    AND status = 'active'
  GROUP BY category
  ORDER BY category;
$$;

-- Função para obter últimos documentos
CREATE OR REPLACE FUNCTION get_recent_service_order_documents(
  p_service_order_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_type text,
  file_url text,
  category text,
  title text,
  uploaded_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    id,
    file_name,
    file_type,
    file_url,
    category,
    title,
    uploaded_at
  FROM service_order_documents
  WHERE service_order_id = p_service_order_id
    AND status = 'active'
  ORDER BY uploaded_at DESC
  LIMIT p_limit;
$$;

-- View para estatísticas de documentos
CREATE OR REPLACE VIEW v_service_order_documents_stats AS
SELECT
  so.id as service_order_id,
  so.order_number,
  COUNT(DISTINCT sod.id) as total_documents,
  COUNT(DISTINCT sod.id) FILTER (WHERE sod.category = 'fotos_antes') as fotos_antes_count,
  COUNT(DISTINCT sod.id) FILTER (WHERE sod.category = 'fotos_durante') as fotos_durante_count,
  COUNT(DISTINCT sod.id) FILTER (WHERE sod.category = 'fotos_depois') as fotos_depois_count,
  COUNT(DISTINCT sod.id) FILTER (WHERE sod.category = 'assinaturas') as assinaturas_count,
  COUNT(DISTINCT sod.id) FILTER (WHERE sod.category = 'contratos') as contratos_count,
  COUNT(DISTINCT sod.id) FILTER (WHERE sod.category = 'notas_fiscais') as notas_fiscais_count,
  SUM(sod.file_size) as total_size_bytes,
  MAX(sod.uploaded_at) as last_upload_at
FROM service_orders so
LEFT JOIN service_order_documents sod ON so.id = sod.service_order_id
  AND sod.status = 'active'
GROUP BY so.id, so.order_number;

-- RLS Policies
ALTER TABLE service_order_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler documentos ativos
CREATE POLICY "Allow read service_order_documents"
  ON service_order_documents
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Policy: Todos podem inserir documentos
CREATE POLICY "Allow insert service_order_documents"
  ON service_order_documents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Todos podem atualizar documentos
CREATE POLICY "Allow update service_order_documents"
  ON service_order_documents
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Todos podem deletar (soft delete via status)
CREATE POLICY "Allow delete service_order_documents"
  ON service_order_documents
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Comentários
COMMENT ON TABLE service_order_documents IS 'Documentos e arquivos anexados às ordens de serviço';
COMMENT ON COLUMN service_order_documents.category IS 'Categoria do documento: fotos_antes, fotos_durante, fotos_depois, assinaturas, contratos, notas_fiscais, laudos, projetos, outros';
COMMENT ON COLUMN service_order_documents.file_url IS 'URL do arquivo ou dados em base64';
COMMENT ON COLUMN service_order_documents.is_visible_to_client IS 'Se o documento é visível para o cliente';
COMMENT ON COLUMN service_order_documents.capture_metadata IS 'Metadados EXIF e outras informações de captura';

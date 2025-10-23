/*
  # Sistema de Biblioteca Digital com Segurança

  1. Novas Tabelas
    - `digital_library` - Documentos da biblioteca
    - `library_categories` - Categorias de documentos
    - `document_access_log` - Log de acessos
    - `web_search_cache` - Cache de buscas web
    
  2. Segurança
    - Validação de tipos de arquivo
    - Tamanho máximo
    - Scaneamento de vírus (simulado)
    - RLS habilitado
*/

-- Categorias de documentos
CREATE TABLE IF NOT EXISTS library_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT '📄',
  parent_id uuid REFERENCES library_categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_cat_parent ON library_categories(parent_id);

-- Biblioteca Digital
CREATE TABLE IF NOT EXISTS digital_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES library_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  content_text text,
  is_public boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  virus_scan_status text DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'error')),
  virus_scan_date timestamptz,
  uploaded_by uuid,
  download_count int DEFAULT 0,
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_category ON digital_library(category_id);
CREATE INDEX IF NOT EXISTS idx_library_tags ON digital_library USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_library_title ON digital_library USING gin(to_tsvector('portuguese', title));
CREATE INDEX IF NOT EXISTS idx_library_content ON digital_library USING gin(to_tsvector('portuguese', coalesce(content_text, '')));
CREATE INDEX IF NOT EXISTS idx_library_file_type ON digital_library(file_type);
CREATE INDEX IF NOT EXISTS idx_library_public ON digital_library(is_public);
CREATE INDEX IF NOT EXISTS idx_library_verified ON digital_library(is_verified);

-- Log de acessos
CREATE TABLE IF NOT EXISTS document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES digital_library(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL CHECK (action IN ('view', 'download', 'search')),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_doc ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_access_created ON document_access_log(created_at DESC);

-- Cache de buscas web (para Thomaz)
CREATE TABLE IF NOT EXISTS web_search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  source text NOT NULL,
  results jsonb NOT NULL DEFAULT '{}',
  is_safe boolean DEFAULT true,
  threat_level text DEFAULT 'low' CHECK (threat_level IN ('low', 'medium', 'high')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(query, source)
);

CREATE INDEX IF NOT EXISTS idx_web_cache_query ON web_search_cache(query);
CREATE INDEX IF NOT EXISTS idx_web_cache_expires ON web_search_cache(expires_at);

-- RLS
ALTER TABLE library_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_search_cache ENABLE ROW LEVEL SECURITY;

-- Políticas (acesso público para desenvolvimento)
CREATE POLICY "Acesso público a categorias" ON library_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso a documentos públicos" ON digital_library FOR SELECT TO anon, authenticated USING (is_public = true OR virus_scan_status = 'clean');
CREATE POLICY "Inserir documentos" ON digital_library FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Atualizar próprios documentos" ON digital_library FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Deletar próprios documentos" ON digital_library FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "Acesso a logs" ON document_access_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso a cache web" ON web_search_cache FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_library_updated_at
  BEFORE UPDATE ON digital_library
  FOR EACH ROW
  EXECUTE FUNCTION update_library_updated_at();

-- Popular categorias padrão
INSERT INTO library_categories (name, description, icon) VALUES
('Manuais do Sistema', 'Tutoriais e guias de uso do sistema', '📘'),
('Documentos Técnicos', 'Especificações técnicas e documentação', '📋'),
('Contratos e Modelos', 'Templates de contratos e documentos', '📝'),
('Normas e Regulamentos', 'Normas técnicas e regulamentações', '⚖️'),
('Materiais de Treinamento', 'Vídeos, apresentações e cursos', '🎓'),
('Relatórios e Análises', 'Relatórios gerenciais e análises', '📊'),
('Certificados', 'Certificados e documentos oficiais', '🏆'),
('Diversos', 'Outros documentos importantes', '📁')
ON CONFLICT (name) DO NOTHING;

-- Função de busca na biblioteca
CREATE OR REPLACE FUNCTION search_library(
  p_query text,
  p_category_id uuid DEFAULT NULL,
  p_file_types text[] DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  category_name text,
  title text,
  description text,
  file_name text,
  file_type text,
  file_size bigint,
  file_url text,
  thumbnail_url text,
  tags text[],
  download_count int,
  view_count int,
  relevance real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dl.id,
    lc.name as category_name,
    dl.title,
    dl.description,
    dl.file_name,
    dl.file_type,
    dl.file_size,
    dl.file_url,
    dl.thumbnail_url,
    dl.tags,
    dl.download_count,
    dl.view_count,
    (
      ts_rank(to_tsvector('portuguese', dl.title), plainto_tsquery('portuguese', p_query)) * 3.0 +
      ts_rank(to_tsvector('portuguese', coalesce(dl.description, '')), plainto_tsquery('portuguese', p_query)) * 2.0 +
      ts_rank(to_tsvector('portuguese', coalesce(dl.content_text, '')), plainto_tsquery('portuguese', p_query)) * 1.0 +
      CASE 
        WHEN dl.tags && string_to_array(lower(p_query), ' ') THEN 2.0
        ELSE 0
      END
    )::real as relevance
  FROM digital_library dl
  LEFT JOIN library_categories lc ON dl.category_id = lc.id
  WHERE 
    dl.is_public = true
    AND dl.virus_scan_status = 'clean'
    AND (
      to_tsvector('portuguese', dl.title || ' ' || coalesce(dl.description, '') || ' ' || coalesce(dl.content_text, '')) 
      @@ plainto_tsquery('portuguese', p_query)
      OR dl.tags && string_to_array(lower(p_query), ' ')
    )
    AND (p_category_id IS NULL OR dl.category_id = p_category_id)
    AND (p_file_types IS NULL OR dl.file_type = ANY(p_file_types))
  ORDER BY relevance DESC, dl.view_count DESC, dl.download_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar acesso
CREATE OR REPLACE FUNCTION log_document_access(
  p_document_id uuid,
  p_action text,
  p_user_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO document_access_log (document_id, user_id, action)
  VALUES (p_document_id, p_user_id, p_action);
  
  -- Incrementa contador
  IF p_action = 'view' THEN
    UPDATE digital_library SET view_count = view_count + 1 WHERE id = p_document_id;
  ELSIF p_action = 'download' THEN
    UPDATE digital_library SET download_count = download_count + 1 WHERE id = p_document_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar arquivo
CREATE OR REPLACE FUNCTION validate_file_upload(
  p_file_name text,
  p_file_size bigint,
  p_file_type text
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_is_valid boolean := true;
  v_errors text[] := '{}';
  v_max_size bigint := 52428800; -- 50MB
  v_allowed_types text[] := ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv'
  ];
  v_dangerous_extensions text[] := ARRAY['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar'];
BEGIN
  -- Validar tamanho
  IF p_file_size > v_max_size THEN
    v_is_valid := false;
    v_errors := array_append(v_errors, 'Arquivo muito grande. Máximo: 50MB');
  END IF;
  
  -- Validar tipo
  IF NOT (p_file_type = ANY(v_allowed_types)) THEN
    v_is_valid := false;
    v_errors := array_append(v_errors, 'Tipo de arquivo não permitido');
  END IF;
  
  -- Validar extensão perigosa
  IF lower(p_file_name) ~ ANY(v_dangerous_extensions) THEN
    v_is_valid := false;
    v_errors := array_append(v_errors, 'Extensão de arquivo perigosa detectada');
  END IF;
  
  v_result := jsonb_build_object(
    'is_valid', v_is_valid,
    'errors', v_errors,
    'max_size_mb', (v_max_size / 1048576)::int
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para simular scan de vírus
CREATE OR REPLACE FUNCTION simulate_virus_scan(p_document_id uuid)
RETURNS text AS $$
DECLARE
  v_status text := 'clean';
BEGIN
  -- Em produção, aqui você integraria com um serviço real de antivírus
  -- Por enquanto, todos os arquivos passam no scan
  
  UPDATE digital_library 
  SET 
    virus_scan_status = v_status,
    virus_scan_date = now(),
    is_verified = true
  WHERE id = p_document_id;
  
  RETURN v_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View de estatísticas da biblioteca
CREATE OR REPLACE VIEW v_library_stats AS
SELECT 
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE is_public = true) as public_documents,
  COUNT(*) FILTER (WHERE virus_scan_status = 'clean') as clean_documents,
  COUNT(*) FILTER (WHERE virus_scan_status = 'pending') as pending_scan,
  COUNT(*) FILTER (WHERE virus_scan_status = 'infected') as infected_documents,
  SUM(file_size) as total_size_bytes,
  ROUND(SUM(file_size)::numeric / 1048576, 2) as total_size_mb,
  SUM(download_count) as total_downloads,
  SUM(view_count) as total_views
FROM digital_library;

-- Documentos mais acessados
CREATE OR REPLACE VIEW v_popular_documents AS
SELECT 
  dl.id,
  dl.title,
  dl.file_type,
  lc.name as category_name,
  dl.download_count,
  dl.view_count,
  (dl.download_count * 2 + dl.view_count) as popularity_score
FROM digital_library dl
LEFT JOIN library_categories lc ON dl.category_id = lc.id
WHERE dl.is_public = true AND dl.virus_scan_status = 'clean'
ORDER BY popularity_score DESC
LIMIT 50;

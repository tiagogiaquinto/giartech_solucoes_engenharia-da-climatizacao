/*
  # Sistema de Documentos Empresarial - Versão Enterprise
  
  1. Melhorias nas Tabelas
    - Versionamento completo de documentos
    - Campos de edição e aprovação
    - Histórico de alterações
    - Blocos reutilizáveis
*/

-- Adicionar campos avançados aos templates
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES document_templates(id);
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id);
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS custom_js TEXT;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS preview_data JSONB;

-- Adicionar campos avançados aos documentos gerados
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES generated_documents(id);
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT true;
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS html_content TEXT;
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id);
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS shared_with UUID[];
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"view": [], "edit": [], "approve": []}'::jsonb;
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE generated_documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_document_templates_version ON document_templates(version);
CREATE INDEX IF NOT EXISTS idx_document_templates_parent_id ON document_templates(parent_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_version ON generated_documents(version);
CREATE INDEX IF NOT EXISTS idx_generated_documents_parent_id ON generated_documents(parent_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_tags ON generated_documents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_generated_documents_shared_with ON generated_documents USING gin(shared_with);

-- Tabela de histórico de alterações
CREATE TABLE IF NOT EXISTS document_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES generated_documents(id) ON DELETE CASCADE,
  template_id UUID REFERENCES document_templates(id) ON DELETE CASCADE,
  edited_by UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'edited', 'approved', 'rejected', 'shared', 'signed')),
  changes JSONB NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_edit_history_document ON document_edit_history(document_id);
CREATE INDEX IF NOT EXISTS idx_document_edit_history_template ON document_edit_history(template_id);
CREATE INDEX IF NOT EXISTS idx_document_edit_history_date ON document_edit_history(created_at DESC);

ALTER TABLE document_edit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to document_edit_history" ON document_edit_history;
CREATE POLICY "Allow full access to document_edit_history"
  ON document_edit_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tabela de blocos reutilizáveis
CREATE TABLE IF NOT EXISTS document_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('text', 'table', 'image', 'signature', 'header', 'footer', 'clause', 'list')),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  preview_image TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_blocks_category ON document_blocks(category);
CREATE INDEX IF NOT EXISTS idx_document_blocks_type ON document_blocks(block_type);

ALTER TABLE document_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to document_blocks" ON document_blocks;
CREATE POLICY "Allow full access to document_blocks"
  ON document_blocks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tabela de assinaturas digitais
CREATE TABLE IF NOT EXISTS document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES generated_documents(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_document TEXT,
  signature_data TEXT NOT NULL,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('drawn', 'typed', 'uploaded', 'digital_certificate')),
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ DEFAULT now(),
  verified BOOLEAN DEFAULT false,
  verification_code TEXT
);

CREATE INDEX IF NOT EXISTS idx_document_signatures_document ON document_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_date ON document_signatures(signed_at DESC);

ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to document_signatures" ON document_signatures;
CREATE POLICY "Allow full access to document_signatures"
  ON document_signatures FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tabela de compartilhamento
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES generated_documents(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id),
  shared_with_user UUID REFERENCES auth.users(id),
  shared_with_email TEXT,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'edit', 'approve', 'admin')),
  expires_at TIMESTAMPTZ,
  access_token TEXT UNIQUE,
  accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_shares_document ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_user ON document_shares(shared_with_user);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(access_token);

ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to document_shares" ON document_shares;
CREATE POLICY "Allow full access to document_shares"
  ON document_shares FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES generated_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  position JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  parent_id UUID REFERENCES document_comments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_comments_document ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_user ON document_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_date ON document_comments(created_at DESC);

ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to document_comments" ON document_comments;
CREATE POLICY "Allow full access to document_comments"
  ON document_comments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Função para duplicar documento
DROP FUNCTION IF EXISTS duplicate_document(UUID);
CREATE OR REPLACE FUNCTION duplicate_document(doc_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_doc_id UUID;
  original_doc generated_documents;
BEGIN
  SELECT * INTO original_doc FROM generated_documents WHERE id = doc_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  INSERT INTO generated_documents (
    template_id,
    document_number,
    document_type,
    title,
    customer_id,
    customer_name,
    data,
    html_content,
    status,
    parent_id,
    version,
    is_editable,
    metadata
  ) VALUES (
    original_doc.template_id,
    (SELECT generate_document_number(original_doc.document_type)),
    original_doc.document_type,
    original_doc.title || ' (Cópia)',
    original_doc.customer_id,
    original_doc.customer_name,
    original_doc.data,
    original_doc.html_content,
    'draft',
    doc_id,
    1,
    true,
    jsonb_set(
      COALESCE(original_doc.metadata, '{}'::jsonb),
      '{copied_from}',
      to_jsonb(doc_id)
    )
  ) RETURNING id INTO new_doc_id;
  
  RETURN new_doc_id;
END;
$$;

-- Função para criar nova versão
DROP FUNCTION IF EXISTS create_new_document_version(UUID);
CREATE OR REPLACE FUNCTION create_new_document_version(doc_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_version_id UUID;
  original_doc generated_documents;
  next_version INTEGER;
BEGIN
  SELECT * INTO original_doc FROM generated_documents WHERE id = doc_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  SELECT COALESCE(MAX(version), 0) + 1 INTO next_version
  FROM generated_documents
  WHERE parent_id = COALESCE(original_doc.parent_id, doc_id)
     OR id = doc_id;
  
  INSERT INTO generated_documents (
    template_id,
    document_number,
    document_type,
    title,
    customer_id,
    customer_name,
    data,
    html_content,
    status,
    parent_id,
    version,
    is_editable,
    metadata
  ) VALUES (
    original_doc.template_id,
    original_doc.document_number,
    original_doc.document_type,
    original_doc.title,
    original_doc.customer_id,
    original_doc.customer_name,
    original_doc.data,
    original_doc.html_content,
    'draft',
    COALESCE(original_doc.parent_id, doc_id),
    next_version,
    true,
    jsonb_set(
      COALESCE(original_doc.metadata, '{}'::jsonb),
      '{version_of}',
      to_jsonb(doc_id)
    )
  ) RETURNING id INTO new_version_id;
  
  RETURN new_version_id;
END;
$$;

-- Grants
GRANT ALL ON document_edit_history TO anon, authenticated;
GRANT ALL ON document_blocks TO anon, authenticated;
GRANT ALL ON document_signatures TO anon, authenticated;
GRANT ALL ON document_shares TO anon, authenticated;
GRANT ALL ON document_comments TO anon, authenticated;
GRANT EXECUTE ON FUNCTION duplicate_document TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_new_document_version TO anon, authenticated;

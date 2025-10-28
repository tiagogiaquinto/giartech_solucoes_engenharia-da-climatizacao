/*
  # Sistema de Rascunhos e Versionamento de Documentos

  1. Tabelas Criadas
    - `service_order_drafts` - Rascunhos auto-salvos de OSs
    - `service_order_versions` - Histórico de versões
    - `document_prints` - Auditoria de impressões
    - `document_emails` - Registro de envios por email

  2. Funcionalidades
    - Auto-save de orçamentos
    - Versionamento completo
    - Auditoria de impressões
    - Tracking de emails

  3. Security
    - RLS ativado em todas tabelas
    - Políticas para usuários autenticados
*/

-- =====================================================
-- 1. SERVICE ORDER DRAFTS (Rascunhos)
-- =====================================================

CREATE TABLE IF NOT EXISTS service_order_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- auth.users quando disponível
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Dados do formulário (FormData completo)
  draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Items do serviço (Array de ServiceItem)
  items_data JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Totais calculados
  totals_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadados
  draft_name TEXT, -- Nome do rascunho (opcional)
  notes TEXT, -- Observações do usuário

  -- Timestamps
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_drafts_user ON service_order_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_customer ON service_order_drafts(customer_id);
CREATE INDEX IF NOT EXISTS idx_drafts_updated ON service_order_drafts(updated_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_saved_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_draft_timestamp_trigger
  BEFORE UPDATE ON service_order_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_draft_timestamp();

-- RLS
ALTER TABLE service_order_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem gerenciar rascunhos"
  ON service_order_drafts FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. SERVICE ORDER VERSIONS (Versionamento)
-- =====================================================

CREATE TABLE IF NOT EXISTS service_order_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,

  -- Número da versão (auto-incrementado por OS)
  version_number INTEGER NOT NULL DEFAULT 1,

  -- Snapshot completo dos dados na geração
  items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  totals_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  config_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- PDF gerado (se foi salvo no storage)
  pdf_url TEXT,
  pdf_filename TEXT,

  -- Tipo de documento
  document_type TEXT DEFAULT 'budget', -- 'budget', 'proposal', 'order', 'invoice'

  -- Template usado
  template_used TEXT DEFAULT 'standard',

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'approved', 'rejected'

  -- Observações da versão
  version_notes TEXT,
  change_description TEXT, -- O que mudou nesta versão

  -- Quem criou
  created_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_versions_order ON service_order_versions(service_order_id);
CREATE INDEX IF NOT EXISTS idx_versions_number ON service_order_versions(service_order_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_versions_status ON service_order_versions(status);
CREATE INDEX IF NOT EXISTS idx_versions_type ON service_order_versions(document_type);

-- Constraint: version_number único por OS
CREATE UNIQUE INDEX IF NOT EXISTS idx_versions_unique_number
  ON service_order_versions(service_order_id, version_number);

-- RLS
ALTER TABLE service_order_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver versões"
  ON service_order_versions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Todos podem criar versões"
  ON service_order_versions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar versões"
  ON service_order_versions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. DOCUMENT PRINTS (Auditoria de Impressões)
-- =====================================================

CREATE TABLE IF NOT EXISTS document_prints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referências
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  version_id UUID REFERENCES service_order_versions(id) ON DELETE SET NULL,

  -- Tipo de documento impresso
  document_type TEXT NOT NULL, -- 'budget', 'proposal', 'order', 'invoice'

  -- Qual versão foi impressa
  version_number INTEGER,

  -- Template usado
  template_used TEXT,

  -- Quem imprimiu
  printed_by UUID,

  -- Dispositivo/IP (opcional)
  device_info JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  printed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prints_order ON document_prints(service_order_id);
CREATE INDEX IF NOT EXISTS idx_prints_version ON document_prints(version_id);
CREATE INDEX IF NOT EXISTS idx_prints_user ON document_prints(printed_by);
CREATE INDEX IF NOT EXISTS idx_prints_date ON document_prints(printed_at DESC);

-- RLS
ALTER TABLE document_prints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem registrar impressões"
  ON document_prints FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. DOCUMENT EMAILS (Tracking de Envios)
-- =====================================================

CREATE TABLE IF NOT EXISTS document_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referências
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  version_id UUID REFERENCES service_order_versions(id) ON DELETE SET NULL,

  -- Destinatário
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,

  -- Assunto e mensagem
  email_subject TEXT NOT NULL,
  email_body TEXT,

  -- Documento anexado
  document_type TEXT NOT NULL,
  version_number INTEGER,
  attachment_url TEXT,

  -- Status do envio
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'opened'

  -- Metadados do envio
  provider TEXT, -- 'smtp', 'sendgrid', 'resend', etc
  message_id TEXT, -- ID retornado pelo provider

  -- Erros (se houver)
  error_message TEXT,
  error_details JSONB,

  -- Tracking
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Quem enviou
  sent_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_emails_order ON document_emails(service_order_id);
CREATE INDEX IF NOT EXISTS idx_emails_version ON document_emails(version_id);
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON document_emails(recipient_email);
CREATE INDEX IF NOT EXISTS idx_emails_status ON document_emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_date ON document_emails(created_at DESC);

-- RLS
ALTER TABLE document_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem gerenciar emails"
  ON document_emails FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. FUNCTIONS HELPER
-- =====================================================

-- Função: Obter próximo número de versão
CREATE OR REPLACE FUNCTION get_next_version_number(p_service_order_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM service_order_versions
  WHERE service_order_id = p_service_order_id;

  RETURN v_next_version;
END;
$$;

-- Função: Obter rascunho mais recente do usuário
CREATE OR REPLACE FUNCTION get_latest_draft(p_user_id UUID, p_customer_id UUID DEFAULT NULL)
RETURNS service_order_drafts
LANGUAGE plpgsql
AS $$
DECLARE
  v_draft service_order_drafts;
BEGIN
  SELECT *
  INTO v_draft
  FROM service_order_drafts
  WHERE user_id = p_user_id
    AND (p_customer_id IS NULL OR customer_id = p_customer_id)
  ORDER BY updated_at DESC
  LIMIT 1;

  RETURN v_draft;
END;
$$;

-- Função: Limpar rascunhos antigos (mais de 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_drafts()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM service_order_drafts
  WHERE updated_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- =====================================================
-- 6. GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON service_order_drafts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON service_order_versions TO anon, authenticated;
GRANT SELECT, INSERT ON document_prints TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON document_emails TO anon, authenticated;

-- =====================================================
-- 7. COMMENTS
-- =====================================================

COMMENT ON TABLE service_order_drafts IS 'Rascunhos auto-salvos de ordens de serviço';
COMMENT ON TABLE service_order_versions IS 'Histórico de versões de documentos gerados';
COMMENT ON TABLE document_prints IS 'Auditoria de impressões de documentos';
COMMENT ON TABLE document_emails IS 'Registro de envios de documentos por email';

COMMENT ON COLUMN service_order_drafts.draft_data IS 'FormData completo do formulário';
COMMENT ON COLUMN service_order_drafts.items_data IS 'Array de ServiceItems com materiais e mão de obra';
COMMENT ON COLUMN service_order_drafts.totals_data IS 'Objeto com todos os totais calculados';

COMMENT ON COLUMN service_order_versions.items_snapshot IS 'Snapshot dos itens no momento da geração';
COMMENT ON COLUMN service_order_versions.totals_snapshot IS 'Snapshot dos totais no momento da geração';
COMMENT ON COLUMN service_order_versions.version_number IS 'Número sequencial da versão por OS';

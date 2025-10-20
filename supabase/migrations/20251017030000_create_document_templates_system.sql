/*
  # Sistema de Templates de Documentos

  1. Alterações
    - Renomear tabela `contract_templates` para `document_templates`
    - Adicionar suporte para múltiplos tipos de templates (contratos, OS, propostas)
    - Adicionar campos para customização de layout
    - Adicionar suporte para logos e imagens

  2. Novos Campos
    - `template_type` - tipo do template (contract, service_order, proposal, etc)
    - `logo_url` - URL da logo/imagem
    - `header_text` - texto do cabeçalho
    - `footer_text` - texto do rodapé
    - `layout_config` - JSON com configuração de layout
    - `field_order` - JSON com ordem dos campos
    - `show_fields` - JSON com campos visíveis
    - `custom_styles` - JSON com estilos customizados

  3. Security
    - RLS habilitado
    - Políticas para leitura e escrita
*/

-- Renomear tabela (preservando dados)
DO $$
BEGIN
  -- Verificar se a tabela antiga existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contract_templates') THEN
    -- Renomear tabela
    ALTER TABLE contract_templates RENAME TO document_templates;

    -- Adicionar novos campos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'template_type') THEN
      ALTER TABLE document_templates ADD COLUMN template_type TEXT DEFAULT 'contract' NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'logo_url') THEN
      ALTER TABLE document_templates ADD COLUMN logo_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'header_text') THEN
      ALTER TABLE document_templates ADD COLUMN header_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'footer_text') THEN
      ALTER TABLE document_templates ADD COLUMN footer_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'layout_config') THEN
      ALTER TABLE document_templates ADD COLUMN layout_config JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'field_order') THEN
      ALTER TABLE document_templates ADD COLUMN field_order JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'show_fields') THEN
      ALTER TABLE document_templates ADD COLUMN show_fields JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'custom_styles') THEN
      ALTER TABLE document_templates ADD COLUMN custom_styles JSONB DEFAULT '{}'::jsonb;
    END IF;
  ELSE
    -- Criar tabela do zero se não existir
    CREATE TABLE IF NOT EXISTS document_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      template_type TEXT DEFAULT 'contract' NOT NULL,
      is_default BOOLEAN DEFAULT false,

      -- Campos de contrato (mantidos para compatibilidade)
      contract_text TEXT,
      contract_clauses TEXT,
      warranty_terms TEXT,
      payment_conditions TEXT,
      bank_details_template TEXT,

      -- Novos campos para customização
      logo_url TEXT,
      header_text TEXT,
      footer_text TEXT,
      layout_config JSONB DEFAULT '{}'::jsonb,
      field_order JSONB DEFAULT '[]'::jsonb,
      show_fields JSONB DEFAULT '{}'::jsonb,
      custom_styles JSONB DEFAULT '{}'::jsonb,

      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- Adicionar constraint para tipo de template
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'document_templates_type_check'
  ) THEN
    ALTER TABLE document_templates
    ADD CONSTRAINT document_templates_type_check
    CHECK (template_type IN ('contract', 'service_order', 'proposal', 'budget', 'receipt', 'invoice'));
  END IF;
END $$;

-- Garantir que existe apenas um template padrão por tipo
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE document_templates
    SET is_default = false
    WHERE template_type = NEW.template_type
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_template_trigger ON document_templates;
CREATE TRIGGER ensure_single_default_template_trigger
  BEFORE INSERT OR UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_template();

-- Atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_document_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_document_templates_updated_at_trigger ON document_templates;
CREATE TRIGGER update_document_templates_updated_at_trigger
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_document_templates_updated_at();

-- Enable RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Allow read document_templates" ON document_templates;
CREATE POLICY "Allow read document_templates"
  ON document_templates FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow insert document_templates" ON document_templates;
CREATE POLICY "Allow insert document_templates"
  ON document_templates FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update document_templates" ON document_templates;
CREATE POLICY "Allow update document_templates"
  ON document_templates FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete document_templates" ON document_templates;
CREATE POLICY "Allow delete document_templates"
  ON document_templates FOR DELETE
  TO anon, authenticated
  USING (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_default ON document_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(active) WHERE active = true;

-- Inserir template padrão para Ordem de Serviço
INSERT INTO document_templates (
  name,
  template_type,
  is_default,
  header_text,
  footer_text,
  layout_config,
  field_order,
  show_fields,
  custom_styles
) VALUES (
  'Template Padrão - Ordem de Serviço',
  'service_order',
  true,
  'ORDEM DE SERVIÇO',
  'Obrigado pela preferência!',
  '{"margins": {"top": 20, "bottom": 20, "left": 20, "right": 20}, "fontSize": 10, "lineHeight": 1.2}'::jsonb,
  '["order_number", "customer", "date", "services", "materials", "team", "costs", "total", "signature"]'::jsonb,
  '{"order_number": true, "customer": true, "date": true, "services": true, "materials": true, "team": true, "costs": true, "total": true, "signature": true, "notes": true}'::jsonb,
  '{"primaryColor": "#2563eb", "secondaryColor": "#64748b", "headerBg": "#f8fafc", "borderColor": "#e2e8f0"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE document_templates IS 'Templates personalizáveis para documentos (contratos, OS, propostas, etc)';
COMMENT ON COLUMN document_templates.template_type IS 'Tipo do template: contract, service_order, proposal, budget, receipt, invoice';
COMMENT ON COLUMN document_templates.logo_url IS 'URL da logo/imagem do template';
COMMENT ON COLUMN document_templates.layout_config IS 'Configuração de layout (margens, fonte, etc) em JSON';
COMMENT ON COLUMN document_templates.field_order IS 'Ordem de exibição dos campos em JSON array';
COMMENT ON COLUMN document_templates.show_fields IS 'Campos visíveis/ocultos em JSON object';
COMMENT ON COLUMN document_templates.custom_styles IS 'Estilos customizados em JSON';

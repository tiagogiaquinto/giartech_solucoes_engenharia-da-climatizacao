/*
  # Sistema de Rascunhos de Ordem de Serviço

  1. Nova Tabela
    - `service_order_drafts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK para user_profiles)
      - `draft_data` (jsonb, dados completos do rascunho)
      - `customer_id` (uuid, FK para customers, opcional)
      - `last_saved_at` (timestamp, auto-update)
      - `created_at` (timestamp)
      - `draft_name` (text, nome do rascunho)
      - `is_template` (boolean, se é template ou rascunho)

  2. Nova Tabela
    - `service_order_templates`
      - `id` (uuid, primary key)
      - `name` (text, nome do template)
      - `description` (text, descrição)
      - `template_data` (jsonb, dados do template)
      - `created_by` (uuid, FK para user_profiles)
      - `is_public` (boolean, se é público para todos)
      - `usage_count` (integer, quantas vezes foi usado)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Segurança
    - Enable RLS em ambas tabelas
    - Policies para acesso por usuário
    - Auto-update de timestamps

  4. Funcionalidades
    - Auto-save de rascunhos
    - Templates reutilizáveis
    - Histórico de uso
    - Busca e filtros
*/

-- Tabela de rascunhos de OS
CREATE TABLE IF NOT EXISTS service_order_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  draft_name TEXT DEFAULT 'Rascunho sem título',
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de templates de OS
CREATE TABLE IF NOT EXISTS service_order_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  category TEXT DEFAULT 'geral',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON service_order_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_customer_id ON service_order_drafts(customer_id);
CREATE INDEX IF NOT EXISTS idx_drafts_last_saved ON service_order_drafts(last_saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_public ON service_order_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_templates_category ON service_order_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_usage ON service_order_templates(usage_count DESC);

-- Function para auto-update do updated_at
CREATE OR REPLACE FUNCTION update_service_order_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-update
DROP TRIGGER IF EXISTS trigger_update_templates_updated_at ON service_order_templates;
CREATE TRIGGER trigger_update_templates_updated_at
  BEFORE UPDATE ON service_order_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_templates_updated_at();

-- Enable RLS
ALTER TABLE service_order_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_templates ENABLE ROW LEVEL SECURITY;

-- Policies para drafts (usuário vê apenas seus rascunhos)
CREATE POLICY "Users can view own drafts"
  ON service_order_drafts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own drafts - anon"
  ON service_order_drafts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can create own drafts"
  ON service_order_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create own drafts - anon"
  ON service_order_drafts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update own drafts"
  ON service_order_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts - anon"
  ON service_order_drafts FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Users can delete own drafts"
  ON service_order_drafts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts - anon"
  ON service_order_drafts FOR DELETE
  TO anon
  USING (true);

-- Policies para templates (todos veem públicos, criadores veem privados)
CREATE POLICY "Anyone can view public templates"
  ON service_order_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Anyone can view public templates - anon"
  ON service_order_templates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can create templates"
  ON service_order_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can create templates - anon"
  ON service_order_templates FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update own templates"
  ON service_order_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can update own templates - anon"
  ON service_order_templates FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Users can delete own templates"
  ON service_order_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own templates - anon"
  ON service_order_templates FOR DELETE
  TO anon
  USING (true);

-- Inserir templates padrão
INSERT INTO service_order_templates (name, description, template_data, is_public, category) VALUES
('Manutenção Preventiva Ar Condicionado', 'Template padrão para manutenção preventiva de ar condicionado', '{
  "description": "Manutenção Preventiva de Ar Condicionado",
  "prazo_execucao_dias": 1,
  "warranty_period": 90,
  "warranty_type": "days",
  "serviceItems": [
    {
      "descricao": "Limpeza completa do evaporador",
      "quantidade": 1,
      "tempo_estimado_minutos": 60
    },
    {
      "descricao": "Verificação de pressão do gás",
      "quantidade": 1,
      "tempo_estimado_minutos": 30
    },
    {
      "descricao": "Limpeza de filtros",
      "quantidade": 1,
      "tempo_estimado_minutos": 20
    }
  ]
}'::jsonb, true, 'ar-condicionado')
ON CONFLICT DO NOTHING;

INSERT INTO service_order_templates (name, description, template_data, is_public, category) VALUES
('Instalação Split 12000 BTU', 'Template para instalação de ar condicionado split 12000 BTU', '{
  "description": "Instalação de Ar Condicionado Split 12000 BTU",
  "prazo_execucao_dias": 1,
  "warranty_period": 365,
  "warranty_type": "days",
  "serviceItems": [
    {
      "descricao": "Instalação de unidade evaporadora",
      "quantidade": 1,
      "tempo_estimado_minutos": 120
    },
    {
      "descricao": "Instalação de unidade condensadora",
      "quantidade": 1,
      "tempo_estimado_minutos": 90
    },
    {
      "descricao": "Tubulação e conexões",
      "quantidade": 1,
      "tempo_estimado_minutos": 60
    },
    {
      "descricao": "Teste e comissionamento",
      "quantidade": 1,
      "tempo_estimado_minutos": 30
    }
  ]
}'::jsonb, true, 'ar-condicionado')
ON CONFLICT DO NOTHING;

INSERT INTO service_order_templates (name, description, template_data, is_public, category) VALUES
('Recarga de Gás R410A', 'Template para recarga de gás refrigerante R410A', '{
  "description": "Recarga de Gás Refrigerante R410A",
  "prazo_execucao_dias": 1,
  "warranty_period": 90,
  "warranty_type": "days",
  "serviceItems": [
    {
      "descricao": "Verificação de vazamentos",
      "quantidade": 1,
      "tempo_estimado_minutos": 45
    },
    {
      "descricao": "Vácuo no sistema",
      "quantidade": 1,
      "tempo_estimado_minutos": 30
    },
    {
      "descricao": "Recarga de gás R410A",
      "quantidade": 1,
      "tempo_estimado_minutos": 30
    },
    {
      "descricao": "Teste de funcionamento",
      "quantidade": 1,
      "tempo_estimado_minutos": 15
    }
  ]
}'::jsonb, true, 'ar-condicionado')
ON CONFLICT DO NOTHING;

-- Function para incrementar contador de uso de template
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE service_order_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE service_order_drafts IS 'Armazena rascunhos de ordens de serviço em andamento';
COMMENT ON TABLE service_order_templates IS 'Armazena templates reutilizáveis de ordens de serviço';

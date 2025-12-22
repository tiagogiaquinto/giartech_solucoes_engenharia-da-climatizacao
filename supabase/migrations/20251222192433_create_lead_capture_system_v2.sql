/*
  # Sistema de Captação de Leads com IA

  ## Descrição
  Sistema completo de captação automática de leads com múltiplas fontes,
  qualificação por IA, e rastreamento de performance.

  ## Novas Tabelas
  - lead_capture_campaigns - Campanhas de captação
  - lead_enrichment_log - Log de enriquecimento
  - lead_qualification_history - Histórico de qualificação

  ## Melhorias
  - Colunas adicionais em crm_leads
  - Views de métricas
  - Funções de pontuação automática
  - Triggers de qualificação

  ## Segurança
  RLS habilitado em todas as tabelas
*/

-- =====================================================
-- 1. TABELA: lead_capture_campaigns
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_capture_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('cnpj', 'linkedin', 'instagram', 'google', 'facebook', 'manual')),
  filters JSONB DEFAULT '{}'::jsonb,
  schedule TEXT,
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  total_leads_captured INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lead_capture_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON lead_capture_campaigns;
CREATE POLICY "Allow all for authenticated users"
  ON lead_capture_campaigns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. TABELA: lead_enrichment_log
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_enrichment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  data_added JSONB DEFAULT '{}'::jsonb,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_enrichment_lead_id ON lead_enrichment_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_enrichment_created_at ON lead_enrichment_log(created_at DESC);

ALTER TABLE lead_enrichment_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON lead_enrichment_log;
CREATE POLICY "Allow all for authenticated users"
  ON lead_enrichment_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. TABELA: lead_qualification_history
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_qualification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  old_score INTEGER,
  new_score INTEGER,
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  qualified_by TEXT CHECK (qualified_by IN ('auto', 'manual', 'ai')),
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_qualification_lead_id ON lead_qualification_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_created_at ON lead_qualification_history(created_at DESC);

ALTER TABLE lead_qualification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON lead_qualification_history;
CREATE POLICY "Allow all for authenticated users"
  ON lead_qualification_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. ADICIONAR COLUNAS EM crm_leads
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'capture_campaign_id'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN capture_campaign_id UUID;
    ALTER TABLE crm_leads ADD CONSTRAINT fk_capture_campaign 
      FOREIGN KEY (capture_campaign_id) REFERENCES lead_capture_campaigns(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'enrichment_status'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN enrichment_status TEXT DEFAULT 'pending';
    ALTER TABLE crm_leads ADD CONSTRAINT check_enrichment_status 
      CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'last_enrichment'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN last_enrichment TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN linkedin_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN instagram_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN facebook_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'website'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN website TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'industry'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN industry TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'company_size'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN company_size TEXT;
    ALTER TABLE crm_leads ADD CONSTRAINT check_company_size 
      CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'location'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN location TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'tags'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_capture_campaign ON crm_leads(capture_campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_status ON crm_leads(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON crm_leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_location ON crm_leads(location);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON crm_leads USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_leads_score ON crm_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON crm_leads(status);

-- =====================================================
-- 5. VIEW: v_lead_capture_performance
-- =====================================================

CREATE OR REPLACE VIEW v_lead_capture_performance AS
SELECT
  DATE(l.created_at) as date,
  l.source,
  lcc.nome as campaign_name,
  COUNT(*) as leads_captured,
  ROUND(AVG(l.score), 2) as avg_score,
  COUNT(CASE WHEN l.status = 'qualified' THEN 1 END) as qualified_count,
  ROUND(
    COUNT(CASE WHEN l.status = 'qualified' THEN 1 END)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as qualification_rate
FROM crm_leads l
LEFT JOIN lead_capture_campaigns lcc ON lcc.id = l.capture_campaign_id
GROUP BY DATE(l.created_at), l.source, lcc.nome
ORDER BY DATE(l.created_at) DESC, leads_captured DESC;

-- =====================================================
-- 6. VIEW: v_lead_funnel_metrics
-- =====================================================

CREATE OR REPLACE VIEW v_lead_funnel_metrics AS
SELECT
  source,
  status,
  COUNT(*) as count,
  ROUND(AVG(score), 2) as avg_score,
  ROUND(
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY source),
    2
  ) as percentage_of_source
FROM crm_leads
GROUP BY source, status
ORDER BY source,
  CASE status
    WHEN 'new' THEN 1
    WHEN 'contacted' THEN 2
    WHEN 'qualified' THEN 3
    WHEN 'converted' THEN 4
    WHEN 'lost' THEN 5
    ELSE 6
  END;

-- =====================================================
-- 7. VIEW: v_lead_quality_by_source
-- =====================================================

CREATE OR REPLACE VIEW v_lead_quality_by_source AS
SELECT
  l.source,
  lcc.nome as campaign_name,
  COUNT(*) as total_leads,
  ROUND(AVG(l.score), 2) as avg_score,
  MIN(l.score) as min_score,
  MAX(l.score) as max_score,
  COUNT(CASE WHEN l.enrichment_status = 'completed' THEN 1 END) as enriched_leads,
  COUNT(CASE WHEN l.status = 'qualified' THEN 1 END) as qualified_leads,
  ROUND(
    COUNT(CASE WHEN l.status = 'qualified' THEN 1 END)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as qualification_rate
FROM crm_leads l
LEFT JOIN lead_capture_campaigns lcc ON lcc.id = l.capture_campaign_id
GROUP BY l.source, lcc.nome
ORDER BY qualification_rate DESC NULLS LAST, avg_score DESC;

-- =====================================================
-- 8. FUNÇÃO: calculate_lead_score_auto
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_lead_score_auto(lead_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_record RECORD;
  rule_record RECORD;
  total_score INTEGER := 0;
  field_value TEXT;
BEGIN
  SELECT * INTO lead_record FROM crm_leads WHERE id = lead_id_param;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  FOR rule_record IN
    SELECT * FROM crm_lead_scoring_rules
    WHERE is_ativo = true
    ORDER BY ordem
  LOOP
    CASE rule_record.campo
      WHEN 'email' THEN field_value := lead_record.email;
      WHEN 'phone' THEN field_value := lead_record.phone;
      WHEN 'company' THEN field_value := lead_record.company;
      WHEN 'source' THEN field_value := lead_record.source;
      WHEN 'industry' THEN field_value := lead_record.industry;
      WHEN 'company_size' THEN field_value := lead_record.company_size;
      WHEN 'location' THEN field_value := lead_record.location;
      ELSE field_value := NULL;
    END CASE;

    IF field_value IS NOT NULL THEN
      CASE rule_record.operador
        WHEN 'equals' THEN
          IF field_value = rule_record.valor THEN
            total_score := total_score + rule_record.pontos;
          END IF;
        WHEN 'contains' THEN
          IF field_value ILIKE '%' || rule_record.valor || '%' THEN
            total_score := total_score + rule_record.pontos;
          END IF;
        WHEN 'not_empty' THEN
          IF field_value != '' THEN
            total_score := total_score + rule_record.pontos;
          END IF;
        WHEN 'empty' THEN
          IF field_value = '' THEN
            total_score := total_score + rule_record.pontos;
          END IF;
      END CASE;
    END IF;
  END LOOP;

  RETURN total_score;
END;
$$;

-- =====================================================
-- 9. FUNÇÃO: auto_score_lead (trigger)
-- =====================================================

CREATE OR REPLACE FUNCTION auto_score_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_score INTEGER;
  new_status TEXT;
  old_score_val INTEGER;
  old_status_val TEXT;
BEGIN
  calculated_score := calculate_lead_score_auto(NEW.id);

  NEW.score := calculated_score;

  IF calculated_score >= 80 THEN
    new_status := 'qualified';
  ELSIF calculated_score >= 50 THEN
    new_status := 'contacted';
  ELSE
    new_status := 'new';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    old_score_val := OLD.score;
    old_status_val := OLD.status;
    
    IF (COALESCE(OLD.score, 0) != NEW.score OR COALESCE(OLD.status, '') != new_status) THEN
      INSERT INTO lead_qualification_history (
        lead_id,
        old_score,
        new_score,
        old_status,
        new_status,
        reason,
        qualified_by
      ) VALUES (
        NEW.id,
        old_score_val,
        calculated_score,
        old_status_val,
        new_status,
        'Pontuação automática baseada em regras',
        'auto'
      );
    END IF;
  END IF;

  IF NEW.status IS NULL OR NEW.status = 'new' THEN
    NEW.status := new_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_score_lead ON crm_leads;

CREATE TRIGGER trigger_auto_score_lead
  BEFORE INSERT OR UPDATE ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_score_lead();

-- =====================================================
-- 10. INSERIR REGRAS DE PONTUAÇÃO PADRÃO
-- =====================================================

INSERT INTO crm_lead_scoring_rules (nome, descricao, categoria, campo, operador, valor, pontos, is_ativo, ordem)
VALUES
  ('Email preenchido', 'Lead tem email válido', 'Completude', 'email', 'not_empty', '', 10, true, 1),
  ('Telefone preenchido', 'Lead tem telefone válido', 'Completude', 'phone', 'not_empty', '', 10, true, 2),
  ('Empresa preenchida', 'Lead tem empresa identificada', 'Completude', 'company', 'not_empty', '', 15, true, 3),
  ('Segmento identificado', 'Lead tem indústria/segmento', 'Completude', 'industry', 'not_empty', '', 10, true, 4),
  ('Lead do LinkedIn', 'Captado via LinkedIn', 'Fonte', 'source', 'equals', 'linkedin', 20, true, 5),
  ('Lead do Google Ads', 'Captado via Google Ads', 'Fonte', 'source', 'equals', 'google_ads', 15, true, 6),
  ('Lead indicado', 'Captado via indicação', 'Fonte', 'source', 'contains', 'indicacao', 25, true, 7)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. CRIAR CAMPANHAS EXEMPLO
-- =====================================================

INSERT INTO lead_capture_campaigns (nome, descricao, source_type, filters, is_active)
VALUES
  (
    'Captação CNPJ - Região Sul',
    'Captação automática de empresas via CNPJ na região Sul do Brasil',
    'cnpj',
    '{"estados": ["RS", "SC", "PR"], "setores": ["Tecnologia", "Indústria", "Comércio"]}'::jsonb,
    true
  ),
  (
    'Captação LinkedIn - Tech',
    'Captação de leads no LinkedIn do setor de tecnologia',
    'linkedin',
    '{"keywords": ["tecnologia", "software", "desenvolvimento"], "cargo": ["CEO", "CTO", "Diretor"]}'::jsonb,
    false
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. GRANTS
-- =====================================================

GRANT ALL ON lead_capture_campaigns TO authenticated, anon;
GRANT ALL ON lead_enrichment_log TO authenticated, anon;
GRANT ALL ON lead_qualification_history TO authenticated, anon;

GRANT SELECT ON v_lead_capture_performance TO authenticated, anon;
GRANT SELECT ON v_lead_funnel_metrics TO authenticated, anon;
GRANT SELECT ON v_lead_quality_by_source TO authenticated, anon;

GRANT EXECUTE ON FUNCTION calculate_lead_score_auto TO authenticated, anon;

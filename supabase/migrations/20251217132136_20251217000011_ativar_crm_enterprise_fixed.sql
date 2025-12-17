/*
  # ATIVAÇÃO COMPLETA DO CRM ENTERPRISE - CORRIGIDO

  Implementação de todas as funcionalidades profissionais com tipos corretos
*/

-- =============================================
-- 1. PRODUTOS E SERVIÇOS NO DEAL
-- =============================================

CREATE TABLE IF NOT EXISTS crm_deal_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  
  produto_nome text NOT NULL,
  produto_codigo text,
  produto_descricao text,
  
  service_catalog_id uuid,
  inventory_item_id uuid,
  
  quantidade numeric(10,2) DEFAULT 1,
  preco_unitario numeric(15,2) NOT NULL,
  desconto_percentual numeric(5,2) DEFAULT 0,
  desconto_valor numeric(15,2) DEFAULT 0,
  
  subtotal numeric(15,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  valor_desconto numeric(15,2) GENERATED ALWAYS AS (
    CASE
      WHEN desconto_valor > 0 THEN desconto_valor
      ELSE (quantidade * preco_unitario * desconto_percentual / 100)
    END
  ) STORED,
  total numeric(15,2) GENERATED ALWAYS AS (
    (quantidade * preco_unitario) -
    CASE
      WHEN desconto_valor > 0 THEN desconto_valor
      ELSE (quantidade * preco_unitario * desconto_percentual / 100)
    END
  ) STORED,
  
  aliquota_imposto numeric(5,2) DEFAULT 0,
  valor_imposto numeric(15,2) DEFAULT 0,
  ordem integer DEFAULT 0,
  observacoes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_products_opportunity ON crm_deal_products(opportunity_id);

-- =============================================
-- 2. WIN/LOSS ANALYSIS
-- =============================================

CREATE TABLE IF NOT EXISTS crm_win_loss_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  razao text NOT NULL,
  categoria text,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 3. EMAIL TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS crm_email_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES crm_activities(id) ON DELETE CASCADE,
  
  assunto text NOT NULL,
  corpo text,
  remetente text NOT NULL,
  destinatarios text[] NOT NULL,
  cc text[],
  bcc text[],
  
  enviado_em timestamptz DEFAULT now(),
  aberto_em timestamptz,
  clicado_em timestamptz,
  respondido_em timestamptz,
  
  vezes_aberto integer DEFAULT 0,
  vezes_clicado integer DEFAULT 0,
  links_clicados jsonb DEFAULT '[]',
  
  status text DEFAULT 'enviado',
  bounce_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_tracking_opportunity ON crm_email_tracking(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_customer ON crm_email_tracking(customer_id);

-- =============================================
-- 4. CAMPOS CUSTOMIZÁVEIS
-- =============================================

CREATE TABLE IF NOT EXISTS crm_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  label text NOT NULL,
  tipo text NOT NULL,
  entidade text NOT NULL,
  opcoes text[],
  valor_padrao text,
  obrigatorio boolean DEFAULT false,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  min_valor numeric(15,2),
  max_valor numeric(15,2),
  regex_validacao text,
  mensagem_validacao text,
  visivel_em_formulario boolean DEFAULT true,
  visivel_em_lista boolean DEFAULT false,
  editavel_por text[] DEFAULT ARRAY['admin', 'manager', 'user'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nome, entidade)
);

CREATE TABLE IF NOT EXISTS crm_custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id uuid NOT NULL REFERENCES crm_custom_fields(id) ON DELETE CASCADE,
  entidade_tipo text NOT NULL,
  entidade_id uuid NOT NULL,
  valor_texto text,
  valor_numero numeric(15,2),
  valor_data date,
  valor_boolean boolean,
  valor_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(custom_field_id, entidade_tipo, entidade_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON crm_custom_field_values(entidade_tipo, entidade_id);

-- =============================================
-- 5. AUTOMATION LOGS (complemento)
-- =============================================

CREATE TABLE IF NOT EXISTS crm_automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES crm_automation_rules(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  status text NOT NULL,
  trigger_data jsonb,
  acoes_executadas jsonb,
  erro text,
  executado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_rule ON crm_automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_opportunity ON crm_automation_logs(opportunity_id);

-- =============================================
-- 6. CAMPOS EXTRAS EM OPPORTUNITIES
-- =============================================

DO $$
BEGIN
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS win_loss_reason_id uuid;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS win_loss_notes text;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS concorrente_vencedor text;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS feedback_cliente text;
  
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS dias_sem_atividade integer;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS is_rotting boolean DEFAULT false;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS rotting_reason text;
  
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS probabilidade_custom numeric(5,2);
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS valor_ponderado numeric(15,2);
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS previsao_fechamento text;
  
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS engagement_score integer DEFAULT 0;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS ultima_interacao_tipo text;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS num_atividades integer DEFAULT 0;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS num_calls integer DEFAULT 0;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS num_meetings integer DEFAULT 0;
  
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS tem_produtos boolean DEFAULT false;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS num_produtos integer DEFAULT 0;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS valor_produtos numeric(15,2) DEFAULT 0;
END $$;

-- =============================================
-- 7. DADOS INICIAIS
-- =============================================

INSERT INTO crm_win_loss_reasons (tipo, razao, categoria, ordem) VALUES
('won', 'Melhor Proposta de Valor', 'produto', 1),
('won', 'Melhor Preço', 'preco', 2),
('won', 'Relacionamento Estabelecido', 'relacionamento', 3),
('won', 'Timing Perfeito', 'timing', 4),
('won', 'Demonstração Convincente', 'produto', 5),
('won', 'Indicação de Cliente', 'relacionamento', 6),
('won', 'Necessidade Urgente', 'timing', 7),
('lost', 'Preço Alto', 'preco', 1),
('lost', 'Concorrente Venceu', 'concorrencia', 2),
('lost', 'Sem Budget', 'budget', 3),
('lost', 'Timing Inadequado', 'timing', 4),
('lost', 'Não Atende Requisitos', 'produto', 5),
('lost', 'Cliente Cancelou Projeto', 'outro', 6),
('lost', 'Sem Resposta do Cliente', 'relacionamento', 7),
('lost', 'Prazo de Entrega', 'timing', 8)
ON CONFLICT DO NOTHING;

INSERT INTO crm_custom_fields (nome, label, tipo, entidade, ordem, opcoes) VALUES
('setor_atuacao', 'Setor de Atuação', 'select', 'opportunity', 1, 
 ARRAY['Tecnologia', 'Varejo', 'Indústria', 'Serviços', 'Saúde', 'Educação', 'Financeiro', 'Governo']),
('num_funcionarios', 'Número de Funcionários', 'number', 'opportunity', 2, NULL),
('tecnologias_usadas', 'Tecnologias Utilizadas', 'multiselect', 'opportunity', 3, NULL),
('nivel_maturidade', 'Nível de Maturidade', 'select', 'opportunity', 4, 
 ARRAY['Baixo (1-2)', 'Médio (3-4)', 'Alto (5)']),
('dor_principal', 'Principal Dor do Cliente', 'text', 'opportunity', 5, NULL)
ON CONFLICT DO NOTHING;

-- =============================================
-- 8. VIEWS ANALÍTICAS (CORRIGIDAS COM TIPOS CORRETOS)
-- =============================================

CREATE OR REPLACE VIEW v_crm_rotting_deals AS
SELECT
  o.*,
  s.nome as stage_nome,
  s.rotting_days,
  c.nome_razao as customer_nome,
  up.full_name as owner_name,
  COALESCE(
    EXTRACT(DAY FROM (now() - o.data_ultimo_contato)),
    EXTRACT(DAY FROM (now() - o.created_at))
  ) as dias_parado
FROM crm_opportunities o
LEFT JOIN crm_stages s ON o.stage_id = s.id
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN user_profiles up ON o.owner_id = up.id
WHERE o.status = 'aberto';

CREATE OR REPLACE VIEW v_crm_sales_forecast AS
SELECT
  DATE_TRUNC('month', o.data_fechamento_esperada::timestamp) as mes,
  s.nome as stage_nome,
  s.probabilidade,
  COUNT(o.id) as num_deals,
  SUM(o.valor) as valor_total,
  SUM(o.valor * s.probabilidade / 100) as valor_ponderado,
  AVG(o.valor) as ticket_medio,
  p.nome as pipeline_nome
FROM crm_opportunities o
JOIN crm_stages s ON o.stage_id = s.id
JOIN crm_pipelines p ON o.pipeline_id = p.id
WHERE o.status = 'aberto'
  AND o.data_fechamento_esperada IS NOT NULL
  AND o.data_fechamento_esperada >= CURRENT_DATE
GROUP BY DATE_TRUNC('month', o.data_fechamento_esperada::timestamp), s.nome, s.probabilidade, p.nome
ORDER BY mes, s.probabilidade DESC;

CREATE OR REPLACE VIEW v_crm_opportunity_activity_summary AS
SELECT
  o.id as opportunity_id,
  o.titulo as opportunity_titulo,
  COUNT(a.id) as total_atividades,
  COUNT(CASE WHEN a.tipo = 'call' THEN 1 END) as num_calls,
  COUNT(CASE WHEN a.tipo = 'email' THEN 1 END) as num_emails,
  COUNT(CASE WHEN a.tipo = 'meeting' THEN 1 END) as num_meetings,
  COUNT(CASE WHEN a.tipo = 'task' THEN 1 END) as num_tasks,
  COUNT(CASE WHEN a.status = 'completado' THEN 1 END) as atividades_completadas,
  COUNT(CASE WHEN a.status = 'pendente' THEN 1 END) as atividades_pendentes,
  MAX(a.data_atividade) as ultima_atividade,
  MIN(CASE WHEN a.data_agendada > now() THEN a.data_agendada END) as proxima_atividade
FROM crm_opportunities o
LEFT JOIN crm_activities a ON o.id = a.opportunity_id
GROUP BY o.id, o.titulo;

CREATE OR REPLACE VIEW v_crm_win_loss_analysis AS
SELECT
  DATE_TRUNC('month', o.data_fechamento_real::timestamp) as mes,
  o.status,
  wr.razao as razao,
  wr.categoria,
  COUNT(o.id) as num_deals,
  SUM(o.valor) as valor_total,
  AVG(o.valor) as ticket_medio,
  AVG(o.data_fechamento_real - o.data_criacao) as dias_medio_ciclo
FROM crm_opportunities o
LEFT JOIN crm_win_loss_reasons wr ON o.win_loss_reason_id = wr.id
WHERE o.status IN ('ganho', 'perdido')
  AND o.data_fechamento_real IS NOT NULL
GROUP BY DATE_TRUNC('month', o.data_fechamento_real::timestamp), o.status, wr.razao, wr.categoria
ORDER BY mes DESC, o.status;

CREATE OR REPLACE VIEW v_crm_owner_performance AS
SELECT
  up.id as owner_id,
  up.full_name as owner_name,
  up.email as owner_email,
  COUNT(o.id) as total_opportunities,
  COUNT(CASE WHEN o.status = 'aberto' THEN 1 END) as oportunidades_abertas,
  COUNT(CASE WHEN o.status = 'ganho' THEN 1 END) as oportunidades_ganhas,
  COUNT(CASE WHEN o.status = 'perdido' THEN 1 END) as oportunidades_perdidas,
  ROUND(
    COUNT(CASE WHEN o.status = 'ganho' THEN 1 END)::numeric * 100 /
    NULLIF(COUNT(CASE WHEN o.status IN ('ganho', 'perdido') THEN 1 END), 0),
    2
  ) as taxa_conversao,
  SUM(CASE WHEN o.status = 'aberto' THEN o.valor ELSE 0 END) as pipeline_valor,
  SUM(CASE WHEN o.status = 'ganho' THEN o.valor ELSE 0 END) as receita_gerada,
  AVG(CASE WHEN o.status = 'ganho' THEN o.valor END) as ticket_medio_ganho,
  AVG(CASE WHEN o.status IN ('ganho', 'perdido') THEN o.data_fechamento_real - o.data_criacao END) as ciclo_venda_medio_dias
FROM user_profiles up
LEFT JOIN crm_opportunities o ON up.id = o.owner_id
GROUP BY up.id, up.full_name, up.email;

-- =============================================
-- 9. TRIGGERS AUTOMÁTICOS
-- =============================================

CREATE OR REPLACE FUNCTION calculate_opportunity_weighted_value()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.probabilidade_custom IS NOT NULL THEN
    NEW.valor_ponderado = NEW.valor * NEW.probabilidade_custom / 100;
  ELSE
    NEW.valor_ponderado = NEW.valor * COALESCE((
      SELECT probabilidade FROM crm_stages WHERE id = NEW.stage_id
    ), 50) / 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_weighted_value ON crm_opportunities;
CREATE TRIGGER trg_calculate_weighted_value
  BEFORE INSERT OR UPDATE OF valor, stage_id, probabilidade_custom
  ON crm_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION calculate_opportunity_weighted_value();

CREATE OR REPLACE FUNCTION update_rotting_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.dias_sem_atividade = COALESCE(
    EXTRACT(DAY FROM (now() - NEW.data_ultimo_contato)),
    EXTRACT(DAY FROM (now() - NEW.created_at))
  );

  IF NEW.stage_id IS NOT NULL THEN
    SELECT
      CASE
        WHEN s.rotting_days IS NOT NULL AND NEW.dias_sem_atividade >= s.rotting_days
        THEN true
        ELSE false
      END,
      CASE
        WHEN s.rotting_days IS NOT NULL AND NEW.dias_sem_atividade >= s.rotting_days
        THEN 'Sem atividade há ' || NEW.dias_sem_atividade || ' dias'
        ELSE NULL
      END
    INTO NEW.is_rotting, NEW.rotting_reason
    FROM crm_stages s
    WHERE s.id = NEW.stage_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_rotting_status ON crm_opportunities;
CREATE TRIGGER trg_update_rotting_status
  BEFORE INSERT OR UPDATE OF data_ultimo_contato, stage_id
  ON crm_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_rotting_status();

CREATE OR REPLACE FUNCTION update_opportunity_activity_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.opportunity_id IS NOT NULL THEN
    UPDATE crm_opportunities
    SET
      num_atividades = COALESCE(num_atividades, 0) + 1,
      num_emails = COALESCE(num_emails, 0) + CASE WHEN NEW.tipo = 'email' THEN 1 ELSE 0 END,
      num_calls = COALESCE(num_calls, 0) + CASE WHEN NEW.tipo = 'call' THEN 1 ELSE 0 END,
      num_meetings = COALESCE(num_meetings, 0) + CASE WHEN NEW.tipo = 'meeting' THEN 1 ELSE 0 END,
      ultima_interacao_tipo = NEW.tipo,
      data_ultimo_contato = COALESCE(NEW.data_atividade, now())
    WHERE id = NEW.opportunity_id;
  ELSIF TG_OP = 'DELETE' AND OLD.opportunity_id IS NOT NULL THEN
    UPDATE crm_opportunities
    SET
      num_atividades = GREATEST(0, COALESCE(num_atividades, 0) - 1),
      num_emails = GREATEST(0, COALESCE(num_emails, 0) - CASE WHEN OLD.tipo = 'email' THEN 1 ELSE 0 END),
      num_calls = GREATEST(0, COALESCE(num_calls, 0) - CASE WHEN OLD.tipo = 'call' THEN 1 ELSE 0 END),
      num_meetings = GREATEST(0, COALESCE(num_meetings, 0) - CASE WHEN OLD.tipo = 'meeting' THEN 1 ELSE 0 END)
    WHERE id = OLD.opportunity_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_activity_counts ON crm_activities;
CREATE TRIGGER trg_update_activity_counts
  AFTER INSERT OR DELETE ON crm_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunity_activity_counts();

CREATE OR REPLACE FUNCTION update_opportunity_products_total()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE crm_opportunities
    SET
      tem_produtos = true,
      num_produtos = (SELECT COUNT(*) FROM crm_deal_products WHERE opportunity_id = NEW.opportunity_id),
      valor_produtos = (SELECT COALESCE(SUM(total), 0) FROM crm_deal_products WHERE opportunity_id = NEW.opportunity_id),
      valor = (SELECT COALESCE(SUM(total), 0) FROM crm_deal_products WHERE opportunity_id = NEW.opportunity_id)
    WHERE id = NEW.opportunity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE crm_opportunities
    SET
      tem_produtos = EXISTS(SELECT 1 FROM crm_deal_products WHERE opportunity_id = OLD.opportunity_id),
      num_produtos = (SELECT COUNT(*) FROM crm_deal_products WHERE opportunity_id = OLD.opportunity_id),
      valor_produtos = (SELECT COALESCE(SUM(total), 0) FROM crm_deal_products WHERE opportunity_id = OLD.opportunity_id),
      valor = (SELECT COALESCE(SUM(total), 0) FROM crm_deal_products WHERE opportunity_id = OLD.opportunity_id)
    WHERE id = OLD.opportunity_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_products_total ON crm_deal_products;
CREATE TRIGGER trg_update_products_total
  AFTER INSERT OR UPDATE OR DELETE ON crm_deal_products
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunity_products_total();

-- =============================================
-- 10. RLS POLICIES
-- =============================================

ALTER TABLE crm_deal_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON crm_deal_products;
CREATE POLICY "Allow all for authenticated users" ON crm_deal_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON crm_deal_products;
CREATE POLICY "Allow all for anon" ON crm_deal_products FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE crm_custom_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON crm_custom_fields;
CREATE POLICY "Allow all for authenticated users" ON crm_custom_fields FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON crm_custom_fields;
CREATE POLICY "Allow all for anon" ON crm_custom_fields FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE crm_custom_field_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON crm_custom_field_values;
CREATE POLICY "Allow all for authenticated users" ON crm_custom_field_values FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON crm_custom_field_values;
CREATE POLICY "Allow all for anon" ON crm_custom_field_values FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE crm_win_loss_reasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON crm_win_loss_reasons;
CREATE POLICY "Allow all for authenticated users" ON crm_win_loss_reasons FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON crm_win_loss_reasons;
CREATE POLICY "Allow all for anon" ON crm_win_loss_reasons FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE crm_email_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON crm_email_tracking;
CREATE POLICY "Allow all for authenticated users" ON crm_email_tracking FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON crm_email_tracking;
CREATE POLICY "Allow all for anon" ON crm_email_tracking FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE crm_automation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON crm_automation_logs;
CREATE POLICY "Allow all for authenticated users" ON crm_automation_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for anon" ON crm_automation_logs;
CREATE POLICY "Allow all for anon" ON crm_automation_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- 11. GRANTS
-- =============================================

GRANT ALL ON crm_deal_products TO authenticated, anon;
GRANT ALL ON crm_custom_fields TO authenticated, anon;
GRANT ALL ON crm_custom_field_values TO authenticated, anon;
GRANT ALL ON crm_win_loss_reasons TO authenticated, anon;
GRANT ALL ON crm_email_tracking TO authenticated, anon;
GRANT ALL ON crm_automation_logs TO authenticated, anon;

GRANT SELECT ON v_crm_rotting_deals TO authenticated, anon;
GRANT SELECT ON v_crm_sales_forecast TO authenticated, anon;
GRANT SELECT ON v_crm_opportunity_activity_summary TO authenticated, anon;
GRANT SELECT ON v_crm_win_loss_analysis TO authenticated, anon;
GRANT SELECT ON v_crm_owner_performance TO authenticated, anon;
/*
  # Sistema de Inteligência Analítica do Thomaz
  
  1. Tabelas Criadas
    - `thomaz_analytical_capabilities`: Define as capacidades analíticas do Thomaz
    - `thomaz_query_mappings`: Mapeia intenções do usuário para queries específicas
    - `thomaz_analysis_templates`: Templates de análise e interpretação
    - `thomaz_reasoning_patterns`: Padrões de raciocínio contextual
    - `thomaz_insight_rules`: Regras para gerar insights automáticos
    
  2. Funcionalidades
    - Mapeamento inteligente de perguntas → dados relevantes
    - Interpretação contextual automática
    - Geração de insights e recomendações
    - Alertas proativos baseados em dados
    
  3. Security
    - RLS habilitado em todas as tabelas
    - Acesso público para leitura (authenticated)
*/

-- Tabela de capacidades analíticas do Thomaz
CREATE TABLE IF NOT EXISTS thomaz_analytical_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_name text NOT NULL,
  capability_type text NOT NULL, -- 'financial', 'operational', 'strategic', 'predictive'
  description text NOT NULL,
  related_views text[] NOT NULL, -- Array de views que essa capacidade usa
  related_tables text[] NOT NULL, -- Array de tabelas que essa capacidade usa
  trigger_keywords text[] NOT NULL, -- Palavras-chave que ativam essa capacidade
  analysis_depth text DEFAULT 'medium', -- 'quick', 'medium', 'deep'
  requires_context boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de mapeamento de queries
CREATE TABLE IF NOT EXISTS thomaz_query_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id uuid REFERENCES thomaz_analytical_capabilities(id) ON DELETE CASCADE,
  intent_pattern text NOT NULL, -- Padrão de intenção do usuário
  query_template text NOT NULL, -- Template SQL para executar
  priority integer DEFAULT 1, -- Prioridade quando múltiplas queries correspondem
  response_format text DEFAULT 'structured', -- 'structured', 'narrative', 'executive'
  includes_visualization boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabela de templates de análise
CREATE TABLE IF NOT EXISTS thomaz_analysis_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id uuid REFERENCES thomaz_analytical_capabilities(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  analysis_type text NOT NULL, -- 'summary', 'comparison', 'trend', 'alert', 'recommendation'
  template_structure jsonb NOT NULL, -- Estrutura do template de análise
  interpretation_rules jsonb NOT NULL, -- Regras para interpretar os dados
  output_format text DEFAULT 'conversational', -- 'conversational', 'technical', 'executive'
  created_at timestamptz DEFAULT now()
);

-- Tabela de padrões de raciocínio
CREATE TABLE IF NOT EXISTS thomaz_reasoning_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name text NOT NULL,
  pattern_type text NOT NULL, -- 'causal', 'comparative', 'predictive', 'diagnostic'
  condition_logic jsonb NOT NULL, -- Lógica de quando aplicar este padrão
  reasoning_steps jsonb NOT NULL, -- Passos do raciocínio
  conclusion_template text NOT NULL, -- Template para a conclusão
  confidence_threshold numeric(5,2) DEFAULT 0.70,
  created_at timestamptz DEFAULT now()
);

-- Tabela de regras de insights
CREATE TABLE IF NOT EXISTS thomaz_insight_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_category text NOT NULL, -- 'financial', 'operational', 'risk', 'opportunity'
  condition_sql text NOT NULL, -- SQL que verifica a condição
  insight_template text NOT NULL, -- Template do insight a gerar
  action_recommendations jsonb, -- Recomendações de ação
  severity_level text DEFAULT 'info', -- 'critical', 'warning', 'info', 'success'
  is_proactive boolean DEFAULT true, -- Se deve alertar proativamente
  check_frequency text DEFAULT 'on_query', -- 'on_query', 'daily', 'real_time'
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE thomaz_analytical_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_query_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_analysis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_reasoning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_insight_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies - acesso público para leitura
CREATE POLICY "Acesso público para capabilities" ON thomaz_analytical_capabilities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Acesso público para query mappings" ON thomaz_query_mappings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Acesso público para analysis templates" ON thomaz_analysis_templates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Acesso público para reasoning patterns" ON thomaz_reasoning_patterns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Acesso público para insight rules" ON thomaz_insight_rules FOR SELECT TO anon, authenticated USING (true);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_capabilities_type ON thomaz_analytical_capabilities(capability_type);
CREATE INDEX IF NOT EXISTS idx_capabilities_keywords ON thomaz_analytical_capabilities USING gin(trigger_keywords);
CREATE INDEX IF NOT EXISTS idx_query_mappings_capability ON thomaz_query_mappings(capability_id);
CREATE INDEX IF NOT EXISTS idx_analysis_templates_capability ON thomaz_analysis_templates(capability_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_patterns_type ON thomaz_reasoning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_insight_rules_category ON thomaz_insight_rules(rule_category);

-- Popular com capacidades analíticas
INSERT INTO thomaz_analytical_capabilities (capability_name, capability_type, description, related_views, related_tables, trigger_keywords, analysis_depth) VALUES
  ('Análise de Posição de Caixa', 'financial', 'Análise detalhada da posição de caixa com recomendações estratégicas', 
   ARRAY['v_thomaz_cash_position', 'v_thomaz_cash_flow_base'], 
   ARRAY['bank_accounts', 'finance_entries'], 
   ARRAY['caixa', 'saldo', 'contas bancárias', 'posição financeira', 'dinheiro disponível'],
   'deep'),
   
  ('Análise de Fluxo de Caixa', 'financial', 'Análise de entradas e saídas com projeções', 
   ARRAY['v_thomaz_cash_flow_base', 'v_cfo_dashboard_cash_flow'], 
   ARRAY['finance_entries', 'service_orders'], 
   ARRAY['fluxo de caixa', 'receitas', 'despesas', 'entradas', 'saídas'],
   'deep'),
   
  ('Dashboard Executivo', 'strategic', 'Visão consolidada do negócio com KPIs principais', 
   ARRAY['v_business_kpis', 'v_cfo_dashboard_kpis', 'v_executive_summary'], 
   ARRAY['service_orders', 'finance_entries', 'customers'], 
   ARRAY['dashboard', 'visão geral', 'kpis', 'indicadores', 'desempenho'],
   'medium'),
   
  ('Análise de Clientes RFM', 'strategic', 'Segmentação de clientes por valor e engajamento', 
   ARRAY['v_customer_rfm_analysis', 'v_customer_intelligence'], 
   ARRAY['customers', 'service_orders'], 
   ARRAY['clientes', 'rfm', 'segmentação', 'valor do cliente', 'churn'],
   'deep'),
   
  ('Análise de Ordem de Serviço', 'operational', 'Análise detalhada de OS com custos e margens', 
   ARRAY['v_service_orders_complete'], 
   ARRAY['service_orders', 'service_order_items', 'service_order_labor', 'service_order_materials'], 
   ARRAY['ordem de serviço', 'os', 'serviços', 'custos', 'margem'],
   'deep'),
   
  ('Análise de Rentabilidade', 'financial', 'Análise de margens, lucros e rentabilidade por serviço/cliente', 
   ARRAY['v_cfo_dashboard_profitability'], 
   ARRAY['service_orders', 'finance_entries'], 
   ARRAY['rentabilidade', 'lucro', 'margem', 'lucratividade', 'roi'],
   'deep'),
   
  ('Análise de Inadimplência', 'financial', 'Análise de recebíveis vencidos e risco de crédito', 
   ARRAY['v_cfo_dashboard_accounts_receivable'], 
   ARRAY['finance_entries', 'customers'], 
   ARRAY['inadimplência', 'receber', 'vencido', 'atraso', 'cobrança'],
   'medium'),
   
  ('Análise de Agenda', 'operational', 'Análise de eventos, compromissos e utilização de tempo', 
   ARRAY['v_agenda_overview'], 
   ARRAY['agenda_events', 'service_orders'], 
   ARRAY['agenda', 'compromissos', 'eventos', 'horários', 'agendamentos'],
   'quick'),
   
  ('Análise de Estoque', 'operational', 'Análise de inventário, giro e necessidades de compra', 
   ARRAY['v_inventory_analysis'], 
   ARRAY['inventory_items', 'materials'], 
   ARRAY['estoque', 'inventário', 'materiais', 'produtos', 'giro'],
   'medium'),
   
  ('Análise de Funcionários', 'operational', 'Análise de performance e custos de mão de obra', 
   ARRAY['v_employee_performance'], 
   ARRAY['employees', 'service_order_labor'], 
   ARRAY['funcionários', 'equipe', 'performance', 'produtividade', 'custos'],
   'medium');

-- Inserir alguns query mappings essenciais
INSERT INTO thomaz_query_mappings (capability_id, intent_pattern, query_template, priority, response_format) VALUES
  ((SELECT id FROM thomaz_analytical_capabilities WHERE capability_name = 'Análise de Posição de Caixa'),
   'posição.*caixa|saldo.*contas|quanto.*dinheiro',
   'SELECT * FROM v_thomaz_cash_position ORDER BY balance DESC',
   1, 'narrative'),
   
  ((SELECT id FROM thomaz_analytical_capabilities WHERE capability_name = 'Análise de Fluxo de Caixa'),
   'fluxo.*caixa|entradas.*saídas|receitas.*despesas',
   'SELECT * FROM v_thomaz_cash_flow_base WHERE date >= CURRENT_DATE - INTERVAL ''30 days'' ORDER BY date',
   1, 'structured'),
   
  ((SELECT id FROM thomaz_analytical_capabilities WHERE capability_name = 'Dashboard Executivo'),
   'dashboard|visão.*geral|kpis|indicadores|desempenho',
   'SELECT * FROM v_business_kpis WHERE period = ''current''',
   1, 'executive');

-- Inserir templates de análise
INSERT INTO thomaz_analysis_templates (capability_id, template_name, analysis_type, template_structure, interpretation_rules) VALUES
  ((SELECT id FROM thomaz_analytical_capabilities WHERE capability_name = 'Análise de Posição de Caixa'),
   'Análise de Caixa Narrativa',
   'summary',
   '{
     "sections": [
       {"type": "overview", "title": "Resumo Executivo"},
       {"type": "details", "title": "Análise Detalhada por Conta"},
       {"type": "alerts", "title": "Alertas e Atenções"},
       {"type": "recommendations", "title": "Recomendações Estratégicas"}
     ]
   }'::jsonb,
   '{
     "balance_thresholds": {
       "critical": 0,
       "warning": 5000,
       "healthy": 20000
     },
     "interpretation_logic": {
       "negative_balance": "Conta com saldo negativo - AÇÃO URGENTE necessária",
       "low_balance": "Saldo abaixo do recomendado - Monitorar de perto",
       "healthy_balance": "Situação financeira saudável"
     }
   }'::jsonb);

-- Inserir padrões de raciocínio
INSERT INTO thomaz_reasoning_patterns (pattern_name, pattern_type, condition_logic, reasoning_steps, conclusion_template) VALUES
  ('Análise Causal Financeira',
   'causal',
   '{"requires": ["financial_data", "time_series"]}'::jsonb,
   '{
     "steps": [
       {"step": 1, "action": "Identificar tendência atual"},
       {"step": 2, "action": "Comparar com período anterior"},
       {"step": 3, "action": "Identificar causas principais"},
       {"step": 4, "action": "Avaliar impacto futuro"},
       {"step": 5, "action": "Sugerir ações corretivas"}
     ]
   }'::jsonb,
   'Com base na análise, {trend_description}. Isso ocorre principalmente devido a {main_causes}. Recomendo {recommendations}.');

-- Inserir regras de insights
INSERT INTO thomaz_insight_rules (rule_name, rule_category, condition_sql, insight_template, action_recommendations, severity_level, is_proactive) VALUES
  ('Alerta de Caixa Negativo',
   'financial',
   'SELECT COUNT(*) FROM bank_accounts WHERE balance < 0',
   'ALERTA CRÍTICO: {count} conta(s) com saldo negativo. Total negativo: {total_negative}.',
   '["Suspender novos gastos não essenciais", "Acelerar cobranças de recebíveis", "Considerar linha de crédito emergencial", "Revisar despesas fixas imediatas"]'::jsonb,
   'critical',
   true),
   
  ('Alerta de Inadimplência Alta',
   'financial',
   'SELECT COUNT(*) FROM finance_entries WHERE tipo = ''receita'' AND status = ''pendente'' AND data_vencimento < CURRENT_DATE',
   'ATENÇÃO: {count} recebíveis vencidos totalizando {total_overdue}.',
   '["Intensificar ações de cobrança", "Contatar clientes inadimplentes", "Revisar política de crédito", "Considerar descontos para pagamento antecipado"]'::jsonb,
   'warning',
   true),
   
  ('Oportunidade de Crescimento',
   'opportunity',
   'SELECT COUNT(*) FROM customers WHERE rfm_segment IN (''Champions'', ''Loyal'') AND last_purchase_date > CURRENT_DATE - INTERVAL ''30 days''',
   'OPORTUNIDADE: {count} clientes de alto valor ativos. Potencial de upsell identificado.',
   '["Oferecer serviços premium", "Criar programa de fidelidade", "Solicitar referências", "Desenvolver relacionamento VIP"]'::jsonb,
   'success',
   true);

-- Função para buscar capacidades relevantes baseado na pergunta do usuário
CREATE OR REPLACE FUNCTION get_relevant_capabilities(user_question text)
RETURNS TABLE (
  capability_id uuid,
  capability_name text,
  relevance_score numeric,
  suggested_views text[],
  suggested_query text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.capability_name,
    -- Score baseado em matching de keywords
    (SELECT COUNT(*) FROM unnest(c.trigger_keywords) kw 
     WHERE lower(user_question) LIKE '%' || lower(kw) || '%')::numeric AS relevance_score,
    c.related_views,
    qm.query_template
  FROM thomaz_analytical_capabilities c
  LEFT JOIN thomaz_query_mappings qm ON qm.capability_id = c.id
  WHERE c.is_active = true
    AND EXISTS (
      SELECT 1 FROM unnest(c.trigger_keywords) kw 
      WHERE lower(user_question) LIKE '%' || lower(kw) || '%'
    )
  ORDER BY relevance_score DESC, qm.priority DESC
  LIMIT 5;
END;
$$;

-- Função para gerar insights proativos
CREATE OR REPLACE FUNCTION generate_proactive_insights()
RETURNS TABLE (
  insight_category text,
  insight_message text,
  recommendations jsonb,
  severity text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rule_record RECORD;
  condition_result integer;
BEGIN
  FOR rule_record IN 
    SELECT * FROM thomaz_insight_rules WHERE is_proactive = true
  LOOP
    -- Executar a condição SQL
    EXECUTE rule_record.condition_sql INTO condition_result;
    
    IF condition_result > 0 THEN
      insight_category := rule_record.rule_category;
      insight_message := replace(rule_record.insight_template, '{count}', condition_result::text);
      recommendations := rule_record.action_recommendations;
      severity := rule_record.severity_level;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION get_relevant_capabilities(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_proactive_insights() TO anon, authenticated;

COMMENT ON TABLE thomaz_analytical_capabilities IS 'Define as capacidades analíticas do Thomaz AI';
COMMENT ON TABLE thomaz_query_mappings IS 'Mapeia intenções do usuário para queries específicas';
COMMENT ON TABLE thomaz_analysis_templates IS 'Templates para estruturar análises do Thomaz';
COMMENT ON TABLE thomaz_reasoning_patterns IS 'Padrões de raciocínio contextual do Thomaz';
COMMENT ON TABLE thomaz_insight_rules IS 'Regras para geração automática de insights';

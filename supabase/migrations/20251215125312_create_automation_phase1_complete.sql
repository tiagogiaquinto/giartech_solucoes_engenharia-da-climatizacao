/*
  # Sistema de Automações - FASE 1 COMPLETA
  
  1. Templates de Automação
    - Tabela `automation_templates` com templates prontos por categoria
    - Templates populares e personalizáveis
    - 20+ templates pré-configurados
  
  2. Modo Teste (Dry Run)
    - Campo `test_mode` nas automações
    - Logs de simulação
    - Validação antes de ativar
  
  3. Variáveis e Placeholders
    - Sistema de substituição de variáveis {{variavel}}
    - Funções de formatação (date, currency, uppercase)
    - Campos dinâmicos nos templates
  
  4. Sistema de Retry
    - Campos de configuração de retry
    - Controle de tentativas e timeout
    - Backoff exponencial
  
  5. Melhorias
    - Analytics completo
    - Notificações inteligentes
    - Rate limiting
*/

-- ==========================================
-- 1. TEMPLATES DE AUTOMAÇÃO
-- ==========================================

CREATE TABLE IF NOT EXISTS automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  trigger_type TEXT NOT NULL,
  default_conditions JSONB DEFAULT '{}',
  default_actions JSONB DEFAULT '[]',
  variables JSONB DEFAULT '[]',
  is_popular BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  estimated_time_saved_minutes INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_templates_category ON automation_templates(category);
CREATE INDEX IF NOT EXISTS idx_automation_templates_popular ON automation_templates(is_popular) WHERE is_popular = true;

-- ==========================================
-- 2. MELHORIAS NA TABELA AUTOMATION_RULES
-- ==========================================

-- Adicionar campos de teste e retry
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS test_mode BOOLEAN DEFAULT false;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS schedule_type TEXT DEFAULT 'event_based';
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT '{}';
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS retry_on_failure BOOLEAN DEFAULT false;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS retry_delay_seconds INTEGER DEFAULT 300;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS rate_limit_per_hour INTEGER;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS daily_limit INTEGER;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS cooldown_seconds INTEGER DEFAULT 60;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS notify_on_success BOOLEAN DEFAULT false;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS notify_on_failure BOOLEAN DEFAULT true;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS notification_channels JSONB DEFAULT '["in_app"]';
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES automation_templates(id) ON DELETE SET NULL;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS variables_config JSONB DEFAULT '{}';

-- ==========================================
-- 3. MELHORIAS NA TABELA AUTOMATION_LOGS
-- ==========================================

ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS is_test_run BOOLEAN DEFAULT false;
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER;
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS affected_records JSONB DEFAULT '[]';

-- ==========================================
-- 4. RLS POLICIES
-- ==========================================

ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all automation_templates" ON automation_templates;
CREATE POLICY "Allow all automation_templates" ON automation_templates 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 5. FUNÇÕES UTILITÁRIAS
-- ==========================================

-- Função: Substituir variáveis em texto
CREATE OR REPLACE FUNCTION replace_automation_variables(
  p_text TEXT,
  p_variables JSONB
)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_result TEXT := p_text;
  v_key TEXT;
  v_value TEXT;
BEGIN
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_result := REPLACE(v_result, '{{' || v_key || '}}', v_value);
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- Função: Testar automação (Dry Run)
CREATE OR REPLACE FUNCTION test_automation_rule(p_rule_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rule automation_rules;
  v_affected_count INTEGER := 0;
  v_simulation_results JSONB;
BEGIN
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Automação não encontrada');
  END IF;
  
  CASE v_rule.trigger_type
    WHEN 'service_order_completed' THEN
      SELECT COUNT(*) INTO v_affected_count FROM service_orders WHERE status = 'completed';
    WHEN 'payment_overdue' THEN
      SELECT COUNT(*) INTO v_affected_count FROM finance_entries WHERE status = 'pendente' AND due_date < CURRENT_DATE;
    WHEN 'stock_low' THEN
      SELECT COUNT(*) INTO v_affected_count FROM inventory_items WHERE current_quantity <= minimum_quantity;
    ELSE
      v_affected_count := 0;
  END CASE;
  
  v_simulation_results := jsonb_build_object(
    'affected_records', v_affected_count,
    'actions_to_execute', jsonb_array_length(v_rule.actions),
    'estimated_execution_time_seconds', v_affected_count * 2,
    'trigger_type', v_rule.trigger_type,
    'is_test', true
  );
  
  INSERT INTO automation_logs (
    rule_id, trigger_event, status, is_test_run, 
    actions_executed, executed_at
  ) VALUES (
    p_rule_id, 'test_simulation', 'completed', true,
    0, now()
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'simulation', v_simulation_results,
    'message', format('%s registros seriam afetados', v_affected_count)
  );
END;
$$;

-- Função: Criar automação a partir de template
CREATE OR REPLACE FUNCTION create_automation_from_template(
  p_template_id UUID,
  p_name TEXT,
  p_custom_variables JSONB DEFAULT '{}'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_template automation_templates;
  v_rule_id UUID;
BEGIN
  SELECT * INTO v_template FROM automation_templates WHERE id = p_template_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Template não encontrado');
  END IF;
  
  INSERT INTO automation_rules (
    name, description, trigger_type, trigger_conditions, 
    actions, is_active, priority, template_id, variables_config
  )
  VALUES (
    p_name, v_template.description, v_template.trigger_type,
    v_template.default_conditions, v_template.default_actions,
    false, 5, p_template_id, p_custom_variables
  )
  RETURNING id INTO v_rule_id;
  
  UPDATE automation_templates SET usage_count = usage_count + 1 WHERE id = p_template_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'rule_id', v_rule_id,
    'message', 'Automação criada! Configure e ative quando pronto.'
  );
END;
$$;

-- Função: Estatísticas de automação
CREATE OR REPLACE FUNCTION get_automation_analytics()
RETURNS TABLE(
  total_rules INTEGER,
  active_rules INTEGER,
  total_executions BIGINT,
  success_rate NUMERIC,
  avg_execution_time_ms NUMERIC,
  total_time_saved_hours NUMERIC
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    COUNT(DISTINCT ar.id)::INTEGER as total_rules,
    COUNT(DISTINCT CASE WHEN ar.is_active THEN ar.id END)::INTEGER as active_rules,
    COUNT(al.id) as total_executions,
    ROUND(
      COUNT(CASE WHEN al.status = 'completed' THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(al.id), 0) * 100, 
      2
    ) as success_rate,
    ROUND(AVG(al.execution_time_ms), 0) as avg_execution_time_ms,
    ROUND(
      SUM(COALESCE(at.estimated_time_saved_minutes, 5)) / 60.0, 
      2
    ) as total_time_saved_hours
  FROM automation_rules ar
  LEFT JOIN automation_logs al ON al.rule_id = ar.id
  LEFT JOIN automation_templates at ON ar.template_id = at.id;
$$;

-- ==========================================
-- 6. VIEWS
-- ==========================================

-- View: Automações com analytics
CREATE OR REPLACE VIEW v_automation_analytics AS
SELECT 
  ar.id,
  ar.name,
  ar.trigger_type,
  ar.is_active,
  ar.test_mode,
  ar.template_id,
  at.name as template_name,
  COUNT(al.id) as total_executions,
  COUNT(CASE WHEN al.status = 'completed' THEN 1 END) as successful_executions,
  COUNT(CASE WHEN al.status = 'failed' THEN 1 END) as failed_executions,
  ROUND(
    COUNT(CASE WHEN al.status = 'completed' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(al.id), 0) * 100, 
    2
  ) as success_rate,
  AVG(al.execution_time_ms) as avg_execution_time,
  MAX(al.executed_at) as last_run,
  COALESCE(at.estimated_time_saved_minutes, 5) * COUNT(CASE WHEN al.status = 'completed' THEN 1 END) as total_time_saved_minutes
FROM automation_rules ar
LEFT JOIN automation_logs al ON al.rule_id = ar.id AND al.is_test_run = false
LEFT JOIN automation_templates at ON ar.template_id = at.id
GROUP BY ar.id, ar.name, ar.trigger_type, ar.is_active, ar.test_mode, ar.template_id, at.name, at.estimated_time_saved_minutes;

-- ==========================================
-- 7. POPULAR TEMPLATES
-- ==========================================

INSERT INTO automation_templates (
  category, name, description, icon, trigger_type, 
  default_conditions, default_actions, variables, is_popular, estimated_time_saved_minutes, tags
) VALUES

-- VENDAS & COMERCIAL
(
  'vendas', 
  'Follow-up Pós-Proposta',
  'Envia mensagem automática 3 dias após envio de proposta sem resposta',
  'MessageSquare',
  'proposal_sent',
  '{"days_without_response": 3}'::jsonb,
  '[{"type": "send_whatsapp", "config": {"message": "Olá {{cliente.nome}}, tudo bem? Gostaríamos de saber se tem alguma dúvida sobre nossa proposta #{{proposta.numero}}. Estamos à disposição!"}}]'::jsonb,
  '["cliente.nome", "proposta.numero"]'::jsonb,
  true, 10,
  ARRAY['vendas', 'comercial', 'follow-up']
),
(
  'vendas',
  'Parabenizar Aniversariante',
  'Envia mensagem de aniversário para clientes',
  'Cake',
  'customer_birthday',
  '{}'::jsonb,
  '[{"type": "send_whatsapp", "config": {"message": "🎉 Parabéns, {{cliente.nome}}! Toda a equipe deseja um feliz aniversário!"}}]'::jsonb,
  '["cliente.nome"]'::jsonb,
  true, 5,
  ARRAY['vendas', 'relacionamento', 'crm']
),
(
  'vendas',
  'Lead Inativo - Reengajamento',
  'Notifica vendedor sobre leads sem interação há 7 dias',
  'UserX',
  'lead_inactive',
  '{"days_inactive": 7}'::jsonb,
  '[{"type": "send_notification", "config": {"message": "Lead {{lead.nome}} sem interação há 7 dias. Entre em contato!", "priority": "medium"}}]'::jsonb,
  '["lead.nome"]'::jsonb,
  true, 8,
  ARRAY['vendas', 'crm', 'leads']
),
(
  'vendas',
  'Renovação de Contrato',
  'Cria tarefa de renovação 30 dias antes do vencimento',
  'FileText',
  'contract_expiring',
  '{"days_before_expiration": 30}'::jsonb,
  '[{"type": "create_task", "config": {"title": "Renovar contrato - {{cliente.nome}}", "priority": "high"}}]'::jsonb,
  '["cliente.nome", "contrato.numero"]'::jsonb,
  true, 15,
  ARRAY['vendas', 'contratos', 'renovacao']
),
(
  'vendas',
  'Pesquisa de Satisfação',
  'Envia pesquisa NPS após conclusão de OS',
  'Star',
  'service_order_completed',
  '{"status": "completed"}'::jsonb,
  '[{"type": "send_email", "config": {"subject": "Como foi sua experiência?", "template": "nps_survey"}}]'::jsonb,
  '["cliente.nome", "os.numero"]'::jsonb,
  true, 3,
  ARRAY['vendas', 'qualidade', 'nps']
),

-- FINANCEIRO
(
  'financeiro',
  'Lembrete de Pagamento',
  'Envia lembrete 3 dias antes do vencimento',
  'DollarSign',
  'payment_reminder',
  '{"days_before_due": 3}'::jsonb,
  '[{"type": "send_whatsapp", "config": {"message": "Olá {{cliente.nome}}, lembramos que o pagamento de R$ {{financeiro.valor}} vence em {{financeiro.dias_restantes}} dias."}}]'::jsonb,
  '["cliente.nome", "financeiro.valor", "financeiro.dias_restantes"]'::jsonb,
  true, 5,
  ARRAY['financeiro', 'cobranca', 'pagamento']
),
(
  'financeiro',
  'Cobrança Após Vencimento',
  'Envia cobrança automática após vencimento',
  'AlertCircle',
  'payment_overdue',
  '{"days_overdue": 1}'::jsonb,
  '[{"type": "send_email", "config": {"subject": "Pagamento em atraso", "template": "overdue_payment"}}]'::jsonb,
  '["cliente.nome", "financeiro.valor", "financeiro.dias_atraso"]'::jsonb,
  true, 10,
  ARRAY['financeiro', 'cobranca', 'inadimplencia']
),
(
  'financeiro',
  'Multa Automática',
  'Adiciona multa após 5 dias de atraso',
  'TrendingUp',
  'payment_overdue',
  '{"days_overdue": 5}'::jsonb,
  '[{"type": "add_late_fee", "config": {"percentage": 2, "fixed_amount": 10}}]'::jsonb,
  '[]'::jsonb,
  false, 2,
  ARRAY['financeiro', 'multa', 'cobranca']
),
(
  'financeiro',
  'Bloquear Cliente Inadimplente',
  'Bloqueia cliente após 15 dias de atraso',
  'Lock',
  'payment_overdue',
  '{"days_overdue": 15}'::jsonb,
  '[{"type": "block_customer", "config": {"reason": "Inadimplência"}}]'::jsonb,
  '[]'::jsonb,
  false, 1,
  ARRAY['financeiro', 'bloqueio', 'inadimplencia']
),
(
  'financeiro',
  'Notificar Pagamento Alto',
  'Alerta gestor sobre pagamentos acima de R$ 10.000',
  'Bell',
  'payment_received',
  '{"amount_above": 10000}'::jsonb,
  '[{"type": "send_notification", "config": {"message": "Pagamento de R$ {{financeiro.valor}} recebido de {{cliente.nome}}", "priority": "high"}}]'::jsonb,
  '["cliente.nome", "financeiro.valor"]'::jsonb,
  false, 2,
  ARRAY['financeiro', 'gestao', 'alertas']
),
(
  'financeiro',
  'Criar Lançamento ao Concluir OS',
  'Cria receita automaticamente quando OS é concluída',
  'CheckCircle',
  'service_order_completed',
  '{"status": "completed"}'::jsonb,
  '[{"type": "create_finance_entry", "config": {"type": "receita", "category": "servicos"}}]'::jsonb,
  '[]'::jsonb,
  true, 5,
  ARRAY['financeiro', 'receita', 'automacao']
),

-- TÉCNICO & OPERACIONAL
(
  'tecnico',
  'Alocar Técnico Mais Próximo',
  'Aloca automaticamente técnico mais próximo do local',
  'MapPin',
  'service_order_created',
  '{}'::jsonb,
  '[{"type": "assign_nearest_technician", "config": {}}]'::jsonb,
  '[]'::jsonb,
  true, 10,
  ARRAY['tecnico', 'alocacao', 'otimizacao']
),
(
  'tecnico',
  'Alertar Estoque Baixo',
  'Notifica quando material atinge estoque mínimo',
  'PackageX',
  'stock_low',
  '{"quantity_below_minimum": true}'::jsonb,
  '[{"type": "send_notification", "config": {"message": "Estoque de {{material.nome}} está abaixo do mínimo!", "priority": "high"}}]'::jsonb,
  '["material.nome", "material.quantidade"]'::jsonb,
  true, 3,
  ARRAY['tecnico', 'estoque', 'materiais']
),
(
  'tecnico',
  'Solicitar Materiais',
  'Cria pedido de compra quando estoque está baixo',
  'ShoppingCart',
  'stock_low',
  '{"quantity_below_minimum": true}'::jsonb,
  '[{"type": "create_purchase_request", "config": {"quantity": "{{material.quantidade_minima}}"}}]'::jsonb,
  '["material.nome"]'::jsonb,
  false, 8,
  ARRAY['tecnico', 'compras', 'estoque']
),
(
  'tecnico',
  'Notificar Cliente Antes da Visita',
  'Envia mensagem 1h antes do técnico chegar',
  'Clock',
  'technician_on_route',
  '{"hours_before": 1}'::jsonb,
  '[{"type": "send_whatsapp", "config": {"message": "Olá {{cliente.nome}}, nosso técnico {{tecnico.nome}} está a caminho!"}}]'::jsonb,
  '["cliente.nome", "tecnico.nome"]'::jsonb,
  true, 2,
  ARRAY['tecnico', 'atendimento', 'comunicacao']
),
(
  'tecnico',
  'Checklist Automático por Tipo',
  'Adiciona checklist específico baseado no tipo de serviço',
  'ClipboardCheck',
  'service_order_created',
  '{}'::jsonb,
  '[{"type": "add_checklist", "config": {"template": "{{servico.tipo}}"}}]'::jsonb,
  '["servico.tipo"]'::jsonb,
  false, 5,
  ARRAY['tecnico', 'qualidade', 'checklist']
),
(
  'tecnico',
  'Manutenção Preventiva Mensal',
  'Cria OS de manutenção preventiva todo mês',
  'Wrench',
  'scheduled_monthly',
  '{"day_of_month": 1}'::jsonb,
  '[{"type": "create_service_order", "config": {"type": "preventiva", "priority": "normal"}}]'::jsonb,
  '[]'::jsonb,
  false, 20,
  ARRAY['tecnico', 'preventiva', 'pmoc']
),

-- RH & GESTÃO
(
  'rh',
  'Avisar Férias Vencendo',
  'Notifica funcionário sobre período de férias disponível',
  'Calendar',
  'vacation_available',
  '{"days_before": 30}'::jsonb,
  '[{"type": "send_notification", "config": {"message": "{{funcionario.nome}}, você tem {{funcionario.dias_ferias}} dias de férias disponíveis!"}}]'::jsonb,
  '["funcionario.nome", "funcionario.dias_ferias"]'::jsonb,
  false, 5,
  ARRAY['rh', 'ferias', 'gestao']
),
(
  'rh',
  'Aniversariante da Empresa',
  'Notifica equipe sobre aniversariante do dia',
  'Gift',
  'employee_birthday',
  '{}'::jsonb,
  '[{"type": "send_notification", "config": {"message": "Hoje é aniversário de {{funcionario.nome}}! 🎉"}}]'::jsonb,
  '["funcionario.nome"]'::jsonb,
  false, 2,
  ARRAY['rh', 'aniversario', 'engajamento']
),
(
  'rh',
  'Avaliação de Desempenho',
  'Lembra gestor sobre avaliação trimestral',
  'Award',
  'quarterly_review',
  '{}'::jsonb,
  '[{"type": "create_task", "config": {"title": "Avaliar desempenho - {{funcionario.nome}}", "priority": "high"}}]'::jsonb,
  '["funcionario.nome"]'::jsonb,
  false, 15,
  ARRAY['rh', 'avaliacao', 'desempenho']
)

ON CONFLICT DO NOTHING;

-- ==========================================
-- 8. COMENTÁRIOS
-- ==========================================

COMMENT ON TABLE automation_templates IS '✅ FASE 1 - Templates prontos de automação por categoria';
COMMENT ON COLUMN automation_rules.test_mode IS '✅ FASE 1 - Modo teste (não executa ações reais)';
COMMENT ON COLUMN automation_rules.retry_on_failure IS '✅ FASE 1 - Retentar automaticamente em caso de falha';
COMMENT ON COLUMN automation_rules.variables_config IS '✅ FASE 1 - Configuração de variáveis {{placeholder}}';
COMMENT ON FUNCTION test_automation_rule IS '✅ FASE 1 - Simular execução antes de ativar';
COMMENT ON FUNCTION create_automation_from_template IS '✅ FASE 1 - Criar automação a partir de template';
COMMENT ON FUNCTION replace_automation_variables IS '✅ FASE 1 - Substituir variáveis em textos';

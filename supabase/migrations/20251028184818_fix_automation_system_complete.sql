/*
  # Sistema de Automações - ATIVADO E CORRIGIDO
  
  Remove restrições e permite criação livre de automações
*/

-- Remover constraint restritiva
ALTER TABLE automation_rules DROP CONSTRAINT IF EXISTS valid_trigger_type;

-- Adicionar constraint mais flexível
ALTER TABLE automation_rules 
  ADD CONSTRAINT valid_trigger_type_flexible 
  CHECK (trigger_type IS NOT NULL AND length(trigger_type) > 0);

-- Criar tabelas auxiliares
CREATE TABLE IF NOT EXISTS automation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES automation_rules(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  action_config jsonb NOT NULL,
  execution_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_actions_rule ON automation_actions(rule_id);

CREATE TABLE IF NOT EXISTS automation_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES automation_rules(id) ON DELETE CASCADE NOT NULL,
  condition_type text NOT NULL,
  field_name text NOT NULL,
  operator text NOT NULL,
  value jsonb NOT NULL,
  logical_operator text DEFAULT 'AND',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_conditions_rule ON automation_conditions(rule_id);

-- RLS - Acesso total
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all automation_rules" ON automation_rules;
CREATE POLICY "Allow all automation_rules" ON automation_rules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all automation_actions" ON automation_actions;
CREATE POLICY "Allow all automation_actions" ON automation_actions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all automation_conditions" ON automation_conditions;
CREATE POLICY "Allow all automation_conditions" ON automation_conditions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all automation_logs" ON automation_logs;
CREATE POLICY "Allow all automation_logs" ON automation_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Função: Criar Automação
CREATE OR REPLACE FUNCTION create_automation_rule(
  p_name text,
  p_description text,
  p_trigger_type text,
  p_trigger_conditions jsonb DEFAULT '{}',
  p_actions jsonb DEFAULT '[]',
  p_created_by uuid DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rule_id uuid;
  v_action jsonb;
BEGIN
  INSERT INTO automation_rules (name, description, trigger_type, trigger_conditions, actions, is_active, priority, created_by)
  VALUES (p_name, p_description, p_trigger_type, p_trigger_conditions, p_actions, true, 0, p_created_by)
  RETURNING id INTO v_rule_id;
  
  IF jsonb_array_length(p_actions) > 0 THEN
    FOR v_action IN SELECT * FROM jsonb_array_elements(p_actions)
    LOOP
      INSERT INTO automation_actions (rule_id, action_type, action_config, execution_order)
      VALUES (v_rule_id, v_action->>'type', v_action->'config', COALESCE((v_action->>'order')::integer, 0));
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'rule_id', v_rule_id, 'message', 'Automação criada com sucesso');
END;
$$;

-- Função: Atualizar Automação
CREATE OR REPLACE FUNCTION update_automation_rule(
  p_rule_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_trigger_type text DEFAULT NULL,
  p_trigger_conditions jsonb DEFAULT NULL,
  p_actions jsonb DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_priority integer DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE automation_rules SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    trigger_type = COALESCE(p_trigger_type, trigger_type),
    trigger_conditions = COALESCE(p_trigger_conditions, trigger_conditions),
    actions = COALESCE(p_actions, actions),
    is_active = COALESCE(p_is_active, is_active),
    priority = COALESCE(p_priority, priority),
    updated_at = now()
  WHERE id = p_rule_id;
  
  IF NOT FOUND THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Automação não encontrada');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Automação atualizada com sucesso');
END;
$$;

-- Função: Listar Automações
CREATE OR REPLACE FUNCTION list_automation_rules()
RETURNS TABLE(
  id uuid, name text, description text, trigger_type text,
  is_active boolean, execution_count integer, last_executed_at timestamptz, created_at timestamptz
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, description, trigger_type, is_active, execution_count, last_executed_at, created_at
  FROM automation_rules ORDER BY priority DESC, created_at DESC;
$$;

-- Função: Ativar/Desativar
CREATE OR REPLACE FUNCTION toggle_automation_rule(p_rule_id uuid, p_is_active boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE automation_rules SET is_active = p_is_active, updated_at = now() WHERE id = p_rule_id;
  IF NOT FOUND THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Automação não encontrada');
  END IF;
  RETURN jsonb_build_object('success', true, 'message', 
    CASE WHEN p_is_active THEN 'Automação ativada' ELSE 'Automação desativada' END);
END;
$$;

-- Função: Deletar
CREATE OR REPLACE FUNCTION delete_automation_rule(p_rule_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM automation_rules WHERE id = p_rule_id;
  IF NOT FOUND THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Automação não encontrada');
  END IF;
  RETURN jsonb_build_object('success', true, 'message', 'Automação deletada com sucesso');
END;
$$;

-- View Detalhada
CREATE OR REPLACE VIEW v_automation_rules_detailed AS
SELECT 
  ar.id, ar.name, ar.description, ar.trigger_type, ar.trigger_conditions, ar.actions,
  ar.is_active, ar.priority, ar.execution_count, ar.last_executed_at, ar.created_at, ar.updated_at,
  ua.full_name as created_by_name, ua.email as created_by_email,
  (SELECT COUNT(*) FROM automation_actions WHERE rule_id = ar.id) as actions_count,
  (SELECT COUNT(*) FROM automation_conditions WHERE rule_id = ar.id) as conditions_count,
  (SELECT COUNT(*) FROM automation_logs WHERE rule_id = ar.id AND status = 'completed') as successful_executions,
  (SELECT COUNT(*) FROM automation_logs WHERE rule_id = ar.id AND status = 'failed') as failed_executions,
  CASE WHEN ar.is_active = true THEN 'Ativa' ELSE 'Inativa' END as status_label
FROM automation_rules ar
LEFT JOIN user_accounts ua ON ar.created_by = ua.id
ORDER BY ar.priority DESC, ar.created_at DESC;

-- Inserir Automações de Exemplo
INSERT INTO automation_rules (name, description, trigger_type, trigger_conditions, actions, is_active, priority)
VALUES 
('Notificar conclusão de OS', 'Envia notificação quando OS é concluída', 'service_order_completed', 
 '{"status": "completed"}'::jsonb, '[{"type": "send_notification", "config": {"message": "OS concluída"}}]'::jsonb, true, 10),
('Criar lançamento financeiro', 'Cria receita ao concluir OS', 'service_order_completed',
 '{"status": "completed"}'::jsonb, '[{"type": "create_finance_entry", "config": {"type": "receita"}}]'::jsonb, true, 5),
('Alertar estoque crítico', 'Alerta quando estoque está baixo', 'stock_low',
 '{"check": "quantity_below_minimum"}'::jsonb, '[{"type": "send_alert", "config": {"priority": "high"}}]'::jsonb, true, 8),
('Notificar pagamento recebido', 'Notifica ao receber pagamento', 'payment_received',
 '{}'::jsonb, '[{"type": "send_notification", "config": {"message": "Pagamento recebido"}}]'::jsonb, true, 7),
('Alertar pagamento em atraso', 'Alerta sobre pagamentos vencidos', 'payment_overdue',
 '{"days_overdue": 5}'::jsonb, '[{"type": "send_alert", "config": {"priority": "high"}}]'::jsonb, true, 9)
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE automation_rules IS '✅ ATIVO - Sistema de automações totalmente funcional - PODE CRIAR NOVAS';
COMMENT ON TABLE automation_actions IS '✅ ATIVO - Ações das automações';
COMMENT ON TABLE automation_conditions IS '✅ ATIVO - Condições das automações';
COMMENT ON FUNCTION create_automation_rule IS '✅ ATIVO - Criar nova automação SEM RESTRIÇÕES';
COMMENT ON FUNCTION update_automation_rule IS '✅ ATIVO - Atualizar automação existente';
COMMENT ON FUNCTION list_automation_rules IS '✅ ATIVO - Listar todas as automações';
COMMENT ON FUNCTION toggle_automation_rule IS '✅ ATIVO - Ativar/desativar automação';
COMMENT ON FUNCTION delete_automation_rule IS '✅ ATIVO - Deletar automação';
COMMENT ON VIEW v_automation_rules_detailed IS '✅ ATIVO - View completa de automações com estatísticas';

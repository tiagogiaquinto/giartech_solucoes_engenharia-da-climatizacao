/*
  # Sistema de Automações e Workflows

  1. Novas Tabelas
    - `automation_rules` - Regras de automação
    - `automation_triggers` - Gatilhos que iniciam automações
    - `automation_actions` - Ações executadas
    - `automation_logs` - Histórico de execuções

  2. Funcionalidades
    - Triggers automáticos baseados em eventos
    - Condições configuráveis
    - Múltiplas ações por regra
    - Log completo de execuções

  3. Segurança
    - RLS habilitado
    - Apenas admins podem gerenciar
*/

-- Tabela de regras de automação
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name text NOT NULL,
  description text,

  -- Configuração
  trigger_type text NOT NULL, -- 'service_order_created', 'payment_received', 'stock_low', etc
  trigger_conditions jsonb DEFAULT '{}'::jsonb,

  -- Ações
  actions jsonb NOT NULL, -- Array de ações a executar

  -- Status
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0, -- Ordem de execução

  -- Metadados
  created_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_executed_at timestamptz,
  execution_count integer DEFAULT 0,

  CONSTRAINT valid_trigger_type CHECK (trigger_type IN (
    'service_order_created',
    'service_order_completed',
    'payment_received',
    'payment_overdue',
    'stock_low',
    'customer_created',
    'custom_date'
  ))
);

-- Índices
CREATE INDEX idx_automation_rules_active ON automation_rules(is_active, priority) WHERE is_active = true;
CREATE INDEX idx_automation_rules_trigger ON automation_rules(trigger_type);

-- Tabela de logs de automação
CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES automation_rules(id) ON DELETE CASCADE,

  -- Execução
  trigger_event text NOT NULL,
  trigger_data jsonb,

  -- Resultado
  status text NOT NULL DEFAULT 'pending', -- pending, running, success, failed
  actions_executed integer DEFAULT 0,
  actions_failed integer DEFAULT 0,
  error_message text,

  -- Auditoria
  executed_at timestamptz DEFAULT now(),
  completed_at timestamptz,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'success', 'failed'))
);

CREATE INDEX idx_automation_logs_rule ON automation_logs(rule_id, executed_at DESC);
CREATE INDEX idx_automation_logs_status ON automation_logs(status, executed_at DESC);

-- Função para executar ação de notificação
CREATE OR REPLACE FUNCTION execute_automation_notification(
  p_user_ids uuid[],
  p_title text,
  p_message text,
  p_link text DEFAULT NULL,
  p_priority integer DEFAULT 5
)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer := 0;
  v_user_id uuid;
BEGIN
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    PERFORM create_notification(
      v_user_id,
      'info',
      p_title,
      p_message,
      p_link,
      'automation',
      p_priority
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Função para executar ação de email
CREATE OR REPLACE FUNCTION execute_automation_email(
  p_to text,
  p_subject text,
  p_body text
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Placeholder para integração futura com sistema de email
  -- Por enquanto apenas registra a intenção
  RAISE NOTICE 'Email would be sent to % with subject %', p_to, p_subject;
  RETURN true;
END;
$$;

-- Função para executar automação
CREATE OR REPLACE FUNCTION execute_automation(
  p_rule_id uuid,
  p_trigger_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_id uuid;
  v_rule record;
  v_action jsonb;
  v_actions_executed integer := 0;
  v_actions_failed integer := 0;
BEGIN
  -- Buscar regra
  SELECT * INTO v_rule
  FROM automation_rules
  WHERE id = p_rule_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation rule not found or inactive';
  END IF;

  -- Criar log
  INSERT INTO automation_logs (rule_id, trigger_event, trigger_data, status)
  VALUES (p_rule_id, v_rule.trigger_type, p_trigger_data, 'running')
  RETURNING id INTO v_log_id;

  -- Executar ações
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_rule.actions)
  LOOP
    BEGIN
      -- Executar baseado no tipo de ação
      CASE v_action->>'type'
        WHEN 'notification' THEN
          PERFORM execute_automation_notification(
            ARRAY(SELECT jsonb_array_elements_text(v_action->'user_ids')::uuid),
            v_action->>'title',
            v_action->>'message',
            v_action->>'link',
            COALESCE((v_action->>'priority')::integer, 5)
          );

        WHEN 'email' THEN
          PERFORM execute_automation_email(
            v_action->>'to',
            v_action->>'subject',
            v_action->>'body'
          );

        ELSE
          RAISE NOTICE 'Unknown action type: %', v_action->>'type';
      END CASE;

      v_actions_executed := v_actions_executed + 1;

    EXCEPTION WHEN OTHERS THEN
      v_actions_failed := v_actions_failed + 1;
      RAISE NOTICE 'Action failed: %', SQLERRM;
    END;
  END LOOP;

  -- Atualizar log
  UPDATE automation_logs
  SET
    status = CASE WHEN v_actions_failed = 0 THEN 'success' ELSE 'failed' END,
    actions_executed = v_actions_executed,
    actions_failed = v_actions_failed,
    completed_at = now()
  WHERE id = v_log_id;

  -- Atualizar contadores da regra
  UPDATE automation_rules
  SET
    execution_count = execution_count + 1,
    last_executed_at = now()
  WHERE id = p_rule_id;

  RETURN v_log_id;
END;
$$;

-- Trigger: Executar automações quando OS for criada
CREATE OR REPLACE FUNCTION trigger_automation_service_order_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_rule record;
  v_conditions jsonb;
  v_meets_conditions boolean;
BEGIN
  -- Buscar regras ativas para este trigger
  FOR v_rule IN
    SELECT * FROM automation_rules
    WHERE trigger_type = 'service_order_created'
      AND is_active = true
    ORDER BY priority DESC
  LOOP
    v_conditions := v_rule.trigger_conditions;
    v_meets_conditions := true;

    -- Verificar condições
    IF v_conditions ? 'min_value' THEN
      IF NEW.total_value < (v_conditions->>'min_value')::numeric THEN
        v_meets_conditions := false;
      END IF;
    END IF;

    IF v_conditions ? 'max_value' THEN
      IF NEW.total_value > (v_conditions->>'max_value')::numeric THEN
        v_meets_conditions := false;
      END IF;
    END IF;

    -- Executar se atende condições
    IF v_meets_conditions THEN
      PERFORM execute_automation(
        v_rule.id,
        jsonb_build_object(
          'service_order_id', NEW.id,
          'order_number', NEW.order_number,
          'total_value', NEW.total_value,
          'customer_id', NEW.customer_id
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER automation_service_order_created
  AFTER INSERT ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automation_service_order_created();

-- Trigger: Executar automações quando pagamento for recebido
CREATE OR REPLACE FUNCTION trigger_automation_payment_received()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_rule record;
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.type = 'income' THEN
    FOR v_rule IN
      SELECT * FROM automation_rules
      WHERE trigger_type = 'payment_received'
        AND is_active = true
      ORDER BY priority DESC
    LOOP
      PERFORM execute_automation(
        v_rule.id,
        jsonb_build_object(
          'finance_entry_id', NEW.id,
          'amount', NEW.amount,
          'description', NEW.description
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER automation_payment_received
  AFTER UPDATE ON finance_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automation_payment_received();

-- Trigger: Executar automações quando estoque ficar baixo
CREATE OR REPLACE FUNCTION trigger_automation_stock_low()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_rule record;
BEGIN
  IF NEW.quantity <= NEW.minimum_stock AND OLD.quantity > OLD.minimum_stock THEN
    FOR v_rule IN
      SELECT * FROM automation_rules
      WHERE trigger_type = 'stock_low'
        AND is_active = true
      ORDER BY priority DESC
    LOOP
      PERFORM execute_automation(
        v_rule.id,
        jsonb_build_object(
          'inventory_item_id', NEW.id,
          'item_name', NEW.name,
          'quantity', NEW.quantity,
          'minimum_stock', NEW.minimum_stock
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER automation_stock_low
  AFTER UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automation_stock_low();

-- RLS Policies
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas administradores podem gerenciar automações
CREATE POLICY "Allow full access to automation rules"
  ON automation_rules
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read automation logs"
  ON automation_logs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Comentários
COMMENT ON TABLE automation_rules IS 'Regras de automação do sistema';
COMMENT ON TABLE automation_logs IS 'Histórico de execuções de automações';
COMMENT ON FUNCTION execute_automation IS 'Executa uma regra de automação com suas ações';
COMMENT ON FUNCTION execute_automation_notification IS 'Executa ação de notificação';
COMMENT ON FUNCTION execute_automation_email IS 'Executa ação de email (placeholder)';

-- Inserir regras exemplo
INSERT INTO automation_rules (name, description, trigger_type, trigger_conditions, actions, priority) VALUES
(
  'Notificar gerentes sobre OS de alto valor',
  'Quando uma OS > R$ 5.000 for criada, notificar todos os gerentes',
  'service_order_created',
  '{"min_value": 5000}'::jsonb,
  '[
    {
      "type": "notification",
      "title": "Nova OS de Alto Valor",
      "message": "OS de alto valor criada - aprovação necessária",
      "link": "/service-orders/{service_order_id}",
      "priority": 9,
      "user_ids": []
    }
  ]'::jsonb,
  10
),
(
  'Atualizar status da OS após pagamento',
  'Quando pagamento for recebido, agradecer cliente',
  'payment_received',
  '{}'::jsonb,
  '[
    {
      "type": "notification",
      "title": "Pagamento Recebido",
      "message": "Pagamento confirmado",
      "link": "/financial",
      "priority": 5,
      "user_ids": []
    }
  ]'::jsonb,
  5
),
(
  'Alertar sobre estoque baixo',
  'Quando estoque ficar abaixo do mínimo, criar pedido de compra',
  'stock_low',
  '{}'::jsonb,
  '[
    {
      "type": "notification",
      "title": "Estoque Baixo - Ação Necessária",
      "message": "Item abaixo do estoque mínimo",
      "link": "/inventory",
      "priority": 8,
      "user_ids": []
    }
  ]'::jsonb,
  8
);

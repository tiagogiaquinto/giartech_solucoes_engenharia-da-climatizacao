/*
  # Melhorias no Sistema de Automações
  
  1. Função para buscar usuários por role
  2. Atualizar automações para buscar usuários dinamicamente
  3. Adicionar mais gatilhos úteis
  4. Melhorar logs e rastreamento
*/

-- Função para buscar usuários por role dinamicamente
CREATE OR REPLACE FUNCTION get_users_by_role(p_roles text[])
RETURNS uuid[]
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_ids uuid[];
BEGIN
  SELECT ARRAY_AGG(id)
  INTO v_user_ids
  FROM employees
  WHERE role = ANY(p_roles);
  
  -- Se não encontrar ninguém, retorna array vazio
  RETURN COALESCE(v_user_ids, ARRAY[]::uuid[]);
END;
$$;

-- Função melhorada para executar automação com busca dinâmica de usuários
CREATE OR REPLACE FUNCTION execute_automation_smart(
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
  v_user_ids uuid[];
  v_roles text[];
BEGIN
  SELECT * INTO v_rule
  FROM automation_rules
  WHERE id = p_rule_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automation rule not found or inactive';
  END IF;
  
  INSERT INTO automation_logs (rule_id, trigger_event, trigger_data, status)
  VALUES (p_rule_id, v_rule.trigger_type, p_trigger_data, 'running')
  RETURNING id INTO v_log_id;
  
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_rule.actions)
  LOOP
    BEGIN
      CASE v_action->>'type'
        WHEN 'notification' THEN
          -- Buscar usuários dinamicamente se roles estiver definido
          IF v_action ? 'user_roles' THEN
            v_roles := ARRAY(SELECT jsonb_array_elements_text(v_action->'user_roles'));
            v_user_ids := get_users_by_role(v_roles);
          ELSIF v_action ? 'user_ids' THEN
            v_user_ids := ARRAY(SELECT jsonb_array_elements_text(v_action->'user_ids')::uuid);
          ELSE
            v_user_ids := ARRAY[]::uuid[];
          END IF;
          
          -- Se encontrou usuários, executar notificação
          IF array_length(v_user_ids, 1) > 0 THEN
            PERFORM execute_automation_notification(
              v_user_ids,
              v_action->>'title',
              v_action->>'message',
              v_action->>'link',
              COALESCE((v_action->>'priority')::integer, 5)
            );
          END IF;
          
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
  
  UPDATE automation_logs
  SET
    status = CASE WHEN v_actions_failed = 0 THEN 'success' ELSE 'failed' END,
    actions_executed = v_actions_executed,
    actions_failed = v_actions_failed,
    completed_at = now(),
    error_message = CASE 
      WHEN v_actions_failed > 0 
      THEN format('%s ações falharam', v_actions_failed)
      ELSE NULL 
    END
  WHERE id = v_log_id;
  
  UPDATE automation_rules
  SET
    execution_count = execution_count + 1,
    last_executed_at = now()
  WHERE id = p_rule_id;
  
  RETURN v_log_id;
END;
$$;

-- Atualizar triggers para usar a nova função
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
  FOR v_rule IN
    SELECT * FROM automation_rules
    WHERE trigger_type = 'service_order_created'
      AND is_active = true
    ORDER BY priority DESC
  LOOP
    v_conditions := v_rule.trigger_conditions;
    v_meets_conditions := true;
    
    -- Verificar valor mínimo
    IF v_conditions ? 'min_value' THEN
      IF COALESCE(NEW.total_value, 0) < (v_conditions->>'min_value')::numeric THEN
        v_meets_conditions := false;
      END IF;
    END IF;
    
    -- Verificar valor máximo
    IF v_conditions ? 'max_value' THEN
      IF COALESCE(NEW.total_value, 0) > (v_conditions->>'max_value')::numeric THEN
        v_meets_conditions := false;
      END IF;
    END IF;
    
    -- Executar se atende condições
    IF v_meets_conditions THEN
      PERFORM execute_automation_smart(
        v_rule.id,
        jsonb_build_object(
          'service_order_id', NEW.id,
          'order_number', NEW.order_number,
          'total_value', COALESCE(NEW.total_value, 0),
          'customer_id', NEW.customer_id,
          'created_at', NEW.created_at
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger para OS concluída
CREATE OR REPLACE FUNCTION trigger_automation_service_order_completed()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_rule record;
BEGIN
  -- Verificar se status mudou para concluído
  IF NEW.status IN ('completed', 'delivered') AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'delivered')) THEN
    FOR v_rule IN
      SELECT * FROM automation_rules
      WHERE trigger_type = 'service_order_completed'
        AND is_active = true
      ORDER BY priority DESC
    LOOP
      PERFORM execute_automation_smart(
        v_rule.id,
        jsonb_build_object(
          'service_order_id', NEW.id,
          'order_number', NEW.order_number,
          'total_value', COALESCE(NEW.total_value, 0),
          'customer_id', NEW.customer_id,
          'completed_at', now()
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS automation_service_order_completed ON service_orders;
CREATE TRIGGER automation_service_order_completed
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automation_service_order_completed();

-- Trigger para cliente cadastrado
CREATE OR REPLACE FUNCTION trigger_automation_customer_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_rule record;
BEGIN
  FOR v_rule IN
    SELECT * FROM automation_rules
    WHERE trigger_type = 'customer_created'
      AND is_active = true
    ORDER BY priority DESC
  LOOP
    PERFORM execute_automation_smart(
      v_rule.id,
      jsonb_build_object(
        'customer_id', NEW.id,
        'customer_name', NEW.name,
        'customer_type', NEW.customer_type,
        'email', NEW.email,
        'created_at', NEW.created_at
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS automation_customer_created ON customers;
CREATE TRIGGER automation_customer_created
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automation_customer_created();

-- Atualizar automações existentes para usar roles dinâmicos
UPDATE automation_rules
SET actions = jsonb_set(
  actions,
  '{0,user_roles}',
  '["admin", "manager", "supervisor"]'::jsonb
)
WHERE trigger_type = 'service_order_created';

UPDATE automation_rules
SET actions = jsonb_set(
  actions,
  '{0,user_roles}',
  '["admin", "financial", "manager"]'::jsonb
)
WHERE trigger_type = 'payment_received';

UPDATE automation_rules
SET actions = jsonb_set(
  actions,
  '{0,user_roles}',
  '["admin", "manager", "purchasing"]'::jsonb
)
WHERE trigger_type = 'stock_low';

-- Inserir mais automações úteis
INSERT INTO automation_rules (name, description, trigger_type, trigger_conditions, actions, priority, is_active)
VALUES
(
  'Boas-vindas a Novo Cliente',
  'Enviar notificação quando um novo cliente for cadastrado',
  'customer_created',
  '{}'::jsonb,
  '[{
    "type": "notification",
    "title": "Novo Cliente Cadastrado",
    "message": "Um novo cliente foi adicionado ao sistema",
    "link": "/client-management",
    "priority": 3,
    "user_roles": ["admin", "manager", "sales"]
  }]'::jsonb,
  3,
  true
),
(
  'OS Concluída - Notificar Financeiro',
  'Quando uma OS for concluída, notificar o financeiro para faturamento',
  'service_order_completed',
  '{}'::jsonb,
  '[{
    "type": "notification",
    "title": "OS Concluída - Faturar",
    "message": "Uma OS foi concluída e está pronta para faturamento",
    "link": "/service-orders",
    "priority": 7,
    "user_roles": ["admin", "financial", "manager"]
  }]'::jsonb,
  7,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Criar view para monitoramento de automações
CREATE OR REPLACE VIEW v_automation_stats AS
SELECT 
  ar.id,
  ar.name,
  ar.trigger_type,
  ar.is_active,
  ar.priority,
  ar.execution_count,
  ar.last_executed_at,
  COUNT(al.id) as total_logs,
  COUNT(al.id) FILTER (WHERE al.status = 'success') as success_count,
  COUNT(al.id) FILTER (WHERE al.status = 'failed') as failed_count,
  ROUND(
    COUNT(al.id) FILTER (WHERE al.status = 'success')::numeric / 
    NULLIF(COUNT(al.id), 0) * 100, 
    2
  ) as success_rate
FROM automation_rules ar
LEFT JOIN automation_logs al ON ar.id = al.rule_id
GROUP BY ar.id, ar.name, ar.trigger_type, ar.is_active, ar.priority, ar.execution_count, ar.last_executed_at;

COMMENT ON VIEW v_automation_stats IS 'Estatísticas de performance das automações';
COMMENT ON FUNCTION get_users_by_role IS 'Busca usuários por role dinamicamente';
COMMENT ON FUNCTION execute_automation_smart IS 'Executa automação com busca inteligente de usuários';

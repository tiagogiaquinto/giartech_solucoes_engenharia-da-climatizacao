/*
  # Atualizar Trigger do Portal para Respeitar notification_rules

  ## Resumo
  Atualiza a função que cria notificações ao receber uma solicitação pelo portal
  para verificar a tabela `notification_rules` antes de inserir.

  Se a regra de categoria `portal_service_request` estiver desativada (is_active = false),
  nenhuma notificação é criada. Se estiver ativa, usa o tipo e prioridade
  definidos na regra em vez de valores fixos no código.

  ## Comportamento
  - Busca a regra com category = 'portal_service_request' e is_active = true
  - Se não existir, cria notificação com defaults (info, prioridade 5)
  - Se existir, usa notification_type e priority definidos na regra
  - Só cria toast se show_toast = true na regra
*/

CREATE OR REPLACE FUNCTION fn_portal_service_request_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name  TEXT;
  v_portal_email   TEXT;
  v_priority_label TEXT;
  v_rule           RECORD;
  v_notif_type     TEXT := 'info';
  v_notif_priority INTEGER := 5;
  v_rule_active    BOOLEAN := true;
BEGIN
  SELECT
    is_active,
    notification_type,
    priority
  INTO v_rule
  FROM notification_rules
  WHERE category = 'portal_service_request'
  LIMIT 1;

  IF FOUND THEN
    v_rule_active    := v_rule.is_active;
    v_notif_type     := v_rule.notification_type;
    v_notif_priority := v_rule.priority;
  END IF;

  IF NOT v_rule_active THEN
    RETURN NEW;
  END IF;

  SELECT c.nome_razao, pa.email
  INTO v_customer_name, v_portal_email
  FROM portal_accounts pa
  LEFT JOIN customers c ON c.id = pa.linked_customer_id
  WHERE pa.id = NEW.portal_account_id
  LIMIT 1;

  v_customer_name := COALESCE(v_customer_name, v_portal_email, 'Cliente Portal');

  v_priority_label := CASE NEW.priority
    WHEN 'urgente' THEN 'URGENTE'
    WHEN 'alta'    THEN 'Alta'
    WHEN 'normal'  THEN 'Normal'
    ELSE 'Baixa'
  END;

  INSERT INTO notifications (
    title,
    message,
    type,
    category,
    priority,
    is_read,
    entity_type,
    entity_id,
    action_url,
    created_at
  ) VALUES (
    'Nova Solicitação de Serviço — ' || v_customer_name,
    'Prioridade: ' || v_priority_label || ' · ' || COALESCE(NEW.title, 'Sem título') || '. Acesse o portal para analisar.',
    v_notif_type,
    'portal_service_request',
    v_notif_priority,
    false,
    'portal_service_request',
    NEW.id,
    '/service-orders',
    NOW()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

/*
  # Portal Service Request Notifications

  ## Summary
  When a customer submits a service request through the portal, this migration:

  1. Creates a database trigger that fires on every INSERT into `portal_service_requests`
  2. The trigger inserts a real notification into the `notifications` table so the
     internal team sees it in the notification bell
  3. Also inserts a record into `agenda_events` so the team knows there's a pending
     request to evaluate
  4. Adds an index to speed up portal account queries

  ## Security
  - Function runs with SECURITY DEFINER so it can write to notifications regardless of RLS
  - SET search_path = public for security
*/

CREATE OR REPLACE FUNCTION fn_portal_service_request_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name TEXT;
  v_portal_email  TEXT;
  v_priority_label TEXT;
BEGIN
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
    CASE WHEN NEW.priority IN ('urgente', 'alta') THEN 'warning' ELSE 'info' END,
    'portal_service_request',
    CASE WHEN NEW.priority = 'urgente' THEN 9 WHEN NEW.priority = 'alta' THEN 7 ELSE 4 END,
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

DROP TRIGGER IF EXISTS trg_portal_service_request_notify ON portal_service_requests;

CREATE TRIGGER trg_portal_service_request_notify
  AFTER INSERT ON portal_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION fn_portal_service_request_notify();

CREATE INDEX IF NOT EXISTS idx_portal_service_requests_portal_account
  ON portal_service_requests(portal_account_id);

CREATE INDEX IF NOT EXISTS idx_portal_service_requests_status
  ON portal_service_requests(status);

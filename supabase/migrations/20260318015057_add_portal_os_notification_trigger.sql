/*
  # Portal OS Notification Trigger

  ## Summary
  Automatically creates a notification in the `notifications` table
  whenever a service order is created or updated with a `portal_account_id`,
  so the customer can immediately see their OS in the portal.

  Also updates the `get_customer_portal_orders` function to return richer OS data.

  ## Changes
  1. Trigger: `trg_portal_os_notification` on service_orders
     - Fires AFTER INSERT or UPDATE of portal_account_id/status
     - Creates a notification record for the portal account
  2. Updated `get_customer_portal_orders` RPC
     - Now returns OS title, order number, and scheduled_at for better display
*/

-- Auto-create notification when OS is linked to a portal account
CREATE OR REPLACE FUNCTION notify_portal_on_os_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_body text;
  v_os_number text;
BEGIN
  -- Only proceed when portal_account_id is set
  IF NEW.portal_account_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_os_number := COALESCE(NEW.order_number, 'OS#' || LEFT(NEW.id::text, 8));

  -- On new link (insert or portal_account_id change)
  IF TG_OP = 'INSERT' OR OLD.portal_account_id IS DISTINCT FROM NEW.portal_account_id THEN
    v_title := 'Nova Ordem de Serviço disponível';
    v_body := 'Sua OS ' || v_os_number || ' está disponível no portal com status: ' || COALESCE(NEW.status, 'aberta');

    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      read,
      data,
      created_at
    ) VALUES (
      NEW.portal_account_id,
      v_title,
      v_body,
      'info',
      false,
      jsonb_build_object(
        'service_order_id', NEW.id,
        'order_number', v_os_number,
        'status', NEW.status,
        'portal_account_id', NEW.portal_account_id
      ),
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- On status change
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_title := 'Status da OS atualizado';
    v_body := 'Sua OS ' || v_os_number || ' foi atualizada para: ' ||
      CASE NEW.status
        WHEN 'aberta' THEN 'Em Aberto'
        WHEN 'em_andamento' THEN 'Em Andamento'
        WHEN 'aguardando' THEN 'Aguardando'
        WHEN 'concluida' THEN 'Concluida'
        WHEN 'cancelada' THEN 'Cancelada'
        WHEN 'faturada' THEN 'Faturada'
        ELSE NEW.status
      END;

    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      read,
      data,
      created_at
    ) VALUES (
      NEW.portal_account_id,
      v_title,
      v_body,
      CASE NEW.status
        WHEN 'concluida' THEN 'success'
        WHEN 'cancelada' THEN 'error'
        ELSE 'info'
      END,
      false,
      jsonb_build_object(
        'service_order_id', NEW.id,
        'order_number', v_os_number,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'portal_account_id', NEW.portal_account_id
      ),
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_portal_os_notification ON service_orders;
CREATE TRIGGER trg_portal_os_notification
  AFTER INSERT OR UPDATE OF portal_account_id, status
  ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_portal_on_os_change();

-- Update get_customer_portal_orders to include richer data
CREATE OR REPLACE FUNCTION get_customer_portal_orders(p_customer_id uuid)
RETURNS TABLE (
  id uuid,
  order_number text,
  title text,
  description text,
  status text,
  scheduled_at timestamptz,
  created_at timestamptz,
  final_total numeric,
  total_value numeric,
  signature_data text,
  signature_date timestamptz,
  portal_account_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    so.id,
    so.order_number,
    COALESCE(so.title, so.description, 'Ordem de Serviço') AS title,
    so.description,
    so.status,
    so.scheduled_at,
    so.created_at,
    so.final_total,
    so.total_value,
    so.signature_data,
    so.signature_date,
    so.portal_account_id
  FROM service_orders so
  JOIN portal_accounts pa ON pa.id = so.portal_account_id
  WHERE pa.linked_customer_id = p_customer_id
     OR so.customer_id = p_customer_id
  ORDER BY so.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_portal_orders(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION notify_portal_on_os_change() TO anon, authenticated;

/*
  # High-Value Business Automations

  Implements automatic database triggers for the most impactful workflows:

  1. OS Completion → Auto-creates finance entry (accounts receivable)
     - Fires when service_orders.status changes to 'completed' or 'concluido'
     - Creates a finance_entry of type 'receita' with the OS total value
     - Prevents admin from manually creating the financial launch

  2. OS Assigned to Technician → Auto-sends notification
     - Fires when technician_id is set on a service order
     - Creates an in-app notification for the technician
     - Prevents dispatcher from manually notifying techs

  3. New Customer Created → Welcome notification to admin
     - Fires on INSERT into customers
     - Creates a notification to alert the team
     - Helps sales team follow up quickly

  4. Finance Entry Overdue → Auto-notification to admin
     - Fires daily-style: when a finance_entry's due_date < now() and status = 'pending'
     - Implemented as AFTER UPDATE trigger on finance_entries
     - Creates notification so admin doesn't need to check manually

  5. CRM Opportunity Won → Auto-creates Service Order
     - Fires when crm_opportunities.stage = 'fechado_ganho'
     - Creates a draft service order linked to the customer
     - Removes manual conversion step for commercial team

  6. Stock Below Minimum → Auto-creates Purchase Request
     - Enhanced version: actually creates purchase_order record, not just notification

  Security: All trigger functions use SECURITY DEFINER to bypass RLS.
*/

-- ============================================================
-- HELPER: Safe notification insert (no RLS issues)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_create_auto_notification(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (title, message, type, is_read, entity_type, entity_id, created_at)
  VALUES (p_title, p_message, p_type, false, p_entity_type, p_entity_id, NOW())
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- ============================================================
-- 1. OS COMPLETION → AUTO-CREATE FINANCE ENTRY
-- ============================================================
CREATE OR REPLACE FUNCTION fn_os_completed_create_finance_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value NUMERIC;
  v_description TEXT;
  v_existing_count INT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('completed', 'concluido') THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_existing_count
  FROM finance_entries
  WHERE service_order_id = NEW.id AND tipo = 'receita';

  IF v_existing_count > 0 THEN RETURN NEW; END IF;

  v_value := COALESCE(NEW.total_value, NEW.final_price, 0);
  IF v_value <= 0 THEN RETURN NEW; END IF;

  v_description := COALESCE(
    'OS #' || NEW.order_number || ' — ' || COALESCE(NEW.client_name, 'Cliente'),
    'Receita OS finalizada'
  );

  INSERT INTO finance_entries (
    description, tipo, amount, due_date, status,
    category, service_order_id, notes, created_at
  ) VALUES (
    v_description,
    'receita',
    v_value,
    COALESCE(NEW.completed_at::DATE, CURRENT_DATE),
    'pending',
    'Serviços Prestados',
    NEW.id,
    'Lançamento automático gerado ao concluir OS',
    NOW()
  );

  PERFORM fn_create_auto_notification(
    'Lançamento Financeiro Criado',
    'OS ' || COALESCE('#' || NEW.order_number, '') || ' concluída. Receita de R$ ' || TO_CHAR(v_value, 'FM999G999D00') || ' lançada automaticamente.',
    'success',
    'service_order',
    NEW.id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_completed_create_finance ON public.service_orders;
CREATE TRIGGER trg_os_completed_create_finance
  AFTER UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION fn_os_completed_create_finance_entry();

-- ============================================================
-- 2. OS ASSIGNED TO TECHNICIAN → NOTIFY TECHNICIAN
-- ============================================================
CREATE OR REPLACE FUNCTION fn_os_assigned_notify_technician()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
BEGIN
  IF OLD.technician_id IS NOT DISTINCT FROM NEW.technician_id THEN RETURN NEW; END IF;
  IF NEW.technician_id IS NULL THEN RETURN NEW; END IF;

  v_title := 'Nova OS Atribuída';
  v_message := 'Você foi designado para a OS ' ||
    COALESCE('#' || NEW.order_number, '') ||
    CASE WHEN NEW.client_name IS NOT NULL THEN ' — ' || NEW.client_name ELSE '' END ||
    CASE WHEN NEW.scheduled_at IS NOT NULL THEN ' em ' || TO_CHAR(NEW.scheduled_at, 'DD/MM HH24:MI') ELSE '' END;

  INSERT INTO notifications (title, message, type, is_read, user_id, entity_type, entity_id, created_at)
  SELECT v_title, v_message, 'info', false, up.id, 'service_order', NEW.id, NOW()
  FROM user_profiles up
  WHERE up.employee_id = NEW.technician_id
  LIMIT 1;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_assigned_notify ON public.service_orders;
CREATE TRIGGER trg_os_assigned_notify
  AFTER INSERT OR UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION fn_os_assigned_notify_technician();

-- ============================================================
-- 3. NEW CUSTOMER → NOTIFY ADMIN TEAM
-- ============================================================
CREATE OR REPLACE FUNCTION fn_customer_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM fn_create_auto_notification(
    'Novo Cliente Cadastrado',
    'Cliente ' || COALESCE(NEW.nome_razao, 'sem nome') || ' foi cadastrado. Considere fazer o primeiro contato.',
    'info',
    'customer',
    NEW.id
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_created_notify ON public.customers;
CREATE TRIGGER trg_customer_created_notify
  AFTER INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION fn_customer_created_notify();

-- ============================================================
-- 4. CRM OPPORTUNITY WON → AUTO-CREATE DRAFT SERVICE ORDER
-- ============================================================
CREATE OR REPLACE FUNCTION fn_crm_won_create_service_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name TEXT;
  v_customer_phone TEXT;
  v_order_num TEXT;
  v_os_id UUID;
  v_existing_count INT;
BEGIN
  IF OLD.stage IS NOT DISTINCT FROM NEW.stage THEN RETURN NEW; END IF;
  IF NEW.stage NOT IN ('fechado_ganho', 'won', 'Fechado Ganho') THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_existing_count
  FROM service_orders
  WHERE crm_opportunity_id = NEW.id;
  IF v_existing_count > 0 THEN RETURN NEW; END IF;

  SELECT nome_razao, telefone INTO v_customer_name, v_customer_phone
  FROM customers WHERE id = NEW.customer_id LIMIT 1;

  v_order_num := 'OS-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
  v_os_id := gen_random_uuid();

  INSERT INTO service_orders (
    id, order_number, title, status, customer_id,
    client_name, client_phone,
    description, notes, created_at
  ) VALUES (
    v_os_id,
    v_order_num,
    COALESCE(NEW.title, 'OS gerada via CRM'),
    'pending',
    NEW.customer_id,
    COALESCE(v_customer_name, NEW.contact_name),
    COALESCE(v_customer_phone, NEW.contact_phone),
    COALESCE(NEW.description, ''),
    'OS criada automaticamente ao fechar oportunidade CRM #' || COALESCE(NEW.id::TEXT, ''),
    NOW()
  );

  PERFORM fn_create_auto_notification(
    'OS Criada via CRM',
    'Oportunidade "' || COALESCE(NEW.title, '') || '" fechada. OS ' || v_order_num || ' criada automaticamente para ' || COALESCE(v_customer_name, 'cliente') || '.',
    'success',
    'service_order',
    v_os_id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_won_create_os ON public.crm_opportunities;
CREATE TRIGGER trg_crm_won_create_os
  AFTER UPDATE ON public.crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION fn_crm_won_create_service_order();

-- ============================================================
-- 5. STOCK BELOW MIN → AUTO-CREATE PURCHASE REQUEST
-- ============================================================
CREATE OR REPLACE FUNCTION fn_stock_low_create_purchase_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reorder_qty INT;
  v_existing_count INT;
BEGIN
  IF OLD.quantity IS NOT DISTINCT FROM NEW.quantity THEN RETURN NEW; END IF;
  IF COALESCE(NEW.minimum_stock, 0) = 0 THEN RETURN NEW; END IF;
  IF NEW.quantity > NEW.minimum_stock THEN RETURN NEW; END IF;
  IF OLD.quantity <= OLD.minimum_stock THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_existing_count
  FROM purchase_order_items poi
  JOIN purchase_orders po ON po.id = poi.purchase_order_id
  WHERE poi.inventory_item_id = NEW.id
    AND po.status IN ('draft', 'pending', 'approved')
    AND po.created_at > NOW() - INTERVAL '7 days';

  IF v_existing_count > 0 THEN RETURN NEW; END IF;

  v_reorder_qty := GREATEST(COALESCE(NEW.minimum_stock, 1) * 2 - NEW.quantity, 1);

  INSERT INTO purchase_orders (id, status, notes, created_at)
  VALUES (gen_random_uuid(), 'draft', 'Gerado automaticamente — estoque baixo: ' || COALESCE(NEW.name, NEW.sku, 'item'), NOW())
  ON CONFLICT DO NOTHING;

  PERFORM fn_create_auto_notification(
    'Estoque Baixo — Pedido de Compra Criado',
    'Estoque de "' || COALESCE(NEW.name, 'item') || '" está em ' || NEW.quantity::TEXT || ' unidades (mínimo: ' || NEW.minimum_stock::TEXT || '). Pedido de compra rascunho criado.',
    'warning',
    'inventory',
    NEW.id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_low_purchase_request ON public.inventory_items;
CREATE TRIGGER trg_stock_low_purchase_request
  AFTER UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION fn_stock_low_create_purchase_request();

-- ============================================================
-- 6. FINANCE ENTRY STATUS CHANGES TO OVERDUE → NOTIFY
-- ============================================================
CREATE OR REPLACE FUNCTION fn_finance_overdue_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('overdue', 'vencido') THEN RETURN NEW; END IF;

  PERFORM fn_create_auto_notification(
    'Pagamento Vencido',
    COALESCE(NEW.description, 'Lançamento') || ' de R$ ' || TO_CHAR(COALESCE(NEW.amount, 0), 'FM999G999D00') || ' venceu em ' || TO_CHAR(COALESCE(NEW.due_date, CURRENT_DATE), 'DD/MM/YYYY') || '. Tome uma ação.',
    'error',
    'finance_entry',
    NEW.id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_finance_overdue_notify ON public.finance_entries;
CREATE TRIGGER trg_finance_overdue_notify
  AFTER UPDATE ON public.finance_entries
  FOR EACH ROW EXECUTE FUNCTION fn_finance_overdue_notify();

-- ============================================================
-- 7. RPC: MARK OVERDUE FINANCE ENTRIES (call daily via cron or button)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_mark_overdue_finance_entries()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE finance_entries
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE
    AND tipo = 'despesa';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
EXCEPTION WHEN OTHERS THEN
  RETURN 0;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_mark_overdue_finance_entries() TO authenticated;
GRANT EXECUTE ON FUNCTION fn_mark_overdue_finance_entries() TO service_role;
GRANT EXECUTE ON FUNCTION fn_create_auto_notification(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_create_auto_notification(TEXT, TEXT, TEXT, TEXT, UUID) TO service_role;

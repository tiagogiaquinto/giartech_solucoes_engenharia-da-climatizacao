/*
  # Interdependent Tables: OS + CRM + Agenda + Estoque

  ## Overview
  This migration makes the four core tables fully interdependent with the OS as the
  central entity. It fixes column naming issues from the previous session and adds
  three major capabilities:

  1. **Auto-purchase trigger**: When a material is added to an OS (INSERT on
     service_order_materials), a DB trigger checks inventory (`materials` table)
     and automatically creates a `purchase_requests` record if stock is insufficient.

  2. **Enhanced fn_check_os_stock**: Corrected to handle both Portuguese and English
     column names in service_order_materials.

  3. **Strengthened CRM → OS sync**: The trigger now correctly maps all pipeline
     stage names and also syncs back to agenda_events.

  4. **purchase_requests table**: Dedicated lightweight table (lighter than a full
     purchase_order) for auto-generated material shortage alerts.

  5. **v_customer_os_timeline view**: Aggregated view per customer with all OS data,
     recurrence interval calculation, and event history.

  ## New Tables
  - `purchase_requests`: Auto-generated purchase alerts from OS material shortages

  ## New/Updated Functions
  - `fn_check_os_stock()`: Fixed column name resolution
  - `fn_auto_purchase_on_material_add()`: Trigger function for auto purchase request
  - `fn_sync_crm_to_os()`: Strengthened mapping
  - `fn_customer_recurrence()`: Calculates average days between services per customer

  ## New Views
  - `v_customer_os_timeline`: Full OS timeline per customer with recurrence info
*/

-- ─── 1. PURCHASE REQUESTS TABLE ────────────────────────────────────────────
-- Lightweight auto-generated table for material shortages, distinct from
-- full purchase_orders (which are manually curated)

CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  material_unit text DEFAULT 'un',
  quantity_needed numeric NOT NULL DEFAULT 0,
  quantity_in_stock numeric NOT NULL DEFAULT 0,
  quantity_to_order numeric NOT NULL DEFAULT 0,
  estimated_unit_cost numeric DEFAULT 0,
  estimated_total_cost numeric GENERATED ALWAYS AS (quantity_to_order * estimated_unit_cost) STORED,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','em_cotacao','pedido_feito','recebido','cancelado')),
  urgency text DEFAULT 'normal' CHECK (urgency IN ('baixa','normal','urgente','critica')),
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  notes text,
  auto_generated boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_purchase_requests" ON purchase_requests FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_purchase_requests" ON purchase_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_purchase_requests" ON purchase_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_manage_purchase_requests" ON purchase_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_service_order_id ON purchase_requests(service_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_material_id ON purchase_requests(material_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);

-- ─── 2. TRIGGER: Auto-generate purchase_request when material added to OS ──
-- Fires on INSERT into service_order_materials.
-- Checks the materials table for available stock.
-- If stock < quantity needed, creates a purchase_request.

CREATE OR REPLACE FUNCTION fn_auto_purchase_on_material_add()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_material_id uuid;
  v_material_name text;
  v_material_unit text;
  v_qty_needed numeric;
  v_qty_in_stock numeric := 0;
  v_unit_cost numeric := 0;
  v_qty_to_order numeric;
  v_urgency text;
  v_os_status text;
BEGIN
  -- Resolve material_id and name from both old and new column styles
  v_material_id := COALESCE(NEW.material_id, NULL);
  v_material_name := COALESCE(NEW.material_name, NEW.nome_material, 'Material sem nome');
  v_qty_needed := COALESCE(NEW.quantity, NEW.quantidade, 0);
  v_material_unit := COALESCE(NEW.material_unit, 'un');

  -- Only process if there's a service_order_id and a meaningful quantity
  IF NEW.service_order_id IS NULL OR v_qty_needed <= 0 THEN
    RETURN NEW;
  END IF;

  -- Get current stock from materials table (primary)
  IF v_material_id IS NOT NULL THEN
    SELECT COALESCE(quantity, 0), COALESCE(unit_price, 0), COALESCE(unit, 'un')
    INTO v_qty_in_stock, v_unit_cost, v_material_unit
    FROM materials
    WHERE id = v_material_id;

    -- Fallback to inventory_items if not in materials
    IF v_qty_in_stock = 0 THEN
      SELECT COALESCE(quantity, 0), COALESCE(unit_price, 0), COALESCE(unit, 'un')
      INTO v_qty_in_stock, v_unit_cost, v_material_unit
      FROM inventory_items
      WHERE id = v_material_id;
    END IF;
  END IF;

  -- Check if there's a shortage
  v_qty_to_order := GREATEST(0, v_qty_needed - v_qty_in_stock);
  IF v_qty_to_order <= 0 THEN
    RETURN NEW; -- Stock sufficient, no action needed
  END IF;

  -- Determine urgency from OS status/pipeline_stage
  SELECT status, pipeline_stage INTO v_os_status, v_urgency
  FROM service_orders WHERE id = NEW.service_order_id;

  v_urgency := CASE
    WHEN v_os_status IN ('em_andamento', 'agendada') THEN 'urgente'
    WHEN v_os_status = 'aberta' THEN 'normal'
    ELSE 'normal'
  END;

  -- Avoid duplicate purchase requests for the same OS + material
  IF EXISTS (
    SELECT 1 FROM purchase_requests
    WHERE service_order_id = NEW.service_order_id
      AND material_name = v_material_name
      AND status NOT IN ('cancelado', 'recebido')
  ) THEN
    RETURN NEW;
  END IF;

  -- Create the purchase request
  INSERT INTO purchase_requests (
    service_order_id,
    material_id,
    material_name,
    material_unit,
    quantity_needed,
    quantity_in_stock,
    quantity_to_order,
    estimated_unit_cost,
    status,
    urgency,
    auto_generated,
    notes
  ) VALUES (
    NEW.service_order_id,
    v_material_id,
    v_material_name,
    v_material_unit,
    v_qty_needed,
    v_qty_in_stock,
    v_qty_to_order,
    v_unit_cost,
    'pendente',
    v_urgency,
    true,
    'Gerado automaticamente ao adicionar material na OS'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_purchase_on_material_add ON service_order_materials;
CREATE TRIGGER trg_auto_purchase_on_material_add
  AFTER INSERT ON service_order_materials
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_purchase_on_material_add();

-- ─── 3. FIX fn_check_os_stock (handle both column naming styles) ─────────

CREATE OR REPLACE FUNCTION fn_check_os_stock(p_service_order_id uuid)
RETURNS TABLE(
  material_id uuid,
  material_name text,
  quantity_needed numeric,
  quantity_in_stock numeric,
  quantity_to_buy numeric,
  unit text,
  is_shortage boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH material_needs AS (
    SELECT
      som.material_id AS mat_id,
      -- Handle both column naming conventions
      COALESCE(som.material_name, som.nome_material, 'Material') AS mat_name,
      SUM(COALESCE(som.quantity, som.quantidade, 0)) AS qty_needed
    FROM service_order_materials som
    WHERE som.service_order_id = p_service_order_id
      AND COALESCE(som.quantity, som.quantidade, 0) > 0
    GROUP BY som.material_id, COALESCE(som.material_name, som.nome_material, 'Material')
  )
  SELECT
    mn.mat_id AS material_id,
    mn.mat_name AS material_name,
    mn.qty_needed AS quantity_needed,
    -- Check materials first, then inventory_items
    COALESCE(
      (SELECT m.quantity FROM materials m WHERE m.id = mn.mat_id),
      (SELECT ii.quantity FROM inventory_items ii WHERE ii.id = mn.mat_id),
      0
    ) AS quantity_in_stock,
    GREATEST(0,
      mn.qty_needed - COALESCE(
        (SELECT m.quantity FROM materials m WHERE m.id = mn.mat_id),
        (SELECT ii.quantity FROM inventory_items ii WHERE ii.id = mn.mat_id),
        0
      )
    ) AS quantity_to_buy,
    COALESCE(
      (SELECT m.unit FROM materials m WHERE m.id = mn.mat_id),
      (SELECT ii.unit FROM inventory_items ii WHERE ii.id = mn.mat_id),
      'un'
    ) AS unit,
    (mn.qty_needed > COALESCE(
      (SELECT m.quantity FROM materials m WHERE m.id = mn.mat_id),
      (SELECT ii.quantity FROM inventory_items ii WHERE ii.id = mn.mat_id),
      0
    )) AS is_shortage
  FROM material_needs mn;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_check_os_stock(uuid) TO anon, authenticated;

-- ─── 4. STRENGTHEN fn_sync_crm_to_os ─────────────────────────────────────
-- Re-create with better stage name mapping and proper agenda sync

CREATE OR REPLACE FUNCTION fn_sync_crm_to_os()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_os_status text;
  v_new_pipeline_stage text;
  v_stage_name text;
BEGIN
  IF NEW.service_order_id IS NULL THEN RETURN NEW; END IF;
  IF OLD.stage_id IS NOT DISTINCT FROM NEW.stage_id
     AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT lower(trim(name)) INTO v_stage_name
  FROM crm_stages WHERE id = NEW.stage_id LIMIT 1;

  -- Map CRM stage name to OS status
  v_new_os_status := CASE
    WHEN v_stage_name ILIKE '%cotaç%' OR v_stage_name ILIKE '%orçam%' OR v_stage_name ILIKE '%orcam%'
         OR v_stage_name ILIKE '%prosp%' OR v_stage_name ILIKE '%qualific%' THEN 'aberta'
    WHEN v_stage_name ILIKE '%agend%' THEN 'agendada'
    WHEN v_stage_name ILIKE '%execuç%' OR v_stage_name ILIKE '%execuc%'
         OR v_stage_name ILIKE '%andament%' OR v_stage_name ILIKE '%executa%' THEN 'em_andamento'
    WHEN v_stage_name ILIKE '%conclu%' OR v_stage_name ILIKE '%ganha%'
         OR v_stage_name ILIKE '%fechad%' OR v_stage_name ILIKE '%entregue%' THEN 'concluida'
    WHEN v_stage_name ILIKE '%perd%' OR v_stage_name ILIKE '%cancel%'
         OR v_stage_name ILIKE '%descart%' THEN 'cancelada'
    -- Also map from crm_opportunities.status directly
    WHEN NEW.status = 'ganho' THEN 'concluida'
    WHEN NEW.status = 'perdido' OR NEW.status = 'descartado' THEN 'cancelada'
    ELSE NULL
  END;

  v_new_pipeline_stage := CASE
    WHEN v_stage_name ILIKE '%cotaç%' OR v_stage_name ILIKE '%orçam%' OR v_stage_name ILIKE '%orcam%'
         OR v_stage_name ILIKE '%prosp%' THEN 'orcamento'
    WHEN v_stage_name ILIKE '%agend%' THEN 'agendado'
    WHEN v_stage_name ILIKE '%execuç%' OR v_stage_name ILIKE '%execuc%'
         OR v_stage_name ILIKE '%andament%' THEN 'em_execucao'
    WHEN v_stage_name ILIKE '%conclu%' OR v_stage_name ILIKE '%ganha%'
         OR NEW.status = 'ganho' THEN 'concluido'
    WHEN v_stage_name ILIKE '%cancel%' OR v_stage_name ILIKE '%perd%'
         OR NEW.status IN ('perdido','descartado') THEN 'cancelado'
    ELSE NULL
  END;

  -- Update linked OS
  IF v_new_os_status IS NOT NULL OR v_new_pipeline_stage IS NOT NULL THEN
    UPDATE service_orders SET
      status = COALESCE(v_new_os_status, status),
      pipeline_stage = COALESCE(v_new_pipeline_stage, pipeline_stage),
      updated_at = now()
    WHERE id = NEW.service_order_id;

    -- Sync agenda events linked to this OS
    IF v_new_os_status = 'em_andamento' THEN
      UPDATE agenda_events SET status = 'em_andamento', updated_at = now()
      WHERE service_order_id = NEW.service_order_id AND status NOT IN ('concluido','cancelado');

    ELSIF v_new_os_status = 'concluida' THEN
      UPDATE agenda_events SET status = 'concluido', updated_at = now()
      WHERE service_order_id = NEW.service_order_id;
      -- Set completed_at on OS
      UPDATE service_orders SET completed_at = now() WHERE id = NEW.service_order_id AND completed_at IS NULL;

    ELSIF v_new_os_status = 'cancelada' THEN
      UPDATE agenda_events SET status = 'cancelado', updated_at = now()
      WHERE service_order_id = NEW.service_order_id AND status NOT IN ('concluido');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_crm_to_os ON crm_opportunities;
CREATE TRIGGER trg_sync_crm_to_os
  AFTER UPDATE ON crm_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_crm_to_os();

-- ─── 5. RECURRENCE CALCULATION FUNCTION ──────────────────────────────────

CREATE OR REPLACE FUNCTION fn_customer_recurrence(p_customer_id uuid)
RETURNS TABLE(
  customer_id uuid,
  total_os integer,
  first_os timestamptz,
  last_os timestamptz,
  avg_days_between_services numeric,
  recurrence_label text,
  next_expected_service timestamptz,
  most_common_service text,
  total_revenue numeric,
  avg_ticket numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_days numeric;
  v_total_os integer;
  v_first timestamptz;
  v_last timestamptz;
  v_label text;
  v_next timestamptz;
  v_common_service text;
  v_total_revenue numeric;
  v_avg_ticket numeric;
BEGIN
  -- Calculate from completed OS only
  SELECT
    COUNT(*),
    MIN(COALESCE(completed_at, opened_at, created_at)),
    MAX(COALESCE(completed_at, opened_at, created_at)),
    SUM(COALESCE(total_value, 0)),
    AVG(COALESCE(total_value, 0))
  INTO v_total_os, v_first, v_last, v_total_revenue, v_avg_ticket
  FROM service_orders
  WHERE customer_id = p_customer_id
    AND status NOT IN ('cancelada', 'cancelado');

  -- Average interval between consecutive OS (using window function logic)
  SELECT AVG(gap_days) INTO v_avg_days FROM (
    SELECT
      EXTRACT(EPOCH FROM (
        COALESCE(completed_at, opened_at, created_at) -
        LAG(COALESCE(completed_at, opened_at, created_at)) OVER (ORDER BY COALESCE(completed_at, opened_at, created_at))
      )) / 86400.0 AS gap_days
    FROM service_orders
    WHERE customer_id = p_customer_id
      AND status NOT IN ('cancelada', 'cancelado')
  ) gaps
  WHERE gap_days IS NOT NULL AND gap_days > 0;

  -- Build human-readable label
  v_label := CASE
    WHEN v_avg_days IS NULL OR v_total_os <= 1 THEN 'Primeiro serviço'
    WHEN v_avg_days <= 7 THEN 'Semanal'
    WHEN v_avg_days <= 20 THEN 'Quinzenal'
    WHEN v_avg_days <= 40 THEN 'Mensal'
    WHEN v_avg_days <= 70 THEN 'Bimestral'
    WHEN v_avg_days <= 100 THEN 'Trimestral'
    WHEN v_avg_days <= 190 THEN 'Semestral'
    WHEN v_avg_days <= 380 THEN 'Anual'
    ELSE 'Esporádico'
  END;

  -- Next expected service
  IF v_last IS NOT NULL AND v_avg_days IS NOT NULL THEN
    v_next := v_last + (v_avg_days || ' days')::interval;
  END IF;

  -- Most commonly requested service
  SELECT description INTO v_common_service
  FROM service_orders
  WHERE customer_id = p_customer_id AND description IS NOT NULL AND description != ''
  GROUP BY description
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  RETURN QUERY SELECT
    p_customer_id,
    COALESCE(v_total_os, 0)::integer,
    v_first,
    v_last,
    ROUND(COALESCE(v_avg_days, 0), 1),
    v_label,
    v_next,
    v_common_service,
    COALESCE(v_total_revenue, 0),
    ROUND(COALESCE(v_avg_ticket, 0), 2);
END;
$$;

GRANT EXECUTE ON FUNCTION fn_customer_recurrence(uuid) TO anon, authenticated;

-- ─── 6. CUSTOMER OS TIMELINE VIEW ────────────────────────────────────────

CREATE OR REPLACE VIEW v_customer_os_timeline AS
SELECT
  so.customer_id,
  c.nome_razao AS customer_name,
  so.id AS service_order_id,
  so.order_number,
  so.description,
  so.status,
  so.pipeline_stage,
  so.total_value,
  so.scheduled_at,
  so.completed_at,
  so.created_at,
  so.opened_at,
  -- Timeline event type
  'service_order'::text AS event_type,
  -- Row ordering for timeline display
  ROW_NUMBER() OVER (PARTITION BY so.customer_id ORDER BY COALESCE(so.completed_at, so.opened_at, so.created_at)) AS os_sequence,
  -- Gap from previous OS in days
  EXTRACT(EPOCH FROM (
    COALESCE(so.completed_at, so.opened_at, so.created_at) -
    LAG(COALESCE(so.completed_at, so.opened_at, so.created_at))
      OVER (PARTITION BY so.customer_id ORDER BY COALESCE(so.completed_at, so.opened_at, so.created_at))
  )) / 86400.0 AS days_since_previous_os,
  -- Linked CRM opportunity
  so.crm_opportunity_id,
  crm.titulo AS crm_opportunity_title,
  crm.status AS crm_status,
  -- Associated agenda events count
  (SELECT COUNT(*) FROM agenda_events ae WHERE ae.service_order_id = so.id) AS agenda_event_count,
  -- Materials used count
  (SELECT COUNT(*) FROM service_order_materials som WHERE som.service_order_id = so.id) AS materials_count,
  -- Purchase requests generated
  (SELECT COUNT(*) FROM purchase_requests pr WHERE pr.service_order_id = so.id) AS purchase_requests_count
FROM service_orders so
LEFT JOIN customers c ON c.id = so.customer_id
LEFT JOIN crm_opportunities crm ON crm.id = so.crm_opportunity_id
WHERE so.customer_id IS NOT NULL
ORDER BY so.customer_id, COALESCE(so.completed_at, so.opened_at, so.created_at);

GRANT SELECT ON v_customer_os_timeline TO anon, authenticated;

-- ─── 7. UPDATED fn_customer_360 (include purchase_requests + timeline) ────

CREATE OR REPLACE FUNCTION fn_customer_360(p_customer_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'customer', (SELECT row_to_json(c) FROM customers c WHERE c.id = p_customer_id),

    'os_summary', (
      SELECT json_build_object(
        'total', COUNT(*),
        'abertas', COUNT(*) FILTER (WHERE status IN ('aberta','agendada','em_andamento')),
        'concluidas', COUNT(*) FILTER (WHERE status IN ('concluida','concluido')),
        'canceladas', COUNT(*) FILTER (WHERE status IN ('cancelada','cancelado')),
        'total_gasto', COALESCE(SUM(total_value) FILTER (WHERE status IN ('concluida','concluido')), 0),
        'ticket_medio', COALESCE(AVG(total_value) FILTER (WHERE status IN ('concluida','concluido')), 0),
        'ultima_os', MAX(created_at)
      )
      FROM service_orders WHERE customer_id = p_customer_id
    ),

    'recurrence', (
      SELECT row_to_json(r) FROM fn_customer_recurrence(p_customer_id) r LIMIT 1
    ),

    'timeline', (
      SELECT json_agg(t ORDER BY t.os_sequence)
      FROM (
        SELECT
          service_order_id, order_number, description, status, pipeline_stage,
          total_value, scheduled_at, completed_at, created_at, os_sequence,
          days_since_previous_os, crm_opportunity_title, crm_status,
          agenda_event_count, materials_count, purchase_requests_count
        FROM v_customer_os_timeline
        WHERE customer_id = p_customer_id
      ) t
    ),

    'recent_orders', (
      SELECT json_agg(row_to_json(o) ORDER BY o.created_at DESC)
      FROM (
        SELECT id, order_number, description, status, pipeline_stage, total_value, scheduled_at, created_at
        FROM service_orders WHERE customer_id = p_customer_id
        ORDER BY created_at DESC LIMIT 10
      ) o
    ),

    'crm_opportunities', (
      SELECT json_agg(row_to_json(op) ORDER BY op.created_at DESC)
      FROM (
        SELECT id, titulo, valor, status, temperatura, created_at, service_order_id
        FROM crm_opportunities WHERE customer_id = p_customer_id
        ORDER BY created_at DESC LIMIT 5
      ) op
    ),

    'materials_used', (
      SELECT json_agg(row_to_json(m))
      FROM (
        SELECT
          som.material_id,
          COALESCE(som.material_name, som.nome_material) AS material_name,
          SUM(COALESCE(som.quantity, som.quantidade, 0)) AS total_usado,
          COUNT(DISTINCT som.service_order_id) AS vezes_usado
        FROM service_order_materials som
        JOIN service_orders so ON so.id = som.service_order_id
        WHERE so.customer_id = p_customer_id
        GROUP BY som.material_id, COALESCE(som.material_name, som.nome_material)
        ORDER BY total_usado DESC LIMIT 10
      ) m
    ),

    'agenda_events', (
      SELECT json_agg(row_to_json(ae) ORDER BY ae.start_date DESC)
      FROM (
        SELECT id, title, event_type, status, start_date, end_date, service_order_id
        FROM agenda_events WHERE customer_id = p_customer_id
        ORDER BY start_date DESC LIMIT 10
      ) ae
    ),

    'purchase_requests', (
      SELECT json_agg(row_to_json(pr) ORDER BY pr.created_at DESC)
      FROM (
        SELECT pr.id, pr.material_name, pr.quantity_to_order, pr.status, pr.urgency,
               pr.created_at, so.order_number
        FROM purchase_requests pr
        JOIN service_orders so ON so.id = pr.service_order_id
        WHERE so.customer_id = p_customer_id
        ORDER BY pr.created_at DESC LIMIT 10
      ) pr
    ),

    'finance_summary', (
      SELECT json_build_object(
        'total_receitas', COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'pago'), 0),
        'total_pendente', COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'pendente'), 0)
      )
      FROM finance_entries WHERE customer_id = p_customer_id
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_customer_360(uuid) TO anon, authenticated;

-- ─── 8. OS STATUS CHANGE also propagates to CRM (reverse sync) ───────────

CREATE OR REPLACE FUNCTION fn_os_status_to_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_crm_status text;
BEGIN
  IF NEW.crm_opportunity_id IS NULL THEN RETURN NEW; END IF;
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  v_new_crm_status := CASE NEW.status
    WHEN 'concluida' THEN 'ganho'
    WHEN 'cancelada' THEN 'perdido'
    ELSE NULL
  END;

  IF v_new_crm_status IS NOT NULL THEN
    UPDATE crm_opportunities
    SET status = v_new_crm_status, updated_at = now()
    WHERE id = NEW.crm_opportunity_id
      AND status NOT IN ('ganho','perdido','descartado');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_status_to_crm ON service_orders;
CREATE TRIGGER trg_os_status_to_crm
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_os_status_to_crm();

-- ─── 9. REDUCE INVENTORY WHEN OS IS COMPLETED ────────────────────────────
-- When an OS status changes to 'concluida', deduct materials from inventory

CREATE OR REPLACE FUNCTION fn_deduct_inventory_on_os_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status NOT IN ('concluida','concluido')
     AND NEW.status IN ('concluida','concluido') THEN

    -- Deduct from materials table
    UPDATE materials m
    SET quantity = GREATEST(0, m.quantity - COALESCE(
      (SELECT SUM(COALESCE(som.quantity, som.quantidade, 0))
       FROM service_order_materials som
       WHERE som.service_order_id = NEW.id AND som.material_id = m.id),
      0
    )),
    updated_at = now()
    WHERE m.id IN (
      SELECT material_id FROM service_order_materials
      WHERE service_order_id = NEW.id AND material_id IS NOT NULL
    );

    -- Also deduct from inventory_items
    UPDATE inventory_items ii
    SET quantity = GREATEST(0, ii.quantity - COALESCE(
      (SELECT SUM(COALESCE(som.quantity, som.quantidade, 0))
       FROM service_order_materials som
       WHERE som.service_order_id = NEW.id AND som.material_id = ii.id),
      0
    )),
    updated_at = now()
    WHERE ii.id IN (
      SELECT material_id FROM service_order_materials
      WHERE service_order_id = NEW.id AND material_id IS NOT NULL
    );

    -- Mark purchase requests for this OS as 'recebido' if they exist and were fulfilled
    UPDATE purchase_requests
    SET status = 'recebido', updated_at = now()
    WHERE service_order_id = NEW.id AND status = 'pedido_feito';

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deduct_inventory_on_os_complete ON service_orders;
CREATE TRIGGER trg_deduct_inventory_on_os_complete
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_deduct_inventory_on_os_complete();

-- ─── 10. INDEXES ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_customer_created ON service_orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_order_materials_material_id ON service_order_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_agenda_events_service_order_id ON agenda_events(service_order_id);
CREATE INDEX IF NOT EXISTS idx_crm_opp_service_order ON crm_opportunities(service_order_id);

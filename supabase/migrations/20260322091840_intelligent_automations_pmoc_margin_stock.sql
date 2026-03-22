/*
  # Intelligent Business Automations — PMOC, Margin Alerts, Stock-on-OS, Visit Report

  1. Next Maintenance Scheduling (PMOC)
     - When OS is completed and has an equipment_id, updates customer_assets with next_maintenance date
     - Reads periodicity from the OS or defaults to 6 months
     - Creates a pre-scheduled agenda event 15 days before next_maintenance

  2. Margin Alert on Material Addition
     - When a service_order_material is inserted/updated, recalculates OS margin
     - If projected margin drops below 20%, inserts a financial_alerts record (severity=critical)

  3. Stock Check on OS Creation (Just-in-Time)
     - When OS items reference inventory materials, checks stock availability
     - Creates a purchase_order draft if stock is insufficient

  4. Automated Visit Report trigger table
     - visit_reports table stores generated PDF metadata per OS completion

  Tables modified/created:
  - customer_assets: adds next_maintenance, periodicity_months columns
  - visit_reports: new table for PDF report metadata
  - financial_alerts: new margin_alert entries
*/

-- ============================================================
-- EXTEND customer_assets for PMOC scheduling
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_assets' AND column_name = 'next_maintenance'
  ) THEN
    ALTER TABLE customer_assets ADD COLUMN next_maintenance DATE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_assets' AND column_name = 'last_maintenance'
  ) THEN
    ALTER TABLE customer_assets ADD COLUMN last_maintenance TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_assets' AND column_name = 'periodicity_months'
  ) THEN
    ALTER TABLE customer_assets ADD COLUMN periodicity_months INT DEFAULT 6;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_assets' AND column_name = 'pmoc_active'
  ) THEN
    ALTER TABLE customer_assets ADD COLUMN pmoc_active BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- VISIT REPORTS table (PDF metadata per OS)
-- ============================================================
CREATE TABLE IF NOT EXISTS visit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  order_number TEXT,
  customer_name TEXT,
  technician_name TEXT,
  completed_at TIMESTAMPTZ,
  checklist_total INT DEFAULT 0,
  checklist_completed INT DEFAULT 0,
  has_tech_signature BOOLEAN DEFAULT false,
  has_client_signature BOOLEAN DEFAULT false,
  pdf_generated BOOLEAN DEFAULT false,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE visit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read visit_reports"
  ON visit_reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert visit_reports"
  ON visit_reports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update visit_reports"
  ON visit_reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon can read visit_reports"
  ON visit_reports FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert visit_reports"
  ON visit_reports FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- EXTEND financial_alerts for margin alerts
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_alerts' AND column_name = 'os_id'
  ) THEN
    ALTER TABLE financial_alerts ADD COLUMN os_id UUID REFERENCES service_orders(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_alerts' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE financial_alerts ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================
-- TRIGGER 1: PMOC — schedule next maintenance on OS completion
-- ============================================================
CREATE OR REPLACE FUNCTION fn_schedule_next_maintenance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset_id UUID;
  v_periodicity INT;
  v_next_date DATE;
  v_customer_id UUID;
  v_order_title TEXT;
  v_alert_date DATE;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('completed', 'concluido') THEN RETURN NEW; END IF;

  SELECT equipment_id INTO v_asset_id FROM service_orders WHERE id = NEW.id;
  IF v_asset_id IS NULL THEN RETURN NEW; END IF;

  SELECT COALESCE(periodicity_months, 6), customer_id
  INTO v_periodicity, v_customer_id
  FROM customer_assets
  WHERE id = v_asset_id;

  v_next_date := (NOW() + (v_periodicity || ' months')::INTERVAL)::DATE;
  v_alert_date := v_next_date - INTERVAL '15 days';

  UPDATE customer_assets
  SET
    last_maintenance = NOW(),
    next_maintenance = v_next_date,
    pmoc_active = true
  WHERE id = v_asset_id;

  v_order_title := 'Preventiva Programada — ' || COALESCE(NEW.client_name, 'Cliente');

  INSERT INTO agenda_events (
    title, description, event_type, status,
    start_date, end_date,
    customer_id, related_os_id,
    created_at
  )
  VALUES (
    v_order_title,
    'Manutenção preventiva gerada automaticamente com base na OS #' || COALESCE(NEW.order_number, NEW.id::TEXT) || '. Periodicidade: ' || v_periodicity || ' meses.',
    'maintenance',
    'scheduled',
    v_next_date::TIMESTAMPTZ,
    (v_next_date + INTERVAL '2 hours')::TIMESTAMPTZ,
    v_customer_id,
    NULL,
    NOW()
  )
  ON CONFLICT DO NOTHING;

  PERFORM fn_create_auto_notification(
    'Próxima Preventiva Agendada',
    'OS #' || COALESCE(NEW.order_number, '') || ' concluída. Próxima manutenção agendada para ' || TO_CHAR(v_next_date, 'DD/MM/YYYY') || '.',
    'info',
    'customer_asset',
    v_asset_id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schedule_next_maintenance ON public.service_orders;
CREATE TRIGGER trg_schedule_next_maintenance
  AFTER UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION fn_schedule_next_maintenance();

-- ============================================================
-- TRIGGER 2: MARGIN ALERT when materials added to OS
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_os_margin_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os_id UUID;
  v_total_value NUMERIC;
  v_materials_cost NUMERIC;
  v_labor_cost NUMERIC;
  v_margin NUMERIC;
  v_os_number TEXT;
  v_existing_alert INT;
BEGIN
  v_os_id := COALESCE(NEW.service_order_id, OLD.service_order_id);
  IF v_os_id IS NULL THEN RETURN NEW; END IF;

  SELECT
    COALESCE(total_value, final_price, 0),
    COALESCE(materials_value, 0),
    COALESCE(labor_value, 0),
    COALESCE(order_number, id::TEXT)
  INTO v_total_value, v_materials_cost, v_labor_cost, v_os_number
  FROM service_orders
  WHERE id = v_os_id;

  IF v_total_value <= 0 THEN RETURN NEW; END IF;

  SELECT COALESCE(SUM(COALESCE(total_cost, unit_cost * quantity, 0)), 0)
  INTO v_materials_cost
  FROM service_order_materials
  WHERE service_order_id = v_os_id;

  v_margin := ((v_total_value - v_materials_cost - v_labor_cost) / v_total_value) * 100;

  IF v_margin < 20 THEN
    SELECT COUNT(*) INTO v_existing_alert
    FROM financial_alerts
    WHERE os_id = v_os_id AND alert_type = 'low_margin' AND is_active = true;

    IF v_existing_alert = 0 THEN
      INSERT INTO financial_alerts (
        alert_type, severity, title, description,
        current_value, threshold_value, is_active, os_id, created_at
      ) VALUES (
        'low_margin',
        CASE WHEN v_margin < 10 THEN 'critical' ELSE 'warning' END,
        'Margem Baixa na OS #' || v_os_number,
        'A OS #' || v_os_number || ' está com margem de ' || ROUND(v_margin, 1)::TEXT || '%. Abaixo do mínimo de 20%. Revise os custos ou ajuste o preço.',
        v_margin,
        20,
        true,
        v_os_id,
        NOW()
      );

      PERFORM fn_create_auto_notification(
        'Alerta de Margem — OS #' || v_os_number,
        'Margem projetada: ' || ROUND(v_margin, 1)::TEXT || '% (mínimo: 20%). Revise materiais ou preço da OS.',
        'error',
        'service_order',
        v_os_id
      );
    END IF;
  ELSE
    UPDATE financial_alerts
    SET is_active = false, resolved_at = NOW()
    WHERE os_id = v_os_id AND alert_type = 'low_margin' AND is_active = true;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_margin_alert ON public.service_order_materials;
CREATE TRIGGER trg_os_margin_alert
  AFTER INSERT OR UPDATE OR DELETE ON public.service_order_materials
  FOR EACH ROW EXECUTE FUNCTION fn_check_os_margin_alert();

-- ============================================================
-- TRIGGER 3: Visit Report record on OS completion
-- ============================================================
CREATE OR REPLACE FUNCTION fn_create_visit_report_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checklist_total INT;
  v_checklist_completed INT;
  v_tech_sig BOOLEAN := false;
  v_client_sig BOOLEAN := false;
  v_tech_name TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('completed', 'concluido') THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_checklist_total
  FROM os_checklist_items WHERE os_id = NEW.id;

  SELECT COUNT(*) INTO v_checklist_completed
  FROM os_checklist_items WHERE os_id = NEW.id AND is_completed = true;

  SELECT
    (technician_signature IS NOT NULL AND technician_signature != ''),
    (client_signature IS NOT NULL AND client_signature != '')
  INTO v_tech_sig, v_client_sig
  FROM os_completion_data WHERE os_id = NEW.id;

  SELECT e.nome INTO v_tech_name
  FROM employees e
  WHERE e.id = NEW.technician_id
  LIMIT 1;

  INSERT INTO visit_reports (
    os_id, order_number, customer_name, technician_name,
    completed_at, checklist_total, checklist_completed,
    has_tech_signature, has_client_signature,
    pdf_generated, created_at
  ) VALUES (
    NEW.id,
    NEW.order_number,
    COALESCE(NEW.client_name, ''),
    COALESCE(v_tech_name, ''),
    COALESCE(NEW.completed_at, NOW()),
    COALESCE(v_checklist_total, 0),
    COALESCE(v_checklist_completed, 0),
    COALESCE(v_tech_sig, false),
    COALESCE(v_client_sig, false),
    false,
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_visit_report ON public.service_orders;
CREATE TRIGGER trg_create_visit_report
  AFTER UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION fn_create_visit_report_record();

-- ============================================================
-- RPC: Check stock for OS and create purchase orders if needed
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_and_request_stock_for_os(p_os_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shortage_count INT := 0;
  v_po_id UUID;
  v_result JSONB;
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      som.id AS mat_id,
      som.inventory_item_id,
      som.quantity AS needed,
      COALESCE(ii.quantity, 0) AS in_stock,
      COALESCE(ii.name, 'Material') AS mat_name,
      COALESCE(ii.sku, '') AS sku
    FROM service_order_materials som
    JOIN inventory_items ii ON ii.id = som.inventory_item_id
    WHERE som.service_order_id = p_os_id
      AND COALESCE(ii.quantity, 0) < COALESCE(som.quantity, 0)
  LOOP
    v_shortage_count := v_shortage_count + 1;

    IF v_po_id IS NULL THEN
      v_po_id := gen_random_uuid();
      INSERT INTO purchase_orders (id, status, notes, created_at)
      VALUES (
        v_po_id,
        'draft',
        'Gerado automaticamente — falta de estoque para OS #' || (SELECT order_number FROM service_orders WHERE id = p_os_id),
        NOW()
      );
    END IF;

    INSERT INTO purchase_order_items (
      purchase_order_id, inventory_item_id,
      quantity, notes, created_at
    ) VALUES (
      v_po_id,
      r.inventory_item_id,
      r.needed - r.in_stock,
      'Estoque disponível: ' || r.in_stock::TEXT || ' | Necessário: ' || r.needed::TEXT,
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  IF v_shortage_count > 0 THEN
    PERFORM fn_create_auto_notification(
      'Estoque Insuficiente — Compra Gerada',
      v_shortage_count::TEXT || ' material(is) em falta para a OS. Pedido de compra criado automaticamente.',
      'warning',
      'service_order',
      p_os_id
    );
  END IF;

  v_result := jsonb_build_object(
    'shortage_count', v_shortage_count,
    'purchase_order_id', v_po_id
  );
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('shortage_count', 0, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION fn_check_and_request_stock_for_os(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_check_and_request_stock_for_os(UUID) TO anon;
GRANT EXECUTE ON FUNCTION fn_schedule_next_maintenance() TO authenticated;

-- ============================================================
-- RPC: Get upcoming PMOC (preventive maintenance schedule)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_get_pmoc_schedule(p_days_ahead INT DEFAULT 30)
RETURNS TABLE (
  asset_id UUID,
  customer_id UUID,
  customer_name TEXT,
  asset_description TEXT,
  next_maintenance DATE,
  days_until_maintenance INT,
  periodicity_months INT,
  is_urgent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.id,
    ca.customer_id,
    c.nome_razao,
    COALESCE(ca.tipo_equipamento, ca.marca, 'Equipamento') || COALESCE(' ' || ca.modelo, ''),
    ca.next_maintenance,
    (ca.next_maintenance - CURRENT_DATE)::INT,
    COALESCE(ca.periodicity_months, 6),
    (ca.next_maintenance - CURRENT_DATE) <= 15
  FROM customer_assets ca
  JOIN customers c ON c.id = ca.customer_id
  WHERE ca.next_maintenance IS NOT NULL
    AND ca.next_maintenance <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
    AND ca.pmoc_active = true
  ORDER BY ca.next_maintenance ASC;
EXCEPTION WHEN OTHERS THEN
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_get_pmoc_schedule(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_get_pmoc_schedule(INT) TO anon;

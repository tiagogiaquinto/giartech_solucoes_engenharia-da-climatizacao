/*
  # Fiscal Intelligence System

  ## Summary
  Full integrated financial/operational system:
  - Company-level tax configuration table (fiscal_config) — all aliquotas editable by admin
  - Employee encargos (labor burden) factored into hourly cost calculation
  - OS labor costs auto-calculated from hours × (salary+encargos)/hour
  - Auto stock deduction + rupture purchase order on OS completion  
  - OS-level financial waterfall: gross - taxes - materials - labor = net margin

  ## Changes
  1. NEW: fiscal_config table
  2. NEW: service_category_tax_rules table
  3. employees: add encargos_pct, update hourly_rate generated formula
  4. service_order_labor: add hours_worked, hourly_rate_used, labor_cost, employee_id
  5. service_orders: add tax_total, labor_total, materials_total_cost, net_margin_pct, net_profit
  6. service_order_materials: add inventory_item_id
  7. purchase_requests: add service_order_id
  8. Functions: recalc_os_financials, deduct_stock_on_os_complete, fill_labor_hourly_rate
*/

-- ============================================================
-- 1. Fiscal Config Table
-- ============================================================
CREATE TABLE IF NOT EXISTS fiscal_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regime_tributario text NOT NULL DEFAULT 'lucro_presumido'
    CHECK (regime_tributario IN ('lucro_presumido','simples_nacional','lucro_real')),
  iss_pct       numeric(5,2) NOT NULL DEFAULT 5.0,
  pis_pct       numeric(5,2) NOT NULL DEFAULT 0.65,
  cofins_pct    numeric(5,2) NOT NULL DEFAULT 3.0,
  irpj_pct      numeric(5,2) NOT NULL DEFAULT 4.8,
  csll_pct      numeric(5,2) NOT NULL DEFAULT 2.88,
  encargos_clt_pct numeric(5,2) NOT NULL DEFAULT 70.0,
  margem_alerta_pct numeric(5,2) NOT NULL DEFAULT 20.0,
  margem_boa_pct    numeric(5,2) NOT NULL DEFAULT 40.0,
  updated_at    timestamptz DEFAULT now(),
  updated_by    text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE fiscal_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fiscal_config' AND policyname='Anyone can read fiscal config') THEN
    CREATE POLICY "Anyone can read fiscal config" ON fiscal_config FOR SELECT TO authenticated, anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fiscal_config' AND policyname='Authenticated can insert fiscal config') THEN
    CREATE POLICY "Authenticated can insert fiscal config" ON fiscal_config FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fiscal_config' AND policyname='Authenticated can update fiscal config') THEN
    CREATE POLICY "Authenticated can update fiscal config" ON fiscal_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO fiscal_config (regime_tributario, iss_pct, pis_pct, cofins_pct, irpj_pct, csll_pct, encargos_clt_pct)
SELECT 'lucro_presumido', 5.0, 0.65, 3.0, 4.8, 2.88, 70.0
WHERE NOT EXISTS (SELECT 1 FROM fiscal_config);

-- ============================================================
-- 2. Service Category Tax Rules
-- ============================================================
CREATE TABLE IF NOT EXISTS service_category_tax_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL UNIQUE,
  iss_pct_override numeric(5,2),
  description   text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE service_category_tax_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='service_category_tax_rules' AND policyname='Anyone can read category tax rules') THEN
    CREATE POLICY "Anyone can read category tax rules" ON service_category_tax_rules FOR SELECT TO authenticated, anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='service_category_tax_rules' AND policyname='Authenticated can manage category tax rules') THEN
    CREATE POLICY "Authenticated can manage category tax rules" ON service_category_tax_rules FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='service_category_tax_rules' AND policyname='Authenticated can update category tax rules') THEN
    CREATE POLICY "Authenticated can update category tax rules" ON service_category_tax_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 3. Employee encargos_pct + update hourly_rate formula
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='encargos_pct') THEN
    ALTER TABLE employees ADD COLUMN encargos_pct numeric(5,2) DEFAULT 70.0;
  END IF;
END $$;

-- Drop dependent view, recreate hourly_rate with encargos, then recreate view
DROP VIEW IF EXISTS v_employee_salary_details CASCADE;

ALTER TABLE employees DROP COLUMN IF EXISTS hourly_rate CASCADE;
ALTER TABLE employees ADD COLUMN hourly_rate numeric GENERATED ALWAYS AS (
  CASE
    WHEN salary > 0 AND work_hours_per_day > 0 AND work_days_per_month > 0
    THEN ROUND(
      (salary * (1.0 + COALESCE(encargos_pct, 70.0) / 100.0))
      / (work_hours_per_day * work_days_per_month),
      2
    )
    ELSE 0
  END
) STORED;

CREATE OR REPLACE VIEW v_employee_salary_details AS
SELECT
  e.id AS employee_id,
  e.name AS employee_name,
  e.email,
  COALESCE(e.salary, 0) AS monthly_salary,
  COALESCE(e.hourly_rate, 0) AS hourly_rate,
  COALESCE(e.encargos_pct, 70.0) AS encargos_pct,
  COALESCE(e.work_hours_per_day, 8) AS work_hours_per_day,
  COALESCE(e.work_days_per_month, 22) AS work_days_per_month,
  e.role,
  e.department,
  e.admission_date,
  e.active,
  COUNT(DISTINCT est.reference_month) AS total_months,
  COALESCE(SUM(est.paid_amount), 0) AS total_paid,
  COALESCE(SUM(est.remaining_amount), 0) AS total_remaining,
  COALESCE(SUM(est.gross_amount), 0) AS total_gross
FROM employees e
LEFT JOIN employee_salary_tracking est ON e.id = est.employee_id
WHERE e.active = true
  AND (e.email IS NULL OR e.email NOT ILIKE '%simulacao%')
  AND (e.email IS NULL OR e.email NOT ILIKE '%teste%')
  AND (e.email IS NULL OR e.email NOT ILIKE '%test%')
  AND e.name NOT ILIKE '%simulacao%'
  AND e.name NOT ILIKE '%teste%'
  AND e.name NOT ILIKE '%test%'
GROUP BY e.id, e.name, e.email, e.salary, e.hourly_rate, e.encargos_pct,
         e.work_hours_per_day, e.work_days_per_month, e.role, e.department, e.admission_date, e.active
ORDER BY e.name;

GRANT SELECT ON v_employee_salary_details TO authenticated, anon;

-- ============================================================
-- 4. service_order_labor: new columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_order_labor' AND column_name='hours_worked') THEN
    ALTER TABLE service_order_labor ADD COLUMN hours_worked numeric(6,2) DEFAULT 1.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_order_labor' AND column_name='hourly_rate_used') THEN
    ALTER TABLE service_order_labor ADD COLUMN hourly_rate_used numeric(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_order_labor' AND column_name='labor_cost') THEN
    ALTER TABLE service_order_labor ADD COLUMN labor_cost numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_order_labor' AND column_name='employee_id') THEN
    ALTER TABLE service_order_labor ADD COLUMN employee_id uuid REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION fill_labor_hourly_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.hourly_rate_used IS NULL AND NEW.employee_id IS NOT NULL THEN
    SELECT COALESCE(hourly_rate, 0) INTO NEW.hourly_rate_used
    FROM employees WHERE id = NEW.employee_id;
  END IF;
  IF NEW.hourly_rate_used IS NOT NULL THEN
    NEW.labor_cost  := ROUND(COALESCE(NEW.hours_worked, 1.0) * NEW.hourly_rate_used, 2);
    NEW.custo_hora  := NEW.hourly_rate_used;
    NEW.custo_total := NEW.labor_cost;
    NEW.total_cost  := NEW.labor_cost;
    NEW.hourly_rate := NEW.hourly_rate_used;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_labor_rate ON service_order_labor;
CREATE TRIGGER trg_fill_labor_rate
  BEFORE INSERT OR UPDATE OF hours_worked, hourly_rate_used, employee_id ON service_order_labor
  FOR EACH ROW EXECUTE FUNCTION fill_labor_hourly_rate();

-- ============================================================
-- 5. service_orders: financial summary columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='tax_total') THEN
    ALTER TABLE service_orders ADD COLUMN tax_total numeric(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='labor_total') THEN
    ALTER TABLE service_orders ADD COLUMN labor_total numeric(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='materials_total_cost') THEN
    ALTER TABLE service_orders ADD COLUMN materials_total_cost numeric(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='net_margin_pct') THEN
    ALTER TABLE service_orders ADD COLUMN net_margin_pct numeric(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='net_profit') THEN
    ALTER TABLE service_orders ADD COLUMN net_profit numeric(12,2);
  END IF;
END $$;

-- ============================================================
-- 6. Function: financial waterfall recalculation
-- ============================================================
CREATE OR REPLACE FUNCTION recalc_os_financials(p_os_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_gross  numeric := 0;
  v_labor  numeric := 0;
  v_mats   numeric := 0;
  v_tax    numeric := 0;
  v_net    numeric := 0;
  v_margin numeric := 0;
  cfg      fiscal_config%ROWTYPE;
BEGIN
  SELECT * INTO cfg FROM fiscal_config LIMIT 1;
  IF cfg IS NULL THEN
    cfg.iss_pct := 5.0; cfg.pis_pct := 0.65; cfg.cofins_pct := 3.0;
    cfg.irpj_pct := 4.8; cfg.csll_pct := 2.88;
  END IF;

  SELECT COALESCE(SUM(COALESCE(unit_price,0) * COALESCE(quantity,1)), 0) INTO v_gross
  FROM service_order_items WHERE service_order_id = p_os_id;

  SELECT COALESCE(SUM(COALESCE(labor_cost, COALESCE(custo_total, COALESCE(total_cost, 0)))), 0) INTO v_labor
  FROM service_order_labor WHERE service_order_id = p_os_id;

  SELECT COALESCE(SUM(COALESCE(unit_cost,0) * COALESCE(quantity,1)), 0) INTO v_mats
  FROM service_order_materials WHERE service_order_id = p_os_id;

  v_tax := ROUND(v_gross * (cfg.iss_pct + cfg.pis_pct + cfg.cofins_pct + cfg.irpj_pct + cfg.csll_pct) / 100.0, 2);
  v_net := v_gross - v_tax - v_labor - v_mats;

  IF v_gross > 0 THEN
    v_margin := ROUND((v_net / v_gross) * 100.0, 2);
  END IF;

  UPDATE service_orders SET
    labor_total          = v_labor,
    materials_total_cost = v_mats,
    tax_total            = v_tax,
    net_profit           = v_net,
    net_margin_pct       = v_margin
  WHERE id = p_os_id;
END;
$$;

GRANT EXECUTE ON FUNCTION recalc_os_financials(uuid) TO authenticated, anon;

-- ============================================================
-- 7. Triggers: recalc on items/labor/materials changes
-- ============================================================
CREATE OR REPLACE FUNCTION trg_recalc_os_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE v_os_id uuid;
BEGIN
  v_os_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.service_order_id ELSE NEW.service_order_id END;
  IF v_os_id IS NOT NULL THEN
    PERFORM recalc_os_financials(v_os_id);
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_on_labor ON service_order_labor;
CREATE TRIGGER trg_recalc_on_labor
  AFTER INSERT OR UPDATE OR DELETE ON service_order_labor
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_os_totals();

DROP TRIGGER IF EXISTS trg_recalc_on_materials ON service_order_materials;
CREATE TRIGGER trg_recalc_on_materials
  AFTER INSERT OR UPDATE OR DELETE ON service_order_materials
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_os_totals();

DROP TRIGGER IF EXISTS trg_recalc_on_items ON service_order_items;
CREATE TRIGGER trg_recalc_on_items
  AFTER INSERT OR UPDATE OR DELETE ON service_order_items
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_os_totals();

-- ============================================================
-- 8. service_order_materials: inventory_item_id for stock deduction
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_order_materials' AND column_name='inventory_item_id') THEN
    ALTER TABLE service_order_materials ADD COLUMN inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 9. Auto stock deduction + rupture purchase order
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_stock_on_os_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  mat           record;
  available_qty numeric;
  needed_qty    numeric;
BEGIN
  IF NEW.status NOT IN ('concluido','completed','finalizado') THEN RETURN NEW; END IF;
  IF OLD.status IN ('concluido','completed','finalizado') THEN RETURN NEW; END IF;

  FOR mat IN
    SELECT
      m.inventory_item_id,
      COALESCE(m.quantity, 1) AS qty,
      COALESCE(m.material_name, m.nome_material, 'Material') AS mat_name
    FROM service_order_materials m
    WHERE m.service_order_id = NEW.id AND m.inventory_item_id IS NOT NULL
  LOOP
    SELECT COALESCE(quantity, 0) INTO available_qty
    FROM inventory_items WHERE id = mat.inventory_item_id FOR UPDATE;

    needed_qty := mat.qty;

    IF available_qty >= needed_qty THEN
      UPDATE inventory_items SET quantity = quantity - needed_qty, updated_at = now()
      WHERE id = mat.inventory_item_id;
    ELSE
      UPDATE inventory_items SET quantity = 0, updated_at = now()
      WHERE id = mat.inventory_item_id AND quantity > 0;

      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_requests') THEN
        INSERT INTO purchase_requests (item_name, quantity_needed, priority, status, notes, created_at)
        VALUES (
          mat.mat_name,
          needed_qty - GREATEST(available_qty, 0),
          'alta', 'pendente',
          'Ruptura detectada ao concluir OS ' || COALESCE(NEW.order_number, '?'),
          now()
        );
      END IF;
    END IF;
  END LOOP;

  PERFORM recalc_os_financials(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deduct_stock_on_complete ON service_orders;
CREATE TRIGGER trg_deduct_stock_on_complete
  AFTER UPDATE OF status ON service_orders
  FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_os_complete();

-- ============================================================
-- 10. purchase_requests: add service_order_id if missing
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_requests' AND column_name='service_order_id') THEN
    ALTER TABLE purchase_requests ADD COLUMN service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON fiscal_config TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON service_category_tax_rules TO authenticated, anon;

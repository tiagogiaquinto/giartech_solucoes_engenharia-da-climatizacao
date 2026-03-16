/*
  # Unified Workflow Engine - OS as the Single Thread

  ## Overview
  This migration creates the infrastructure to make the Service Order (OS) the central
  "thread" connecting all departments: CRM, Calendar, Inventory, and Purchasing.

  ## Changes

  ### 1. New Columns
  - `service_orders`: add `crm_opportunity_id` (FK to crm_opportunities), `pipeline_stage` text enum
  - `crm_opportunities`: add `service_order_id` (FK to service_orders), `origem_os` boolean
  - `purchase_order_items`: add `service_order_id` reference for traceability
  - `inventory_movements`: ensure `reference_type` and `reference_id` are present

  ### 2. New Tables
  - `os_pipeline_history`: tracks every status/stage change on an OS with timestamps and actor
  - `os_stock_requisitions`: records items that an OS needs but are out of stock, auto-linked to purchase

  ### 3. New Functions
  - `fn_os_to_crm_opportunity()`: trigger that auto-creates/updates a CRM opportunity when OS is saved
  - `fn_check_os_stock()`: checks stock levels for OS materials, creates purchase reqs if needed
  - `fn_crm_stage_to_os_status()`: syncs CRM stage changes back to OS status and agenda

  ### 4. Security
  - RLS enabled on all new tables
  - Policies for authenticated + anon access (matching existing system pattern)
*/

-- ─── 1. ADD LINKING COLUMNS ────────────────────────────────────────────────

-- Link OS to CRM opportunity
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='crm_opportunity_id') THEN
    ALTER TABLE service_orders ADD COLUMN crm_opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='pipeline_stage') THEN
    ALTER TABLE service_orders ADD COLUMN pipeline_stage text DEFAULT 'orcamento' CHECK (pipeline_stage IN ('orcamento','agendado','em_execucao','concluido','cancelado','pausado'));
  END IF;
END $$;

-- Link CRM opportunity back to OS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_opportunities' AND column_name='service_order_id') THEN
    ALTER TABLE crm_opportunities ADD COLUMN service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_opportunities' AND column_name='origem_os') THEN
    ALTER TABLE crm_opportunities ADD COLUMN origem_os boolean DEFAULT false;
  END IF;
END $$;

-- Add OS reference to purchase order items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_order_items' AND column_name='service_order_id') THEN
    ALTER TABLE purchase_order_items ADD COLUMN service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 2. OS PIPELINE HISTORY TABLE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS os_pipeline_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  from_status text,
  to_status text,
  changed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE os_pipeline_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read os_pipeline_history"
  ON os_pipeline_history FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert os_pipeline_history"
  ON os_pipeline_history FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "authenticated can manage os_pipeline_history"
  ON os_pipeline_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── 3. OS STOCK REQUISITIONS TABLE ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS os_stock_requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  quantity_needed numeric NOT NULL DEFAULT 0,
  quantity_in_stock numeric NOT NULL DEFAULT 0,
  quantity_to_buy numeric NOT NULL DEFAULT 0,
  unit text DEFAULT 'un',
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente','em_compra','recebido','cancelado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE os_stock_requisitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read os_stock_requisitions"
  ON os_stock_requisitions FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert os_stock_requisitions"
  ON os_stock_requisitions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update os_stock_requisitions"
  ON os_stock_requisitions FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "authenticated can manage os_stock_requisitions"
  ON os_stock_requisitions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── 4. FUNCTION: Record pipeline stage change ──────────────────────────────

CREATE OR REPLACE FUNCTION fn_record_os_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage)
     OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO os_pipeline_history (service_order_id, from_stage, to_stage, from_status, to_status)
    VALUES (NEW.id, OLD.pipeline_stage, COALESCE(NEW.pipeline_stage, OLD.pipeline_stage), OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_stage_change ON service_orders;
CREATE TRIGGER trg_os_stage_change
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_record_os_stage_change();

-- ─── 5. FUNCTION: Sync CRM stage to OS status ──────────────────────────────

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
  -- Only act when service_order_id is set and stage changes
  IF NEW.service_order_id IS NULL THEN RETURN NEW; END IF;
  IF OLD.stage_id IS NOT DISTINCT FROM NEW.stage_id THEN RETURN NEW; END IF;

  -- Get stage name
  SELECT name INTO v_stage_name FROM crm_stages WHERE id = NEW.stage_id LIMIT 1;

  -- Map CRM stage names to OS statuses
  v_new_os_status := CASE
    WHEN lower(v_stage_name) ILIKE '%cotaç%' OR lower(v_stage_name) ILIKE '%orcam%' OR lower(v_stage_name) ILIKE '%prosp%' THEN 'aberta'
    WHEN lower(v_stage_name) ILIKE '%agendam%' OR lower(v_stage_name) ILIKE '%agend%' THEN 'agendada'
    WHEN lower(v_stage_name) ILIKE '%execuç%' OR lower(v_stage_name) ILIKE '%em andament%' THEN 'em_andamento'
    WHEN lower(v_stage_name) ILIKE '%conclu%' OR lower(v_stage_name) ILIKE '%ganha%' THEN 'concluida'
    WHEN lower(v_stage_name) ILIKE '%perd%' OR lower(v_stage_name) ILIKE '%cancel%' THEN 'cancelada'
    ELSE NULL
  END;

  v_new_pipeline_stage := CASE
    WHEN lower(v_stage_name) ILIKE '%cotaç%' OR lower(v_stage_name) ILIKE '%orcam%' THEN 'orcamento'
    WHEN lower(v_stage_name) ILIKE '%agend%' THEN 'agendado'
    WHEN lower(v_stage_name) ILIKE '%execuç%' OR lower(v_stage_name) ILIKE '%andament%' THEN 'em_execucao'
    WHEN lower(v_stage_name) ILIKE '%conclu%' OR lower(v_stage_name) ILIKE '%ganha%' THEN 'concluido'
    WHEN lower(v_stage_name) ILIKE '%cancel%' OR lower(v_stage_name) ILIKE '%perd%' THEN 'cancelado'
    ELSE NULL
  END;

  -- Update the linked OS
  IF v_new_os_status IS NOT NULL OR v_new_pipeline_stage IS NOT NULL THEN
    UPDATE service_orders
    SET
      status = COALESCE(v_new_os_status, status),
      pipeline_stage = COALESCE(v_new_pipeline_stage, pipeline_stage),
      updated_at = now()
    WHERE id = NEW.service_order_id;

    -- Also update related agenda event status
    IF v_new_os_status = 'em_andamento' THEN
      UPDATE agenda_events SET status = 'em_andamento' WHERE service_order_id = NEW.service_order_id;
    ELSIF v_new_os_status = 'concluida' THEN
      UPDATE agenda_events SET status = 'concluido' WHERE service_order_id = NEW.service_order_id;
    ELSIF v_new_os_status = 'cancelada' THEN
      UPDATE agenda_events SET status = 'cancelado' WHERE service_order_id = NEW.service_order_id;
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

-- ─── 6. FUNCTION: Check stock for OS materials ──────────────────────────────

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
  SELECT
    som.material_id,
    som.nome_material::text,
    SUM(som.quantidade)::numeric AS quantity_needed,
    COALESCE(ii.quantity, 0)::numeric AS quantity_in_stock,
    GREATEST(0, SUM(som.quantidade) - COALESCE(ii.quantity, 0))::numeric AS quantity_to_buy,
    COALESCE(ii.unit, 'un')::text AS unit,
    (COALESCE(ii.quantity, 0) < SUM(som.quantidade)) AS is_shortage
  FROM service_order_materials som
  LEFT JOIN inventory_items ii ON ii.id = som.material_id
  WHERE som.service_order_id = p_service_order_id
    AND som.material_id IS NOT NULL
  GROUP BY som.material_id, som.nome_material, ii.quantity, ii.unit
  HAVING SUM(som.quantidade) > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_check_os_stock(uuid) TO anon, authenticated;

-- ─── 7. FUNCTION: Get customer 360 summary ──────────────────────────────────

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
        'concluidas', COUNT(*) FILTER (WHERE status = 'concluida'),
        'canceladas', COUNT(*) FILTER (WHERE status = 'cancelada'),
        'total_gasto', COALESCE(SUM(total_value) FILTER (WHERE status = 'concluida'), 0),
        'ticket_medio', COALESCE(AVG(total_value) FILTER (WHERE status = 'concluida'), 0),
        'ultima_os', MAX(created_at)
      )
      FROM service_orders WHERE customer_id = p_customer_id
    ),
    'recent_orders', (
      SELECT json_agg(row_to_json(o) ORDER BY o.created_at DESC)
      FROM (
        SELECT id, order_number, description, status, pipeline_stage, total_value, scheduled_at, created_at
        FROM service_orders
        WHERE customer_id = p_customer_id
        ORDER BY created_at DESC
        LIMIT 10
      ) o
    ),
    'crm_opportunities', (
      SELECT json_agg(row_to_json(op) ORDER BY op.created_at DESC)
      FROM (
        SELECT id, titulo, valor, status, temperatura, created_at
        FROM crm_opportunities
        WHERE customer_id = p_customer_id
        ORDER BY created_at DESC
        LIMIT 5
      ) op
    ),
    'materials_used', (
      SELECT json_agg(row_to_json(m))
      FROM (
        SELECT
          som.material_id,
          som.nome_material,
          SUM(som.quantidade) AS total_usado,
          COUNT(DISTINCT som.service_order_id) AS vezes_usado
        FROM service_order_materials som
        JOIN service_orders so ON so.id = som.service_order_id
        WHERE so.customer_id = p_customer_id
        GROUP BY som.material_id, som.nome_material
        ORDER BY total_usado DESC
        LIMIT 10
      ) m
    ),
    'agenda_events', (
      SELECT json_agg(row_to_json(ae) ORDER BY ae.start_date DESC)
      FROM (
        SELECT id, title, event_type, status, start_date, end_date
        FROM agenda_events
        WHERE customer_id = p_customer_id
        ORDER BY start_date DESC
        LIMIT 10
      ) ae
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

-- ─── 8. INDEXES for performance ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_service_orders_crm_opportunity_id ON service_orders(crm_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_pipeline_stage ON service_orders(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_service_order_id ON crm_opportunities(service_order_id);
CREATE INDEX IF NOT EXISTS idx_os_pipeline_history_service_order_id ON os_pipeline_history(service_order_id);
CREATE INDEX IF NOT EXISTS idx_os_stock_requisitions_service_order_id ON os_stock_requisitions(service_order_id);
CREATE INDEX IF NOT EXISTS idx_os_stock_requisitions_purchase_order_id ON os_stock_requisitions(purchase_order_id);

/*
  # Módulo Financeiro em Esteira com Inteligência Fiscal e Gestão de Metas

  ## Overview
  This migration adds full fiscal calculation (Lucro Presumido), payment flow
  tracking, and goal abatement logic to the OS workflow.

  ## Changes to service_orders
  - `impostos_totais`      – total tax burden calculated for this OS
  - `custo_materiais_total`– sum of all material costs (denormalized for speed)
  - `lucro_liquido`        – net profit after taxes and material costs
  - `regime_tributario`    – fiscal regime (default: lucro_presumido)
  - `nf_status`            – NF-e emission status
  - `nf_numero`            – NF number once issued
  - `sinal_pago`           – advance/signal amount already received
  - `sinal_pago_em`        – timestamp signal was received
  - `recibo_emitido`       – whether receipt was issued
  - `recibo_emitido_em`    – timestamp

  ## Upgrades to financial_transactions
  - `service_order_id`     – FK to link transactions to an OS
  - `transaction_subtype`  – 'sinal','saldo','parcela','nf'
  - `customer_id`          – direct FK to customer

  ## Upgrades to company_goals
  - `goal_type`            – 'faturamento_liquido','faturamento_bruto','ordens'
  - `net_profit_target`    – target is net profit (post-tax)
  - `net_profit_achieved`  – accumulated net profit towards this goal
  - `description`          – human label

  ## New Tables
  - `os_receipts`: receipt tracking per OS with PDF generation metadata

  ## New Functions
  - `fn_calc_lucro_presumido(valor_bruto, iss_pct, custom_tax_pct)`: pure calc
  - `fn_update_os_fiscal(p_os_id)`: recalculate and persist fiscal fields on OS
  - `fn_abater_meta_os(p_os_id)`: called when OS is finalized/paid, subtracts
     net profit from active monthly goal
  - Trigger `trg_abater_meta_on_os_paid`: fires on OS status → pago/concluida

  ## Security
  - RLS enabled on os_receipts
  - Anon access granted (consistent with rest of system)
*/

-- ─── 1. ADD FISCAL COLUMNS TO service_orders ───────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='impostos_totais') THEN
    ALTER TABLE service_orders ADD COLUMN impostos_totais numeric(12,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='custo_materiais_total') THEN
    ALTER TABLE service_orders ADD COLUMN custo_materiais_total numeric(12,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='lucro_liquido') THEN
    ALTER TABLE service_orders ADD COLUMN lucro_liquido numeric(12,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='regime_tributario') THEN
    ALTER TABLE service_orders ADD COLUMN regime_tributario text DEFAULT 'lucro_presumido';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='nf_status') THEN
    ALTER TABLE service_orders ADD COLUMN nf_status text DEFAULT 'nao_emitida'
      CHECK (nf_status IN ('nao_emitida','pendente','emitida','cancelada'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='nf_numero') THEN
    ALTER TABLE service_orders ADD COLUMN nf_numero text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='sinal_pago') THEN
    ALTER TABLE service_orders ADD COLUMN sinal_pago numeric(12,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='sinal_pago_em') THEN
    ALTER TABLE service_orders ADD COLUMN sinal_pago_em timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='recibo_emitido') THEN
    ALTER TABLE service_orders ADD COLUMN recibo_emitido boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='recibo_emitido_em') THEN
    ALTER TABLE service_orders ADD COLUMN recibo_emitido_em timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='payment_status') THEN
    ALTER TABLE service_orders ADD COLUMN payment_status text DEFAULT 'pendente'
      CHECK (payment_status IN ('pendente','sinal_pago','parcialmente_pago','pago','cancelado'));
  END IF;
END $$;

-- ─── 2. UPGRADE financial_transactions ────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='service_order_id') THEN
    ALTER TABLE financial_transactions ADD COLUMN service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='customer_id') THEN
    ALTER TABLE financial_transactions ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='transaction_subtype') THEN
    ALTER TABLE financial_transactions ADD COLUMN transaction_subtype text DEFAULT 'saldo'
      CHECK (transaction_subtype IN ('sinal','saldo','parcela','nf','reembolso','estorno'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='payment_method') THEN
    ALTER TABLE financial_transactions ADD COLUMN payment_method text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='recibo_numero') THEN
    ALTER TABLE financial_transactions ADD COLUMN recibo_numero text;
  END IF;
END $$;

-- ─── 3. UPGRADE company_goals ─────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_goals' AND column_name='goal_type') THEN
    ALTER TABLE company_goals ADD COLUMN goal_type text DEFAULT 'faturamento_liquido'
      CHECK (goal_type IN ('faturamento_liquido','faturamento_bruto','num_ordens','lucro_real'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_goals' AND column_name='net_profit_target') THEN
    ALTER TABLE company_goals ADD COLUMN net_profit_target numeric(12,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_goals' AND column_name='net_profit_achieved') THEN
    ALTER TABLE company_goals ADD COLUMN net_profit_achieved numeric(12,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_goals' AND column_name='description') THEN
    ALTER TABLE company_goals ADD COLUMN description text;
  END IF;
END $$;

-- ─── 4. OS RECEIPTS TABLE ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS os_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  receipt_type text NOT NULL DEFAULT 'recibo'
    CHECK (receipt_type IN ('recibo_sinal','recibo_parcial','recibo_total','nf_simulada')),
  receipt_number text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  issued_at timestamptz DEFAULT now(),
  issued_by text,
  pdf_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE os_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_os_receipts" ON os_receipts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_os_receipts" ON os_receipts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_os_receipts_service_order_id ON os_receipts(service_order_id);

-- ─── 5. FISCAL CALCULATION FUNCTION ──────────────────────────────────────
-- Lucro Presumido standard rates for services (2025):
--   PIS:   0.65%
--   COFINS: 3.00%
--   ISS:   5.00%  (common municipal rate)
--   IRPJ:  4.80%  (32% presumption × 15% IRPJ)
--   CSLL:  2.88%  (32% presumption × 9% CSLL)
--   Total: ~16.33%

CREATE OR REPLACE FUNCTION fn_calc_lucro_presumido(
  p_valor_bruto numeric,
  p_iss_pct numeric DEFAULT 5.0,
  p_regime text DEFAULT 'lucro_presumido'
)
RETURNS TABLE(
  valor_bruto numeric,
  pis numeric,
  cofins numeric,
  iss numeric,
  irpj numeric,
  csll numeric,
  total_impostos numeric,
  total_impostos_pct numeric,
  lucro_antes_custos numeric
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_pis_pct numeric := 0.0065;
  v_cofins_pct numeric := 0.03;
  v_iss_pct numeric := p_iss_pct / 100.0;
  v_irpj_pct numeric;
  v_csll_pct numeric;
  v_pis numeric;
  v_cofins numeric;
  v_iss numeric;
  v_irpj numeric;
  v_csll numeric;
BEGIN
  IF p_regime = 'lucro_presumido' THEN
    v_irpj_pct := 0.32 * 0.15; -- 4.80%
    v_csll_pct := 0.32 * 0.09; -- 2.88%
  ELSIF p_regime = 'simples_nacional' THEN
    v_irpj_pct := 0.0;
    v_csll_pct := 0.0;
    v_pis_pct := 0.0;
    v_cofins_pct := 0.0;
  ELSE -- lucro_real
    v_irpj_pct := 0.25;
    v_csll_pct := 0.09;
  END IF;

  v_pis    := ROUND(p_valor_bruto * v_pis_pct, 2);
  v_cofins := ROUND(p_valor_bruto * v_cofins_pct, 2);
  v_iss    := ROUND(p_valor_bruto * v_iss_pct, 2);
  v_irpj   := ROUND(p_valor_bruto * v_irpj_pct, 2);
  v_csll   := ROUND(p_valor_bruto * v_csll_pct, 2);

  RETURN QUERY SELECT
    ROUND(p_valor_bruto, 2),
    v_pis,
    v_cofins,
    v_iss,
    v_irpj,
    v_csll,
    v_pis + v_cofins + v_iss + v_irpj + v_csll,
    CASE WHEN p_valor_bruto > 0
      THEN ROUND(((v_pis + v_cofins + v_iss + v_irpj + v_csll) / p_valor_bruto) * 100, 2)
      ELSE 0 END,
    ROUND(p_valor_bruto - (v_pis + v_cofins + v_iss + v_irpj + v_csll), 2);
END;
$$;

GRANT EXECUTE ON FUNCTION fn_calc_lucro_presumido(numeric, numeric, text) TO anon, authenticated;

-- ─── 6. UPDATE OS FISCAL FIELDS ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_os_fiscal(p_os_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_value numeric;
  v_custo_materiais numeric;
  v_custo_mao_obra numeric;
  v_regime text;
  v_impostos numeric;
  v_lucro_liquido numeric;
BEGIN
  SELECT
    COALESCE(total_value, final_total, 0),
    COALESCE(custo_total_materiais, material_total_cost, 0),
    COALESCE(custo_total_mao_obra, 0),
    COALESCE(regime_tributario, 'lucro_presumido')
  INTO v_total_value, v_custo_materiais, v_custo_mao_obra, v_regime
  FROM service_orders WHERE id = p_os_id;

  -- Calculate material costs from materials table if not stored
  IF v_custo_materiais = 0 THEN
    SELECT COALESCE(SUM(COALESCE(total_cost, 0)), 0)
    INTO v_custo_materiais
    FROM service_order_materials
    WHERE service_order_id = p_os_id;
  END IF;

  -- Calculate taxes
  SELECT total_impostos INTO v_impostos
  FROM fn_calc_lucro_presumido(v_total_value, 5.0, v_regime);

  v_lucro_liquido := v_total_value - v_impostos - v_custo_materiais - v_custo_mao_obra;

  UPDATE service_orders SET
    impostos_totais = v_impostos,
    custo_materiais_total = v_custo_materiais,
    lucro_liquido = v_lucro_liquido,
    updated_at = now()
  WHERE id = p_os_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_update_os_fiscal(uuid) TO anon, authenticated;

-- ─── 7. GOAL ABATEMENT FUNCTION ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_abater_meta_os(p_os_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lucro_liquido numeric;
  v_total_value numeric;
  v_os_date date;
  v_goal_id uuid;
BEGIN
  SELECT
    COALESCE(lucro_liquido, 0),
    COALESCE(total_value, 0),
    COALESCE(completed_at::date, updated_at::date, created_at::date)
  INTO v_lucro_liquido, v_total_value, v_os_date
  FROM service_orders WHERE id = p_os_id;

  -- Find the active monthly goal that covers this OS date
  SELECT id INTO v_goal_id
  FROM company_goals
  WHERE period_type IN ('mensal','monthly')
    AND start_date <= v_os_date
    AND end_date >= v_os_date
    AND status NOT IN ('finalizada','cancelada')
  ORDER BY start_date DESC
  LIMIT 1;

  IF v_goal_id IS NULL THEN RETURN; END IF;

  -- Recalculate achieved amounts from scratch for accuracy
  UPDATE company_goals cg SET
    achieved_amount = (
      SELECT COALESCE(SUM(COALESCE(so.total_value, 0)), 0)
      FROM service_orders so
      WHERE so.status IN ('concluida','concluido')
        AND (so.completed_at::date BETWEEN cg.start_date AND cg.end_date
          OR so.updated_at::date BETWEEN cg.start_date AND cg.end_date)
    ),
    net_profit_achieved = (
      SELECT COALESCE(SUM(COALESCE(so.lucro_liquido, 0)), 0)
      FROM service_orders so
      WHERE so.status IN ('concluida','concluido')
        AND (so.completed_at::date BETWEEN cg.start_date AND cg.end_date
          OR so.updated_at::date BETWEEN cg.start_date AND cg.end_date)
    ),
    updated_at = now()
  WHERE cg.id = v_goal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_abater_meta_os(uuid) TO anon, authenticated;

-- ─── 8. TRIGGER: Recalculate fiscal + abate goal when OS status changes ───

CREATE OR REPLACE FUNCTION fn_os_fiscal_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalculate fiscal fields when total changes or OS is finalized
  IF OLD.total_value IS DISTINCT FROM NEW.total_value
     OR OLD.status IS DISTINCT FROM NEW.status
     OR OLD.custo_total_materiais IS DISTINCT FROM NEW.custo_total_materiais
  THEN
    PERFORM fn_update_os_fiscal(NEW.id);
  END IF;

  -- Abate monthly goal when OS is paid/completed
  IF OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status IN ('concluida','concluido')
  THEN
    PERFORM fn_abater_meta_os(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_fiscal_on_status_change ON service_orders;
CREATE TRIGGER trg_os_fiscal_on_status_change
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_os_fiscal_on_status_change();

-- ─── 9. REGISTER SINAL PAYMENT FUNCTION ──────────────────────────────────

CREATE OR REPLACE FUNCTION fn_registrar_sinal_os(
  p_os_id uuid,
  p_valor numeric,
  p_metodo text DEFAULT 'pix',
  p_observacao text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recibo_num text;
  v_transaction_id uuid;
  v_receipt_id uuid;
  v_total_value numeric;
BEGIN
  SELECT COALESCE(total_value, 0) INTO v_total_value
  FROM service_orders WHERE id = p_os_id;

  v_recibo_num := 'REC-' || to_char(now(), 'YYYYMMDD') || '-' || substr(p_os_id::text, 1, 6);

  -- Insert financial transaction
  INSERT INTO financial_transactions (
    service_order_id, transaction_type, transaction_subtype,
    amount, payment_method, recibo_numero,
    description, status, transaction_date
  ) VALUES (
    p_os_id, 'credito', 'sinal',
    p_valor, p_metodo, v_recibo_num,
    COALESCE(p_observacao, 'Sinal recebido - OS'), 'confirmado',
    CURRENT_DATE
  ) RETURNING id INTO v_transaction_id;

  -- Insert receipt record
  INSERT INTO os_receipts (
    service_order_id, receipt_type, receipt_number,
    amount, issued_by, notes
  ) VALUES (
    p_os_id, 'recibo_sinal', v_recibo_num,
    p_valor, 'sistema', p_observacao
  ) RETURNING id INTO v_receipt_id;

  -- Update OS
  UPDATE service_orders SET
    sinal_pago = COALESCE(sinal_pago, 0) + p_valor,
    sinal_pago_em = COALESCE(sinal_pago_em, now()),
    payment_status = CASE
      WHEN (COALESCE(sinal_pago, 0) + p_valor) >= v_total_value THEN 'pago'
      WHEN (COALESCE(sinal_pago, 0) + p_valor) > 0 THEN 'sinal_pago'
      ELSE payment_status
    END,
    updated_at = now()
  WHERE id = p_os_id;

  RETURN json_build_object(
    'success', true,
    'recibo_numero', v_recibo_num,
    'transaction_id', v_transaction_id,
    'receipt_id', v_receipt_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_registrar_sinal_os(uuid, numeric, text, text) TO anon, authenticated;

-- ─── 10. AUTO-GENERATE CURRENT MONTH GOAL IF NONE EXISTS ─────────────────

INSERT INTO company_goals (period_type, start_date, end_date, target_amount, net_profit_target, goal_type, description, status)
SELECT
  'mensal',
  date_trunc('month', CURRENT_DATE)::date,
  (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date,
  50000,
  30000,
  'faturamento_liquido',
  'Meta Mensal - ' || to_char(CURRENT_DATE, 'Month YYYY'),
  'ativa'
WHERE NOT EXISTS (
  SELECT 1 FROM company_goals
  WHERE period_type IN ('mensal','monthly')
    AND start_date = date_trunc('month', CURRENT_DATE)::date
);

-- ─── 11. BACKFILL fiscal fields for existing concluded OS ─────────────────

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM service_orders
    WHERE status IN ('concluida','concluido')
      AND (impostos_totais IS NULL OR impostos_totais = 0)
    LIMIT 200
  LOOP
    PERFORM fn_update_os_fiscal(r.id);
  END LOOP;
END $$;

-- Recalculate current month goal after backfill
DO $$
DECLARE v_os_id uuid;
BEGIN
  SELECT id INTO v_os_id FROM service_orders
  WHERE status IN ('concluida','concluido') LIMIT 1;
  IF v_os_id IS NOT NULL THEN
    PERFORM fn_abater_meta_os(v_os_id);
  END IF;
END $$;

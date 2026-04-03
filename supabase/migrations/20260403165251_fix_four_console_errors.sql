/*
  # Fix Four Console Errors

  1. service_order_audit_log FK violation on DELETE
     - Drop the AFTER DELETE audit triggers that try to INSERT into audit log
       referencing the already-deleted OS row, causing the FK violation.
     - Re-create them for INSERT/UPDATE only.

  2. emails view missing from_email, from_name, body_text, folder
     - The `emails` view wraps `email_logs` table.
     - Add missing columns to email_logs, then recreate the view with all needed columns.

  3. v_financial_intelligence missing reference_date column
     - Recreate the view adding reference_date as an alias for data_referencia.

  4. service_orders missing execution_deadline column
     - Add the column and backfill from data_fim_execucao.
*/

-- ============================================================
-- 1. Fix audit trigger: drop DELETE variant to prevent FK violation
-- ============================================================
DROP TRIGGER IF EXISTS audit_service_orders_trigger ON service_orders;
DROP TRIGGER IF EXISTS trigger_audit_service_orders ON service_orders;

DO $$
DECLARE
  fn_name text;
BEGIN
  SELECT p.proname INTO fn_name
  FROM pg_proc p
  JOIN pg_trigger t ON t.tgfoid = p.oid
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE c.relname = 'service_orders'
    AND t.tgname IN ('audit_service_orders_trigger','trigger_audit_service_orders')
  LIMIT 1;

  IF fn_name IS NOT NULL THEN
    EXECUTE format(
      'CREATE TRIGGER audit_service_orders_trigger
       AFTER INSERT OR UPDATE ON service_orders
       FOR EACH ROW EXECUTE FUNCTION %I()', fn_name
    );
  END IF;
END $$;

-- ============================================================
-- 2. Add missing columns to email_logs, recreate emails view
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='from_email') THEN
    ALTER TABLE email_logs ADD COLUMN from_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='from_name') THEN
    ALTER TABLE email_logs ADD COLUMN from_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='body_text') THEN
    ALTER TABLE email_logs ADD COLUMN body_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='folder') THEN
    ALTER TABLE email_logs ADD COLUMN folder text DEFAULT 'inbox';
  END IF;
END $$;

DROP VIEW IF EXISTS emails CASCADE;

CREATE OR REPLACE VIEW emails AS
SELECT
  id,
  recipient_email AS "to",
  subject,
  status,
  created_at AS received_at,
  from_email,
  from_name,
  body_text,
  folder
FROM email_logs;

GRANT SELECT ON emails TO anon, authenticated;

-- ============================================================
-- 3. Recreate v_financial_intelligence with reference_date alias
-- ============================================================
DROP VIEW IF EXISTS v_financial_intelligence CASCADE;

CREATE OR REPLACE VIEW v_financial_intelligence AS
SELECT
  id,
  COALESCE(total_value, 0)                                                              AS faturamento,
  (COALESCE(unit_cost, 0) + COALESCE(materials_cost, 0) + COALESCE(labor_cost, 0))     AS custo_total,
  (COALESCE(total_value, 0) * 0.163)                                                    AS impostos,
  (
    COALESCE(total_value, 0)
    - (COALESCE(unit_cost, 0) + COALESCE(materials_cost, 0) + COALESCE(labor_cost, 0))
    - (COALESCE(total_value, 0) * 0.163)
  )                                                                                     AS lucro_liquido,
  created_at::date AS data_referencia,
  created_at::date AS reference_date
FROM service_orders;

GRANT SELECT ON v_financial_intelligence TO anon, authenticated;

-- ============================================================
-- 4. Add execution_deadline to service_orders
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'execution_deadline'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN execution_deadline date;
    UPDATE service_orders
    SET execution_deadline = data_fim_execucao::date
    WHERE data_fim_execucao IS NOT NULL;
  END IF;
END $$;

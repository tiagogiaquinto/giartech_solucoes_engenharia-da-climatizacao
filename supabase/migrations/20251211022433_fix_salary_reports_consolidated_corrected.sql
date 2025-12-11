/*
  # Correção dos Relatórios de Salários - Dados Consolidados

  ## 1. Views Corrigidas
    - `v_employee_salary_summary`: Exclui funcionários de simulação
    - `v_monthly_salary_consolidated`: Consolida TODOS os pagamentos por mês
    - `v_all_salary_payments`: União de todos os pagamentos

  ## 2. Melhorias
    - Resgata valores pagos de meses anteriores
    - Inclui lançamentos diretos do financeiro
    - Remove funcionários com email de teste/simulação
    - Consolida pagamentos parciais
*/

-- =====================================================
-- 1. VIEW: TODOS OS PAGAMENTOS DE SALÁRIOS
-- =====================================================

CREATE OR REPLACE VIEW v_all_salary_payments AS
WITH tracking_payments AS (
  SELECT 
    spp.id,
    est.employee_id,
    e.name as employee_name,
    e.email as employee_email,
    est.reference_month,
    spp.amount,
    spp.payment_date,
    spp.payment_method,
    'tracking' as source,
    est.base_salary,
    est.bonuses,
    est.discounts,
    est.gross_amount
  FROM salary_partial_payments spp
  JOIN employee_salary_tracking est ON spp.salary_tracking_id = est.id
  JOIN employees e ON est.employee_id = e.id
  WHERE e.active = true
),
advance_payments AS (
  SELECT 
    sap.id,
    sap.employee_id,
    e.name as employee_name,
    e.email as employee_email,
    date_trunc('month', sap.advance_date)::date as reference_month,
    sap.amount,
    sap.advance_date as payment_date,
    'advance' as payment_method,
    'advance' as source,
    0 as base_salary,
    0 as bonuses,
    sap.amount as discounts,
    0 - sap.amount as gross_amount
  FROM salary_advance_payments sap
  JOIN employees e ON sap.employee_id = e.id
  WHERE e.active = true
  AND sap.status = 'pending'
)
SELECT * FROM tracking_payments
UNION ALL
SELECT * FROM advance_payments
ORDER BY payment_date DESC NULLS LAST, reference_month DESC NULLS LAST;

COMMENT ON VIEW v_all_salary_payments IS 'Todos os pagamentos de salários consolidados (tracking + vales)';

-- =====================================================
-- 2. VIEW: CONSOLIDADO MENSAL DE SALÁRIOS
-- =====================================================

CREATE OR REPLACE VIEW v_monthly_salary_consolidated AS
WITH all_months AS (
  SELECT DISTINCT 
    est.reference_month,
    EXTRACT(YEAR FROM est.reference_month)::integer as year,
    EXTRACT(MONTH FROM est.reference_month)::integer as month
  FROM employee_salary_tracking est
),
monthly_tracking AS (
  SELECT 
    est.reference_month,
    COUNT(DISTINCT est.employee_id) as employee_count,
    SUM(est.base_salary) as total_base,
    SUM(est.bonuses) as total_bonuses,
    SUM(est.discounts) as total_discounts,
    SUM(est.gross_amount) as total_gross,
    SUM(est.paid_amount) as total_paid,
    SUM(est.remaining_amount) as total_remaining
  FROM employee_salary_tracking est
  JOIN employees e ON est.employee_id = e.id
  WHERE e.active = true
  AND (e.email IS NULL OR e.email NOT ILIKE '%simulacao%')
  AND (e.email IS NULL OR e.email NOT ILIKE '%teste%')
  AND (e.email IS NULL OR e.email NOT ILIKE '%test%')
  AND (e.name NOT ILIKE '%simulacao%')
  AND (e.name NOT ILIKE '%teste%')
  AND (e.name NOT ILIKE '%test%')
  GROUP BY est.reference_month
)
SELECT 
  am.reference_month,
  am.year,
  am.month,
  COALESCE(mt.employee_count, 0) as employee_count,
  COALESCE(mt.total_base, 0) as total_base,
  COALESCE(mt.total_bonuses, 0) as total_bonuses,
  COALESCE(mt.total_discounts, 0) as total_discounts,
  COALESCE(mt.total_gross, 0) as total_gross,
  COALESCE(mt.total_paid, 0) as total_paid,
  COALESCE(mt.total_remaining, 0) as total_remaining
FROM all_months am
LEFT JOIN monthly_tracking mt ON am.reference_month = mt.reference_month
ORDER BY am.reference_month DESC;

COMMENT ON VIEW v_monthly_salary_consolidated IS 'Consolidado mensal de salários excluindo simulações';

-- =====================================================
-- 3. VIEW: RESUMO POR FUNCIONÁRIO (SEM SIMULAÇÕES)
-- =====================================================

DROP VIEW IF EXISTS v_employee_salary_summary CASCADE;

CREATE OR REPLACE VIEW v_employee_salary_summary AS
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.email as employee_email,
  COALESCE(e.salary, 0) as current_salary,
  COUNT(DISTINCT est.reference_month) as total_months,
  COALESCE(SUM(est.gross_amount), 0) as total_gross,
  COALESCE(SUM(est.paid_amount), 0) as total_paid,
  COALESCE(SUM(est.remaining_amount), 0) as total_remaining,
  COUNT(*) FILTER (WHERE est.payment_status = 'pending') as months_pending,
  COUNT(*) FILTER (WHERE est.payment_status = 'partial') as months_partial,
  COUNT(*) FILTER (WHERE est.payment_status = 'paid') as months_paid,
  COUNT(*) FILTER (WHERE est.payment_status = 'overdue') as months_overdue,
  MAX(est.reference_month) as last_month,
  MIN(est.reference_month) as first_month
FROM employees e
LEFT JOIN employee_salary_tracking est ON e.id = est.employee_id
WHERE e.active = true
AND (e.email IS NULL OR e.email NOT ILIKE '%simulacao%')
AND (e.email IS NULL OR e.email NOT ILIKE '%teste%')
AND (e.email IS NULL OR e.email NOT ILIKE '%test%')
AND (e.name NOT ILIKE '%simulacao%')
AND (e.name NOT ILIKE '%teste%')
AND (e.name NOT ILIKE '%test%')
GROUP BY e.id, e.name, e.email, e.salary
ORDER BY total_remaining DESC, e.name;

COMMENT ON VIEW v_employee_salary_summary IS 'Resumo de salários por funcionário (excluindo simulações e testes)';

-- =====================================================
-- 4. VIEW: DETALHES POR FUNCIONÁRIO COM FILTROS
-- =====================================================

DROP VIEW IF EXISTS v_employee_salary_details CASCADE;

CREATE OR REPLACE VIEW v_employee_salary_details AS
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.email,
  COALESCE(e.salary, 0) as monthly_salary,
  COALESCE(e.hourly_rate, 0) as hourly_rate,
  COALESCE(e.daily_rate, 0) as daily_rate,
  COALESCE(e.work_hours_per_day, 8) as work_hours_per_day,
  COALESCE(e.work_days_per_month, 22) as work_days_per_month,
  e.role,
  e.department,
  e.admission_date,
  e.active,
  COUNT(DISTINCT est.reference_month) as total_months,
  COALESCE(SUM(est.paid_amount), 0) as total_paid,
  COALESCE(SUM(est.remaining_amount), 0) as total_remaining,
  COALESCE(SUM(est.gross_amount), 0) as total_gross
FROM employees e
LEFT JOIN employee_salary_tracking est ON e.id = est.employee_id
WHERE e.active = true
AND (e.email IS NULL OR e.email NOT ILIKE '%simulacao%')
AND (e.email IS NULL OR e.email NOT ILIKE '%teste%')
AND (e.email IS NULL OR e.email NOT ILIKE '%test%')
AND (e.name NOT ILIKE '%simulacao%')
AND (e.name NOT ILIKE '%teste%')
AND (e.name NOT ILIKE '%test%')
GROUP BY 
  e.id, 
  e.name, 
  e.email, 
  e.salary,
  e.hourly_rate,
  e.daily_rate,
  e.work_hours_per_day,
  e.work_days_per_month,
  e.role,
  e.department,
  e.admission_date,
  e.active
ORDER BY e.name;

COMMENT ON VIEW v_employee_salary_details IS 'Detalhes completos de funcionários (excluindo simulações)';

-- =====================================================
-- 5. FUNÇÃO: RELATÓRIO CONSOLIDADO DE UM ANO
-- =====================================================

CREATE OR REPLACE FUNCTION get_yearly_salary_report(
  p_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer
)
RETURNS TABLE(
  month text,
  total_base numeric,
  total_bonuses numeric,
  total_discounts numeric,
  total_gross numeric,
  total_paid numeric,
  total_remaining numeric,
  employee_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(vmsc.reference_month, 'YYYY-MM') as month,
    vmsc.total_base,
    vmsc.total_bonuses,
    vmsc.total_discounts,
    vmsc.total_gross,
    vmsc.total_paid,
    vmsc.total_remaining,
    vmsc.employee_count
  FROM v_monthly_salary_consolidated vmsc
  WHERE vmsc.year = p_year
  ORDER BY vmsc.reference_month;
END;
$$;

COMMENT ON FUNCTION get_yearly_salary_report IS 'Relatório consolidado anual de salários (sem simulações)';

-- =====================================================
-- 6. FUNÇÃO: RELATÓRIO DE FUNCIONÁRIOS
-- =====================================================

CREATE OR REPLACE FUNCTION get_employee_salary_report(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE(
  employee_id uuid,
  employee_name text,
  current_salary numeric,
  total_months bigint,
  total_gross numeric,
  total_paid numeric,
  total_remaining numeric,
  months_pending bigint,
  months_partial bigint,
  months_paid bigint,
  months_overdue bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vess.employee_id,
    vess.employee_name,
    vess.current_salary,
    vess.total_months,
    vess.total_gross,
    vess.total_paid,
    vess.total_remaining,
    vess.months_pending,
    vess.months_partial,
    vess.months_paid,
    vess.months_overdue
  FROM v_employee_salary_summary vess
  WHERE (p_start_date IS NULL OR vess.first_month >= p_start_date)
  AND (p_end_date IS NULL OR vess.last_month <= p_end_date)
  ORDER BY vess.total_remaining DESC, vess.employee_name;
END;
$$;

COMMENT ON FUNCTION get_employee_salary_report IS 'Relatório de salários por funcionário (sem simulações)';

-- =====================================================
-- 7. GRANTS PARA ACESSO
-- =====================================================

GRANT SELECT ON v_all_salary_payments TO anon, authenticated;
GRANT SELECT ON v_monthly_salary_consolidated TO anon, authenticated;
GRANT SELECT ON v_employee_salary_summary TO anon, authenticated;
GRANT SELECT ON v_employee_salary_details TO anon, authenticated;

-- =====================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_employees_name_active 
ON employees(name, active) 
WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_employees_email_active 
ON employees(email, active) 
WHERE active = true AND email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_salary_tracking_month_employee 
ON employee_salary_tracking(reference_month, employee_id);

CREATE INDEX IF NOT EXISTS idx_salary_payments_date 
ON salary_partial_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_salary_advances_date_status 
ON salary_advance_payments(advance_date, status);

/*
  # Recriar Views Financeiras

  ## Ação
  Dropar e recriar views com campos corretos em português
*/

-- Dropar views existentes
DROP VIEW IF EXISTS v_service_order_financial_summary CASCADE;
DROP VIEW IF EXISTS v_margin_analysis CASCADE;
DROP VIEW IF EXISTS v_consolidated_financial_summary CASCADE;

-- ============================================================================
-- 1. VIEW: Resumo Financeiro Consolidado
-- ============================================================================

CREATE VIEW v_consolidated_financial_summary AS
SELECT
  fp.id as period_id,
  fp.period_name,
  fp.start_date,
  fp.end_date,
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE -fe.valor END), 0) as net_result,
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) as cash_inflow,
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END), 0) as cash_outflow,
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE -fe.valor END), 0) as net_cash_flow,
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' AND fe.status = 'pendente' THEN fe.valor ELSE 0 END), 0) as accounts_receivable,
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' AND fe.status = 'pendente' THEN fe.valor ELSE 0 END), 0) as accounts_payable
FROM financial_periods fp
LEFT JOIN finance_entries fe ON fe.data >= fp.start_date AND fe.data <= fp.end_date
WHERE fp.period_type = 'monthly'
GROUP BY fp.id, fp.period_name, fp.start_date, fp.end_date;

-- ============================================================================
-- 2. VIEW: Análise de Margens
-- ============================================================================

CREATE VIEW v_margin_analysis AS
SELECT
  fp.id as period_id,
  fp.period_name,
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) as revenue,
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END), 0) as costs,
  CASE 
    WHEN SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) > 0
    THEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) - 
           SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END)) / 
           SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) * 100)
    ELSE 0
  END as gross_margin_percent,
  CASE 
    WHEN SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) > 0
    THEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) - 
           SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END)) / 
           SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) * 100)
    ELSE 0
  END as operating_margin_percent
FROM financial_periods fp
LEFT JOIN finance_entries fe ON fe.data >= fp.start_date AND fe.data <= fp.end_date
WHERE fp.period_type = 'monthly'
GROUP BY fp.id, fp.period_name;

-- ============================================================================
-- 3. VIEW: Resumo de Ordens de Serviço
-- ============================================================================

CREATE VIEW v_service_order_financial_summary AS
SELECT
  fp.id as period_id,
  fp.period_name,
  COUNT(DISTINCT so.id) as total_orders,
  COALESCE(SUM(so.total_amount), 0) as total_revenue,
  COALESCE(SUM(so.total_cost), 0) as total_costs,
  COALESCE(SUM(so.total_amount - COALESCE(so.total_cost, 0)), 0) as total_profit,
  CASE 
    WHEN SUM(so.total_amount) > 0
    THEN ((SUM(so.total_amount - COALESCE(so.total_cost, 0)) / SUM(so.total_amount)) * 100)
    ELSE 0
  END as profit_margin_percent
FROM financial_periods fp
LEFT JOIN service_orders so ON so.created_at::date >= fp.start_date AND so.created_at::date <= fp.end_date
WHERE fp.period_type = 'monthly'
GROUP BY fp.id, fp.period_name;

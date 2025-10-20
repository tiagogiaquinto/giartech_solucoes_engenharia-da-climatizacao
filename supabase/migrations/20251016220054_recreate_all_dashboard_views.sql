/*
  # Recriar Views de Dashboard

  Dropar e recriar todas as views com estrutura correta
*/

-- Dropar views existentes
DROP VIEW IF EXISTS v_service_order_financial_summary CASCADE;
DROP VIEW IF EXISTS v_stock_movements CASCADE;
DROP VIEW IF EXISTS v_team_productivity CASCADE;
DROP VIEW IF EXISTS v_customer_profitability CASCADE;
DROP VIEW IF EXISTS v_service_performance CASCADE;
DROP VIEW IF EXISTS v_business_kpis CASCADE;

-- =====================================================
-- 1. VIEW: KPIs PRINCIPAIS DO NEGÓCIO
-- =====================================================

CREATE VIEW v_business_kpis AS
WITH order_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'concluida') as total_completed_orders,
    COUNT(*) FILTER (WHERE status IN ('aberta', 'em_andamento')) as orders_in_progress,
    COUNT(*) FILTER (WHERE status = 'cancelada') as cancelled_orders,
    COALESCE(SUM(final_total) FILTER (WHERE status = 'concluida'), 0) as total_revenue,
    COALESCE(AVG(final_total) FILTER (WHERE status = 'concluida'), 0) as avg_order_value,
    COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) FILTER (WHERE status = 'concluida' AND completed_at IS NOT NULL), 0) as avg_service_time_hours,
    COUNT(DISTINCT customer_id) FILTER (WHERE status = 'concluida') as active_customers,
    COALESCE(SUM(custo_total) FILTER (WHERE status = 'concluida'), 0) as total_costs,
    COALESCE(SUM(lucro_total) FILTER (WHERE status = 'concluida'), 0) as net_profit
  FROM service_orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
),
customer_stats AS (
  SELECT COUNT(*) as total_customers
  FROM customers
),
material_stats AS (
  SELECT
    COUNT(*) as materials_in_stock,
    COALESCE(SUM(quantity * unit_price), 0) as total_inventory_value,
    COALESCE(SUM(quantity * (COALESCE(sale_price, unit_price) - unit_price)), 0) as potential_profit
  FROM materials
  WHERE quantity > 0
),
finance_stats AS (
  SELECT
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'pago'), 0) as total_income,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) as total_expenses,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'pendente'), 0) as accounts_receivable,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pendente'), 0) as accounts_payable
  FROM finance_entries
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
),
employee_stats AS (
  SELECT
    COUNT(*) as active_employees,
    COALESCE(SUM(salary), 0) as total_payroll
  FROM employees
  WHERE active = true
)
SELECT
  o.total_completed_orders,
  o.orders_in_progress,
  o.cancelled_orders,
  o.total_revenue,
  o.avg_order_value,
  CASE 
    WHEN o.total_completed_orders + o.cancelled_orders > 0 
    THEN (o.total_completed_orders::NUMERIC / (o.total_completed_orders + o.cancelled_orders) * 100)
    ELSE 0 
  END as conversion_rate,
  o.avg_service_time_hours,
  c.total_customers,
  o.active_customers,
  m.materials_in_stock,
  m.total_inventory_value,
  m.potential_profit,
  f.total_income,
  f.total_expenses,
  f.accounts_receivable,
  f.accounts_payable,
  e.active_employees,
  e.total_payroll,
  o.net_profit,
  CASE 
    WHEN o.total_revenue > 0 
    THEN (o.net_profit / o.total_revenue * 100)
    ELSE 0 
  END as profit_margin
FROM order_stats o
CROSS JOIN customer_stats c
CROSS JOIN material_stats m
CROSS JOIN finance_stats f
CROSS JOIN employee_stats e;

-- =====================================================
-- 2. VIEW: PERFORMANCE POR SERVIÇO
-- =====================================================

CREATE VIEW v_service_performance AS
SELECT
  sc.id as service_id,
  sc.name as service_name,
  sc.category,
  COUNT(DISTINCT soi.service_order_id) as total_orders,
  COUNT(DISTINCT soi.service_order_id) FILTER (
    WHERE so.status = 'concluida'
  ) as completed_orders,
  CASE 
    WHEN COUNT(DISTINCT soi.service_order_id) > 0 
    THEN (COUNT(DISTINCT soi.service_order_id) FILTER (WHERE so.status = 'concluida')::NUMERIC / COUNT(DISTINCT soi.service_order_id) * 100)
    ELSE 0 
  END as completion_rate,
  COALESCE(SUM(soi.total_price) FILTER (WHERE so.status = 'concluida'), 0) as total_revenue,
  COALESCE(AVG(soi.total_price) FILTER (WHERE so.status = 'concluida'), 0) as avg_revenue_per_service,
  COALESCE(AVG(soi.estimated_duration / 60.0) FILTER (WHERE so.status = 'concluida'), 0) as avg_completion_time_hours,
  COUNT(DISTINCT so.customer_id) FILTER (WHERE so.status = 'concluida') as unique_customers
FROM service_catalog sc
LEFT JOIN service_order_items soi ON soi.service_catalog_id = sc.id
LEFT JOIN service_orders so ON so.id = soi.service_order_id
WHERE sc.active = true
  AND so.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY sc.id, sc.name, sc.category
HAVING COUNT(DISTINCT soi.service_order_id) > 0
ORDER BY total_revenue DESC;

-- =====================================================
-- 3. VIEW: RENTABILIDADE POR CLIENTE
-- =====================================================

CREATE VIEW v_customer_profitability AS
SELECT
  c.id as customer_id,
  c.nome_razao as customer_name,
  c.nome_fantasia as company_name,
  COUNT(DISTINCT so.id) as total_orders,
  COALESCE(SUM(so.final_total) FILTER (WHERE so.status = 'concluida'), 0) as total_revenue,
  COALESCE(AVG(so.final_total) FILTER (WHERE so.status = 'concluida'), 0) as avg_order_value,
  COALESCE(SUM(so.custo_total_materiais) FILTER (WHERE so.status = 'concluida'), 0) as total_material_cost,
  COALESCE(
    SUM(so.final_total) FILTER (WHERE so.status = 'concluida') - 
    SUM(so.custo_total) FILTER (WHERE so.status = 'concluida'), 
    0
  ) as gross_profit,
  CASE 
    WHEN SUM(so.final_total) FILTER (WHERE so.status = 'concluida') > 0 
    THEN ((SUM(so.final_total) FILTER (WHERE so.status = 'concluida') - SUM(so.custo_total) FILTER (WHERE so.status = 'concluida')) / SUM(so.final_total) FILTER (WHERE so.status = 'concluida') * 100)
    ELSE 0 
  END as profit_margin,
  COALESCE(EXTRACT(DAY FROM (CURRENT_DATE - MAX(so.completed_at))), 999) as days_since_last_order
FROM customers c
LEFT JOIN service_orders so ON so.customer_id = c.id
WHERE so.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY c.id, c.nome_razao, c.nome_fantasia
HAVING COUNT(DISTINCT so.id) FILTER (WHERE so.status = 'concluida') > 0
ORDER BY total_revenue DESC;

-- =====================================================
-- 4. VIEW: PRODUTIVIDADE DA EQUIPE
-- =====================================================

CREATE VIEW v_team_productivity AS
SELECT
  e.id as employee_id,
  e.name as employee_name,
  e.role,
  COUNT(DISTINCT sot.service_order_id) as total_orders_assigned,
  COUNT(DISTINCT sot.service_order_id) FILTER (
    WHERE so.status = 'concluida'
  ) as completed_orders,
  CASE 
    WHEN COUNT(DISTINCT sot.service_order_id) > 0 
    THEN (COUNT(DISTINCT sot.service_order_id) FILTER (WHERE so.status = 'concluida')::NUMERIC / COUNT(DISTINCT sot.service_order_id) * 100)
    ELSE 0 
  END as completion_rate,
  COALESCE(SUM(so.final_total) FILTER (WHERE so.status = 'concluida'), 0) as total_revenue_generated,
  COALESCE(AVG(EXTRACT(EPOCH FROM (so.completed_at - so.created_at)) / 3600) FILTER (WHERE so.status = 'concluida' AND so.completed_at IS NOT NULL), 0) as avg_completion_time_hours,
  COALESCE(e.salary, 0) as monthly_salary,
  CASE 
    WHEN COALESCE(e.salary, 0) > 0 
    THEN (COALESCE(SUM(so.final_total) FILTER (WHERE so.status = 'concluida'), 0) / e.salary)
    ELSE 0 
  END as revenue_to_salary_ratio
FROM employees e
LEFT JOIN service_order_team sot ON sot.employee_id = e.id
LEFT JOIN service_orders so ON so.id = sot.service_order_id
WHERE e.active = true
  AND so.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY e.id, e.name, e.role, e.salary
HAVING COUNT(DISTINCT sot.service_order_id) > 0
ORDER BY total_revenue_generated DESC;

-- =====================================================
-- 5. VIEW: MOVIMENTAÇÃO DE ESTOQUE POR OS
-- =====================================================

CREATE VIEW v_stock_movements AS
SELECT
  soh.id,
  soh.service_order_id,
  so.order_number,
  soh.action,
  soh.description,
  soh.metadata->>'material_name' as material_name,
  (soh.metadata->>'quantity')::NUMERIC as quantity,
  (soh.metadata->>'previous_stock')::NUMERIC as previous_stock,
  soh.created_at,
  c.nome_razao as customer_name
FROM service_order_history soh
JOIN service_orders so ON so.id = soh.service_order_id
LEFT JOIN customers c ON c.id = so.customer_id
WHERE soh.action IN ('stock_output', 'stock_output_failed')
ORDER BY soh.created_at DESC;

-- =====================================================
-- 6. VIEW: RESUMO FINANCEIRO DAS OS
-- =====================================================

CREATE VIEW v_service_order_financial_summary AS
SELECT
  so.id,
  so.order_number,
  so.status,
  so.created_at,
  so.completed_at,
  c.nome_razao as customer_name,
  so.final_total as order_value,
  so.custo_total as total_cost,
  so.lucro_total as profit,
  so.margem_lucro as profit_margin,
  fe.id as finance_entry_id,
  fe.status as finance_status,
  fe.data as payment_date,
  CASE 
    WHEN so.status = 'concluida' AND fe.id IS NULL THEN true
    ELSE false
  END as needs_finance_entry
FROM service_orders so
LEFT JOIN customers c ON c.id = so.customer_id
LEFT JOIN finance_entries fe ON fe.observacoes LIKE '%OS ' || so.order_number || '%'
ORDER BY so.created_at DESC;

-- =====================================================
-- 7. GRANTS E PERMISSÕES
-- =====================================================

GRANT SELECT ON v_business_kpis TO authenticated, anon;
GRANT SELECT ON v_service_performance TO authenticated, anon;
GRANT SELECT ON v_customer_profitability TO authenticated, anon;
GRANT SELECT ON v_team_productivity TO authenticated, anon;
GRANT SELECT ON v_stock_movements TO authenticated, anon;
GRANT SELECT ON v_service_order_financial_summary TO authenticated, anon;

-- =====================================================
-- 8. COMENTÁRIOS
-- =====================================================

COMMENT ON VIEW v_business_kpis IS 'KPIs principais do negócio - apenas OS concluídas últimos 30 dias';
COMMENT ON VIEW v_service_performance IS 'Performance por serviço - apenas OS concluídas últimos 30 dias';
COMMENT ON VIEW v_customer_profitability IS 'Rentabilidade por cliente - apenas OS concluídas últimos 90 dias';
COMMENT ON VIEW v_team_productivity IS 'Produtividade da equipe - apenas OS concluídas últimos 30 dias';
COMMENT ON VIEW v_stock_movements IS 'Movimentações de estoque por OS';
COMMENT ON VIEW v_service_order_financial_summary IS 'Resumo financeiro completo das OS';

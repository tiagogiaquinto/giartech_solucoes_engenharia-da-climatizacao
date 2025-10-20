-- ================================================
-- QUERIES DE VERIFICAÇÃO DO SISTEMA
-- ================================================
-- Use estas queries para verificar se os dados
-- estão sincronizados corretamente com o dashboard
-- ================================================

-- =============================================
-- 1. VERIFICAR VIEWS CRIADAS
-- =============================================

-- Listar todas as views criadas
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'v_%'
ORDER BY table_name;

-- =============================================
-- 2. TESTAR VIEW DE KPIs PRINCIPAIS
-- =============================================

SELECT * FROM v_business_kpis;

-- Deve retornar 1 linha com todas as métricas:
-- - total_completed_orders
-- - conversion_rate
-- - avg_order_value
-- - total_customers
-- - net_profit
-- - profit_margin
-- etc.

-- =============================================
-- 3. TESTAR VIEW DE PERFORMANCE DE SERVIÇOS
-- =============================================

SELECT
  service_name,
  total_orders,
  completed_orders,
  completion_rate,
  total_revenue,
  avg_revenue_per_service
FROM v_service_performance
ORDER BY total_revenue DESC
LIMIT 10;

-- Deve mostrar os 10 serviços com maior receita

-- =============================================
-- 4. TESTAR VIEW DE LUCRATIVIDADE DE CLIENTES
-- =============================================

SELECT
  customer_name,
  total_orders,
  total_revenue,
  gross_profit,
  profit_margin,
  days_since_last_order
FROM v_customer_profitability
ORDER BY total_revenue DESC
LIMIT 20;

-- Deve mostrar os 20 clientes mais lucrativos

-- =============================================
-- 5. TESTAR VIEW DE PRODUTIVIDADE DA EQUIPE
-- =============================================

SELECT
  employee_name,
  role,
  total_orders_assigned,
  completed_orders,
  completion_rate,
  total_revenue_generated,
  revenue_to_salary_ratio
FROM v_team_productivity
ORDER BY total_revenue_generated DESC;

-- Deve mostrar todos os funcionários ativos e suas métricas

-- =============================================
-- 6. TESTAR VIEW DE CONSUMO DE MATERIAIS
-- =============================================

SELECT
  material_name,
  times_used,
  total_quantity_used,
  total_cost,
  current_stock,
  estimated_days_of_stock
FROM v_material_consumption
ORDER BY times_used DESC
LIMIT 20;

-- Deve mostrar os 20 materiais mais usados

-- =============================================
-- 7. VERIFICAR DASHBOARD FINANCIAL
-- =============================================

SELECT
  total_income_paid,
  total_expense_paid,
  total_income_paid - total_expense_paid as net_profit,
  inventory_cost_value,
  inventory_sale_value,
  inventory_potential_profit,
  inventory_profit_margin
FROM v_dashboard_financial;

-- Deve retornar 1 linha com métricas financeiras incluindo estoque

-- =============================================
-- 8. VERIFICAR CONTAGEM DE DADOS
-- =============================================

-- Resumo geral do sistema
SELECT
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM service_orders) as total_service_orders,
  (SELECT COUNT(*) FROM service_orders WHERE status = 'completed') as completed_orders,
  (SELECT COUNT(*) FROM materials) as total_materials,
  (SELECT COUNT(*) FROM employees WHERE status = 'active') as active_employees,
  (SELECT COUNT(*) FROM financial_transactions) as total_transactions,
  (SELECT COUNT(*) FROM service_order_materials) as so_materials_count,
  (SELECT COUNT(*) FROM service_order_team) as so_team_count,
  (SELECT COUNT(*) FROM financial_categories) as categories_count;

-- =============================================
-- 9. VERIFICAR RELACIONAMENTOS
-- =============================================

-- Verificar OSs com materiais
SELECT
  so.order_number,
  so.status,
  COUNT(som.id) as materials_count,
  SUM(som.total_cost) as total_material_cost
FROM service_orders so
LEFT JOIN service_order_materials som ON som.service_order_id = so.id
GROUP BY so.id, so.order_number, so.status
HAVING COUNT(som.id) > 0
ORDER BY so.order_number
LIMIT 10;

-- Verificar OSs com equipe
SELECT
  so.order_number,
  so.status,
  COUNT(sot.id) as team_members_count,
  STRING_AGG(e.name, ', ') as team_members
FROM service_orders so
LEFT JOIN service_order_team sot ON sot.service_order_id = so.id
LEFT JOIN employees e ON e.id = sot.employee_id
GROUP BY so.id, so.order_number, so.status
HAVING COUNT(sot.id) > 0
ORDER BY so.order_number
LIMIT 10;

-- =============================================
-- 10. VERIFICAR TRANSAÇÕES FINANCEIRAS
-- =============================================

-- Transações por tipo
SELECT
  type,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM financial_transactions
GROUP BY type, status
ORDER BY type, status;

-- Transações recentes
SELECT
  description,
  type,
  amount,
  date,
  status,
  payment_method
FROM financial_transactions
ORDER BY date DESC
LIMIT 20;

-- =============================================
-- 11. VERIFICAR CATEGORIAS FINANCEIRAS
-- =============================================

SELECT
  name,
  nature,
  dre_grupo,
  active
FROM financial_categories
ORDER BY nature, name;

-- =============================================
-- 12. VERIFICAR ESTOQUE E CUSTOS
-- =============================================

-- Materiais com maior lucro potencial
SELECT
  name,
  quantity,
  unit_cost,
  unit_price,
  (unit_price - unit_cost) as profit_per_unit,
  (unit_price - unit_cost) * quantity as total_potential_profit,
  ROUND(((unit_price - unit_cost) / NULLIF(unit_cost, 0) * 100)::numeric, 2) as profit_margin_percent
FROM materials
WHERE quantity > 0
ORDER BY total_potential_profit DESC
LIMIT 20;

-- =============================================
-- 13. ANÁLISE DE RECEITA POR PERÍODO
-- =============================================

-- Receitas dos últimos 6 meses
SELECT
  DATE_TRUNC('month', date) as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_result
FROM financial_transactions
WHERE status = 'paid'
  AND date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- =============================================
-- 14. TOP CLIENTES POR RECEITA
-- =============================================

SELECT
  c.name,
  c.company_name,
  COUNT(DISTINCT so.id) as total_orders,
  SUM(CASE WHEN so.status = 'completed' THEN so.total_value ELSE 0 END) as total_revenue,
  AVG(CASE WHEN so.status = 'completed' THEN so.total_value END) as avg_order_value,
  MAX(so.opened_at) as last_order_date
FROM customers c
LEFT JOIN service_orders so ON so.customer_id = c.id
GROUP BY c.id, c.name, c.company_name
HAVING COUNT(DISTINCT so.id) > 0
ORDER BY total_revenue DESC
LIMIT 10;

-- =============================================
-- 15. PERFORMANCE DA EQUIPE
-- =============================================

SELECT
  e.name,
  e.role,
  e.salary,
  COUNT(DISTINCT sot.service_order_id) as orders_assigned,
  COUNT(DISTINCT CASE WHEN so.status = 'completed' THEN sot.service_order_id END) as orders_completed,
  SUM(CASE WHEN so.status = 'completed' THEN so.total_value ELSE 0 END) as revenue_generated,
  ROUND((SUM(CASE WHEN so.status = 'completed' THEN so.total_value ELSE 0 END) / NULLIF(e.salary, 0))::numeric, 2) as roi
FROM employees e
LEFT JOIN service_order_team sot ON sot.employee_id = e.id
LEFT JOIN service_orders so ON so.id = sot.service_order_id
WHERE e.status = 'active'
GROUP BY e.id, e.name, e.role, e.salary
ORDER BY revenue_generated DESC;

-- =============================================
-- 16. VERIFICAR INTEGRIDADE DOS DADOS
-- =============================================

-- OSs sem valor
SELECT COUNT(*) as orders_without_value
FROM service_orders
WHERE total_value IS NULL OR total_value = 0;

-- Materiais sem custo
SELECT COUNT(*) as materials_without_cost
FROM materials
WHERE unit_cost IS NULL OR unit_cost = 0;

-- Transações sem categoria
SELECT COUNT(*) as transactions_without_category
FROM financial_transactions
WHERE category_id IS NULL;

-- =============================================
-- 17. DASHBOARD METRICS SIMPLIFICADO
-- =============================================

-- Métricas principais em uma query
WITH metrics AS (
  SELECT
    -- Ordens
    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
    COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) as active_orders,
    COUNT(*) as total_orders,
    AVG(total_value) FILTER (WHERE status = 'completed') as avg_ticket,
    -- Receita
    SUM(total_value) FILTER (WHERE status = 'completed') as total_revenue
  FROM service_orders
),
financial AS (
  SELECT
    SUM(amount) FILTER (WHERE type = 'income' AND status = 'paid') as income,
    SUM(amount) FILTER (WHERE type = 'expense' AND status = 'paid') as expense
  FROM financial_transactions
),
inventory AS (
  SELECT
    SUM(unit_cost * quantity) as cost_value,
    SUM(unit_price * quantity) as sale_value
  FROM materials
)
SELECT
  m.completed_orders,
  m.active_orders,
  m.total_orders,
  ROUND(m.avg_ticket::numeric, 2) as avg_ticket,
  ROUND(m.total_revenue::numeric, 2) as total_revenue,
  ROUND(f.income::numeric, 2) as total_income,
  ROUND(f.expense::numeric, 2) as total_expense,
  ROUND((f.income - f.expense)::numeric, 2) as net_profit,
  ROUND(((f.income - f.expense) / NULLIF(f.income, 0) * 100)::numeric, 2) as profit_margin,
  ROUND(i.cost_value::numeric, 2) as inventory_cost,
  ROUND(i.sale_value::numeric, 2) as inventory_sale_value,
  ROUND((i.sale_value - i.cost_value)::numeric, 2) as inventory_potential_profit
FROM metrics m, financial f, inventory i;

-- =============================================
-- FIM DAS QUERIES DE VERIFICAÇÃO
-- =============================================

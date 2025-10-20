/*
  # Correção Simplificada das Views Principais do Dashboard

  ## Foco
  - v_business_kpis (dashboard executivo e KPIs)
  - Correção de dados que aparecem zerados
  - Separação PF/PJ de clientes

  ## Dados Reais
  - 7 OS concluídas: R$ 10.535,00
  - 60 lançamentos: R$ 53.853 receitas / R$ 4.993 despesas
  - 54 clientes: 29 PJ / 25 PF
  - 22 materiais
*/

-- DROP view antiga
DROP VIEW IF EXISTS v_business_kpis CASCADE;

-- Recriar v_business_kpis com dados corretos
CREATE OR REPLACE VIEW v_business_kpis AS
WITH date_range AS (
  SELECT 
    CURRENT_DATE - INTERVAL '30 days' as start_date,
    CURRENT_DATE as end_date
),
os_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress', 'scheduled')) as in_progress,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
    COALESCE(SUM(final_total) FILTER (WHERE status = 'completed'), 0) as total_revenue,
    COALESCE(AVG(final_total) FILTER (WHERE status = 'completed'), 0) as avg_value,
    COUNT(DISTINCT customer_id) FILTER (WHERE status = 'completed') as active_customers
  FROM service_orders, date_range
  WHERE created_at >= date_range.start_date
),
finance_stats AS (
  SELECT
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'pago'), 0) as total_income,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) as total_expenses,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'pendente'), 0) as receivable,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pendente'), 0) as payable
  FROM finance_entries, date_range
  WHERE data >= date_range.start_date
),
customer_stats AS (
  SELECT
    COUNT(*) as total_customers,
    COUNT(*) FILTER (WHERE tipo_pessoa IN ('PJ', 'juridica')) as total_pj,
    COUNT(*) FILTER (WHERE tipo_pessoa IN ('PF', 'fisica') OR tipo_pessoa IS NULL) as total_pf
  FROM customers
),
material_stats AS (
  SELECT
    COUNT(*) as total_items,
    COALESCE(SUM(quantity), 0) as total_quantity,
    COALESCE(SUM(quantity * COALESCE(unit_cost, unit_price, 0)), 0) as total_cost,
    COALESCE(SUM(quantity * COALESCE(sale_price, unit_price, 0)), 0) as total_value
  FROM materials
),
employee_stats AS (
  SELECT
    COUNT(*) as total_employees,
    COALESCE(SUM(salary), 0) as total_payroll
  FROM employees
)
SELECT
  -- Ordens de Serviço
  COALESCE(os.total_completed, 0)::bigint as total_completed_orders,
  COALESCE(os.in_progress, 0)::bigint as orders_in_progress,
  COALESCE(os.cancelled, 0)::bigint as cancelled_orders,
  COALESCE(os.total_revenue, 0)::numeric(12,2) as total_revenue,
  COALESCE(os.avg_value, 0)::numeric(12,2) as avg_order_value,
  CASE 
    WHEN (COALESCE(os.total_completed, 0) + COALESCE(os.cancelled, 0)) > 0 
    THEN (COALESCE(os.total_completed, 0)::numeric / (COALESCE(os.total_completed, 0) + COALESCE(os.cancelled, 0))) * 100
    ELSE 0
  END::numeric(5,2) as conversion_rate,
  
  -- Clientes (com separação PF/PJ)
  COALESCE(cs.total_customers, 0)::bigint as total_customers,
  COALESCE(cs.total_pj, 0)::bigint as total_customers_pj,
  COALESCE(cs.total_pf, 0)::bigint as total_customers_pf,
  COALESCE(os.active_customers, 0)::bigint as active_customers,
  
  -- Estoque
  COALESCE(ms.total_items, 0)::bigint as materials_in_stock,
  COALESCE(ms.total_quantity, 0)::numeric(12,2) as total_stock_quantity,
  COALESCE(ms.total_cost, 0)::numeric(12,2) as total_inventory_cost,
  COALESCE(ms.total_value, 0)::numeric(12,2) as total_inventory_value,
  COALESCE(ms.total_value - ms.total_cost, 0)::numeric(12,2) as potential_profit,
  
  -- Financeiro
  COALESCE(fs.total_income, 0)::numeric(12,2) as total_income,
  COALESCE(fs.total_expenses, 0)::numeric(12,2) as total_expenses,
  COALESCE(fs.receivable, 0)::numeric(12,2) as accounts_receivable,
  COALESCE(fs.payable, 0)::numeric(12,2) as accounts_payable,
  
  -- Funcionários
  COALESCE(es.total_employees, 0)::bigint as active_employees,
  COALESCE(es.total_payroll, 0)::numeric(12,2) as total_payroll,
  
  -- Lucro
  COALESCE(fs.total_income - fs.total_expenses, 0)::numeric(12,2) as net_profit,
  CASE 
    WHEN COALESCE(fs.total_income, 0) > 0 
    THEN ((COALESCE(fs.total_income, 0) - COALESCE(fs.total_expenses, 0)) / COALESCE(fs.total_income, 0)) * 100
    ELSE 0
  END::numeric(5,2) as profit_margin
FROM os_stats os
CROSS JOIN finance_stats fs
CROSS JOIN customer_stats cs
CROSS JOIN material_stats ms
CROSS JOIN employee_stats es;

-- Permissões
GRANT SELECT ON v_business_kpis TO anon, authenticated;

/*
  # Criar Views de KPIs e OKRs para Análise de Negócios

  1. Views Criadas
    - v_service_performance: Performance dos serviços
    - v_material_consumption: Consumo de materiais por serviço
    - v_customer_profitability: Lucratividade por cliente
    - v_team_productivity: Produtividade da equipe
    - v_business_kpis: KPIs principais do negócio

  2. Métricas Incluídas
    - Taxa de conversão
    - Tempo médio de atendimento
    - Custo médio por serviço
    - Margem de lucro por serviço
    - Rentabilidade por cliente
    - Produtividade da equipe
    - Giro de estoque
*/

-- View: Performance dos Serviços
CREATE OR REPLACE VIEW v_service_performance AS
SELECT
  sc.id as service_id,
  sc.name as service_name,
  COUNT(DISTINCT so.id) as total_orders,
  COUNT(DISTINCT CASE WHEN so.status = 'completed' THEN so.id END) as completed_orders,
  COUNT(DISTINCT CASE WHEN so.status = 'cancelled' THEN so.id END) as cancelled_orders,
  ROUND(
    (COUNT(DISTINCT CASE WHEN so.status = 'completed' THEN so.id END)::numeric /
    NULLIF(COUNT(DISTINCT so.id), 0) * 100)::numeric, 2
  ) as completion_rate,
  COALESCE(SUM(CASE WHEN so.status = 'completed' THEN so.total_value ELSE 0 END), 0) as total_revenue,
  COALESCE(AVG(CASE WHEN so.status = 'completed' THEN so.total_value END), 0) as avg_revenue_per_service,
  COALESCE(
    AVG(
      CASE
        WHEN so.status = 'completed' AND so.completed_at IS NOT NULL AND so.opened_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (so.completed_at - so.opened_at)) / 3600
      END
    ), 0
  ) as avg_completion_time_hours,
  COUNT(DISTINCT so.customer_id) as unique_customers
FROM service_catalog sc
LEFT JOIN service_order_items soi ON soi.service_id = sc.id
LEFT JOIN service_orders so ON so.id = soi.service_order_id
GROUP BY sc.id, sc.name;

-- View: Consumo de Materiais por Serviço
CREATE OR REPLACE VIEW v_material_consumption AS
SELECT
  m.id as material_id,
  m.name as material_name,
  m.unit as unit,
  COUNT(DISTINCT som.service_order_id) as times_used,
  COALESCE(SUM(som.quantity_used), 0) as total_quantity_used,
  COALESCE(SUM(som.quantity_used * som.unit_cost), 0) as total_cost,
  COALESCE(AVG(som.quantity_used), 0) as avg_quantity_per_order,
  m.quantity as current_stock,
  CASE
    WHEN SUM(som.quantity_used) > 0
    THEN ROUND((m.quantity::numeric / NULLIF(SUM(som.quantity_used), 0) * 30)::numeric, 2)
    ELSE NULL
  END as estimated_days_of_stock
FROM materials m
LEFT JOIN service_order_materials som ON som.material_id = m.id
GROUP BY m.id, m.name, m.unit, m.quantity;

-- View: Lucratividade por Cliente
CREATE OR REPLACE VIEW v_customer_profitability AS
SELECT
  c.id as customer_id,
  c.name as customer_name,
  c.company_name,
  COUNT(DISTINCT so.id) as total_orders,
  COALESCE(SUM(CASE WHEN so.status = 'completed' THEN so.total_value ELSE 0 END), 0) as total_revenue,
  COALESCE(AVG(CASE WHEN so.status = 'completed' THEN so.total_value END), 0) as avg_order_value,
  COALESCE(
    SUM(
      CASE WHEN so.status = 'completed'
      THEN (
        SELECT COALESCE(SUM(som.quantity_used * som.unit_cost), 0)
        FROM service_order_materials som
        WHERE som.service_order_id = so.id
      )
      ELSE 0 END
    ), 0
  ) as total_material_cost,
  COALESCE(
    SUM(CASE WHEN so.status = 'completed' THEN so.total_value ELSE 0 END) -
    SUM(
      CASE WHEN so.status = 'completed'
      THEN (
        SELECT COALESCE(SUM(som.quantity_used * som.unit_cost), 0)
        FROM service_order_materials som
        WHERE som.service_order_id = so.id
      )
      ELSE 0 END
    ), 0
  ) as gross_profit,
  ROUND(
    (
      (
        SUM(CASE WHEN so.status = 'completed' THEN so.total_value ELSE 0 END) -
        SUM(
          CASE WHEN so.status = 'completed'
          THEN (
            SELECT COALESCE(SUM(som.quantity_used * som.unit_cost), 0)
            FROM service_order_materials som
            WHERE som.service_order_id = so.id
          )
          ELSE 0 END
        )
      ) / NULLIF(SUM(CASE WHEN so.status = 'completed' THEN so.total_value END), 0) * 100
    )::numeric, 2
  ) as profit_margin,
  MAX(so.opened_at) as last_order_date,
  EXTRACT(DAY FROM (CURRENT_DATE - MAX(so.opened_at::date))) as days_since_last_order
FROM customers c
LEFT JOIN service_orders so ON so.customer_id = c.id
GROUP BY c.id, c.name, c.company_name
HAVING COUNT(DISTINCT so.id) > 0;

-- View: Produtividade da Equipe
CREATE OR REPLACE VIEW v_team_productivity AS
SELECT
  e.id as employee_id,
  e.name as employee_name,
  e.role,
  COUNT(DISTINCT sot.service_order_id) as total_orders_assigned,
  COUNT(DISTINCT CASE
    WHEN so.status = 'completed'
    THEN sot.service_order_id
  END) as completed_orders,
  ROUND(
    (COUNT(DISTINCT CASE WHEN so.status = 'completed' THEN sot.service_order_id END)::numeric /
    NULLIF(COUNT(DISTINCT sot.service_order_id), 0) * 100)::numeric, 2
  ) as completion_rate,
  COALESCE(
    SUM(CASE WHEN so.status = 'completed' THEN so.total_value ELSE 0 END), 0
  ) as total_revenue_generated,
  COALESCE(
    AVG(
      CASE
        WHEN so.status = 'completed' AND so.completed_at IS NOT NULL AND so.opened_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (so.completed_at - so.opened_at)) / 3600
      END
    ), 0
  ) as avg_completion_time_hours,
  e.salary as monthly_salary,
  CASE
    WHEN e.salary > 0
    THEN ROUND(
      (SUM(CASE WHEN so.status = 'completed' THEN so.total_value ELSE 0 END) / NULLIF(e.salary, 0))::numeric, 2
    )
    ELSE 0
  END as revenue_to_salary_ratio
FROM employees e
LEFT JOIN service_order_team sot ON sot.employee_id = e.id
LEFT JOIN service_orders so ON so.id = sot.service_order_id
WHERE e.status = 'active'
GROUP BY e.id, e.name, e.role, e.salary;

-- View: KPIs Principais do Negócio
CREATE OR REPLACE VIEW v_business_kpis AS
SELECT
  -- VENDAS E RECEITAS
  (SELECT COUNT(*) FROM service_orders WHERE status = 'completed') as total_completed_orders,
  (SELECT COUNT(*) FROM service_orders WHERE status IN ('open', 'in_progress')) as orders_in_progress,
  (SELECT COUNT(*) FROM service_orders WHERE status = 'cancelled') as cancelled_orders,
  (SELECT COALESCE(SUM(total_value), 0) FROM service_orders WHERE status = 'completed') as total_revenue,
  (SELECT COALESCE(AVG(total_value), 0) FROM service_orders WHERE status = 'completed') as avg_order_value,

  -- TAXA DE CONVERSÃO
  ROUND(
    (SELECT COUNT(*)::numeric FROM service_orders WHERE status = 'completed') /
    NULLIF((SELECT COUNT(*) FROM service_orders), 0) * 100, 2
  ) as conversion_rate,

  -- TEMPO MÉDIO DE ATENDIMENTO
  (SELECT COALESCE(
    AVG(EXTRACT(EPOCH FROM (completed_at - opened_at)) / 3600), 0
  ) FROM service_orders WHERE status = 'completed' AND completed_at IS NOT NULL) as avg_service_time_hours,

  -- CLIENTES
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(DISTINCT customer_id) FROM service_orders WHERE status = 'completed') as active_customers,

  -- ESTOQUE
  (SELECT COUNT(*) FROM materials WHERE quantity > 0) as materials_in_stock,
  (SELECT COALESCE(SUM(unit_cost * quantity), 0) FROM materials) as total_inventory_value,
  (SELECT COALESCE(SUM((unit_price - unit_cost) * quantity), 0) FROM materials WHERE quantity > 0) as potential_profit,

  -- FINANCEIRO
  (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND status = 'paid') as total_income,
  (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'expense' AND status = 'paid') as total_expenses,
  (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND status = 'pending') as accounts_receivable,
  (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'expense' AND status = 'pending') as accounts_payable,

  -- EQUIPE
  (SELECT COUNT(*) FROM employees WHERE status = 'active') as active_employees,
  (SELECT COALESCE(SUM(salary), 0) FROM employees WHERE status = 'active') as total_payroll,

  -- LUCRATIVIDADE
  (
    (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND status = 'paid') -
    (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'expense' AND status = 'paid')
  ) as net_profit,

  ROUND(
    (
      (
        (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND status = 'paid') -
        (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'expense' AND status = 'paid')
      ) / NULLIF(
        (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions WHERE type = 'income' AND status = 'paid'), 0
      ) * 100
    )::numeric, 2
  ) as profit_margin;

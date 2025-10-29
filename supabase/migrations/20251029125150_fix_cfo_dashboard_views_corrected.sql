/*
  # Corrigir Views do Dashboard CFO com Dados Reais

  1. Views Atualizadas
    - `v_cfo_kpis` - View principal de KPIs do CFO com dados reais do banco
  
  2. Correções
    - Status corretos em português (pago, recebido, a_pagar, a_receber)
    - Nomes corretos de colunas (unit_price ao invés de sale_price)
    - Cálculos baseados em dados reais
*/

-- Recriar a view v_cfo_kpis com dados reais
DROP VIEW IF EXISTS v_cfo_kpis CASCADE;

CREATE OR REPLACE VIEW v_cfo_kpis AS
WITH financial_summary AS (
  SELECT
    -- Receitas recebidas
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) AS total_revenue,
    -- Despesas pagas
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS total_expenses,
    -- Contas a receber
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'a_receber'), 0) AS accounts_receivable,
    -- Contas a pagar
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'a_pagar'), 0) AS accounts_payable
  FROM finance_entries
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
),
orders_summary AS (
  SELECT
    COUNT(*) AS total_orders,
    COUNT(*) FILTER (WHERE status IN ('concluida', 'completed', 'finalizada')) AS total_completed_orders,
    COUNT(*) FILTER (WHERE status IN ('aberta', 'em_andamento', 'in_progress')) AS orders_in_progress,
    COALESCE(SUM(total_value) FILTER (WHERE status IN ('concluida', 'completed', 'finalizada')), 0) AS total_revenue_from_orders,
    COALESCE(AVG(total_value) FILTER (WHERE status IN ('concluida', 'completed', 'finalizada')), 0) AS avg_order_value,
    COALESCE(AVG(lucro_total) FILTER (WHERE status IN ('concluida', 'completed', 'finalizada')), 0) AS avg_profit_per_order
  FROM service_orders
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
),
inventory_summary AS (
  SELECT
    COALESCE(SUM(quantity * unit_cost), 0) AS total_inventory_cost,
    COALESCE(SUM(quantity * unit_price), 0) AS total_inventory_value,
    COALESCE(SUM(quantity * (unit_price - unit_cost)), 0) AS potential_profit,
    CASE 
      WHEN SUM(quantity * unit_cost) > 0 THEN 
        COALESCE(SUM(quantity * unit_price), 0) / SUM(quantity * unit_cost)
      ELSE 0
    END AS inventory_turnover
  FROM inventory_items
  WHERE active = true
),
customer_summary AS (
  SELECT
    COUNT(*) AS total_customers,
    COUNT(*) FILTER (WHERE cnpj IS NOT NULL AND cnpj != '') AS total_customers_pj,
    COUNT(*) FILTER (WHERE (cnpj IS NULL OR cnpj = '') AND cpf IS NOT NULL) AS total_customers_pf,
    COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) AS active_customers
  FROM customers
)
SELECT
  -- Financeiro
  fs.total_revenue,
  fs.total_expenses,
  (fs.total_revenue - fs.total_expenses) AS net_profit,
  CASE 
    WHEN fs.total_revenue > 0 THEN 
      ROUND(((fs.total_revenue - fs.total_expenses) / fs.total_revenue * 100), 2)
    ELSE 0
  END AS profit_margin,
  
  -- EBITDA (aproximação: lucro líquido + depreciação estimada 5%)
  (fs.total_revenue - fs.total_expenses) * 1.05 AS ebitda,
  CASE 
    WHEN fs.total_revenue > 0 THEN 
      ROUND(((fs.total_revenue - fs.total_expenses) * 1.05 / fs.total_revenue * 100), 2)
    ELSE 0
  END AS ebitda_margin,
  
  -- Margens
  CASE 
    WHEN fs.total_revenue > 0 THEN 
      ROUND(((fs.total_revenue - fs.total_expenses) / fs.total_revenue * 100), 2)
    ELSE 0
  END AS gross_margin,
  CASE 
    WHEN fs.total_revenue > 0 THEN 
      ROUND(((fs.total_revenue - fs.total_expenses * 0.8) / fs.total_revenue * 100), 2)
    ELSE 0
  END AS operating_margin,
  
  -- Recebíveis e Pagáveis
  fs.accounts_receivable,
  fs.accounts_payable,
  (fs.accounts_receivable - fs.accounts_payable) AS net_working_capital,
  
  -- Clientes
  cs.total_customers,
  cs.total_customers_pj,
  cs.total_customers_pf,
  cs.active_customers,
  CASE 
    WHEN cs.total_customers > 0 THEN 
      ROUND((cs.active_customers::numeric / cs.total_customers * 100), 2)
    ELSE 0
  END AS customer_retention_rate,
  CASE 
    WHEN cs.total_customers > 0 THEN 
      ROUND(fs.total_revenue / cs.total_customers, 2)
    ELSE 0
  END AS avg_customer_ltv,
  
  -- Ordens de Serviço
  os.total_completed_orders,
  os.orders_in_progress,
  os.avg_order_value,
  os.total_revenue_from_orders,
  os.avg_profit_per_order,
  
  -- Estoque
  inv.total_inventory_cost,
  inv.total_inventory_value,
  inv.potential_profit,
  ROUND(inv.inventory_turnover::numeric, 2) AS inventory_turnover,
  
  -- Performance
  CASE 
    WHEN fs.total_expenses > 0 THEN 
      ROUND(((fs.total_revenue - fs.total_expenses) / fs.total_expenses * 100), 2)
    ELSE 0
  END AS roi_percentage,
  CASE 
    WHEN (fs.total_revenue - fs.total_expenses) > 0 THEN 
      ROUND((fs.total_expenses / ((fs.total_revenue - fs.total_expenses) / 365))::numeric, 0)
    ELSE 999
  END AS payback_period_days,
  ROUND(fs.total_expenses / 1.2, 2) AS break_even_point,
  CASE 
    WHEN fs.total_revenue > 0 THEN 
      ROUND(((fs.total_revenue - fs.total_expenses) / fs.total_revenue * 100), 2)
    ELSE 0
  END AS operational_efficiency,
  
  CURRENT_TIMESTAMP AS calculated_at
FROM financial_summary fs
CROSS JOIN orders_summary os
CROSS JOIN inventory_summary inv
CROSS JOIN customer_summary cs;

-- Grant permissions
GRANT SELECT ON v_cfo_kpis TO anon, authenticated;

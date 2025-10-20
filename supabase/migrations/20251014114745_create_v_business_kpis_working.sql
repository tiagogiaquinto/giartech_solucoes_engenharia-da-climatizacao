/*
  # Criar view v_business_kpis funcional
  
  1. Views
    - v_business_kpis com KPIs do negócio
  
  2. KPIs incluídos
    - Receita total de ordens concluídas
    - Custos totais
    - Lucro líquido
    - Margem de lucro média
    - Total de clientes
    - Total de ordens
    - Ordens concluídas
    - Ticket médio
    - Valor do estoque
*/

DROP VIEW IF EXISTS v_business_kpis;

CREATE OR REPLACE VIEW v_business_kpis AS
SELECT
  COALESCE(SUM(CASE WHEN so.status = 'completed' THEN COALESCE(so.total_value, 0) ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(COALESCE(so.custo_total, 0)), 0) as total_costs,
  COALESCE(SUM(COALESCE(so.lucro_total, 0)), 0) as net_profit,
  COALESCE(AVG(CASE WHEN so.status = 'completed' THEN COALESCE(so.margem_lucro, 0) ELSE 0 END), 0) as profit_margin,
  (SELECT COUNT(DISTINCT id) FROM customers) as active_customers,
  COUNT(so.id) as total_orders,
  COUNT(CASE WHEN so.status = 'completed' THEN 1 END) as completed_orders,
  CASE 
    WHEN COUNT(CASE WHEN so.status = 'completed' THEN 1 END) > 0 THEN
      SUM(CASE WHEN so.status = 'completed' THEN COALESCE(so.total_value, 0) ELSE 0 END) / 
      COUNT(CASE WHEN so.status = 'completed' THEN 1 END)
    ELSE 0
  END as avg_order_value,
  (SELECT COALESCE(SUM(quantity * unit_cost), 0) FROM materials) as inventory_value
FROM service_orders so;
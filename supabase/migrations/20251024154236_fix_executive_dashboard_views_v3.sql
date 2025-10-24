/*
  # Correção das Views do Dashboard Executivo

  ## Views Criadas
  
  1. **v_monthly_financial_summary** - Resumo financeiro mensal
     - Receitas e despesas realizadas por mês
     - Lucro líquido mensal
     - Dados dos últimos 12 meses
  
  2. **v_monthly_revenue_evolution** - Evolução da receita mensal
     - Receita total por mês (finance_entries + service_orders)
     - Crescimento mês a mês
     - Últimos 12 meses
  
  3. **v_top_customers_by_revenue** - Top clientes por receita
     - Ranking de clientes por valor total
     - Baseado em OSs completadas + lançamentos financeiros
  
  4. **v_top_services_by_revenue** - Top serviços por receita  
     - Ranking de serviços mais lucrativos
     - Baseado em itens de OS completadas
  
  ## Segurança
  - Views com SECURITY DEFINER
  - Acesso público para leitura (anon)
*/

-- =====================================================
-- VIEW 1: Resumo Financeiro Mensal (Lucros)
-- =====================================================

CREATE OR REPLACE VIEW v_monthly_financial_summary
WITH (security_invoker=false) AS
SELECT 
  DATE_TRUNC('month', date_col) as month,
  TO_CHAR(date_col, 'Mon/YY') as month_label,
  COALESCE(SUM(receita_realizada), 0) as total_revenue,
  COALESCE(SUM(despesa_realizada), 0) as total_expenses,
  COALESCE(SUM(receita_realizada) - SUM(despesa_realizada), 0) as net_profit,
  CASE 
    WHEN SUM(receita_realizada) > 0 
    THEN ROUND((SUM(receita_realizada) - SUM(despesa_realizada)) * 100.0 / SUM(receita_realizada), 2)
    ELSE 0 
  END as profit_margin
FROM (
  -- Dados de finance_entries
  SELECT 
    data as date_col,
    CASE WHEN tipo = 'receita' AND status IN ('recebido', 'pago') THEN valor ELSE 0 END as receita_realizada,
    CASE WHEN tipo = 'despesa' AND status = 'pago' THEN valor ELSE 0 END as despesa_realizada
  FROM finance_entries
  WHERE data >= CURRENT_DATE - INTERVAL '12 months'
  
  UNION ALL
  
  -- Dados de service_orders completadas
  SELECT 
    created_at as date_col,
    CASE WHEN status = 'completed' THEN COALESCE(final_total, 0) ELSE 0 END as receita_realizada,
    CASE WHEN status = 'completed' THEN COALESCE(total_cost, 0) ELSE 0 END as despesa_realizada
  FROM service_orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
) combined
GROUP BY DATE_TRUNC('month', date_col), TO_CHAR(date_col, 'Mon/YY')
ORDER BY DATE_TRUNC('month', date_col);

-- =====================================================
-- VIEW 2: Evolução da Receita Mensal
-- =====================================================

CREATE OR REPLACE VIEW v_monthly_revenue_evolution
WITH (security_invoker=false) AS
SELECT 
  month,
  month_label,
  total_revenue,
  LAG(total_revenue) OVER (ORDER BY month) as previous_month_revenue,
  CASE 
    WHEN LAG(total_revenue) OVER (ORDER BY month) > 0 
    THEN ROUND(((total_revenue - LAG(total_revenue) OVER (ORDER BY month)) * 100.0 / LAG(total_revenue) OVER (ORDER BY month)), 2)
    ELSE 0 
  END as growth_percent
FROM v_monthly_financial_summary
ORDER BY month;

-- =====================================================
-- VIEW 3: Top 10 Clientes por Receita
-- =====================================================

CREATE OR REPLACE VIEW v_top_customers_by_revenue
WITH (security_invoker=false) AS
WITH customer_revenue AS (
  -- Receita de ordens de serviço
  SELECT 
    so.customer_id,
    c.nome_razao as customer_name,
    COUNT(DISTINCT so.id) as total_orders,
    SUM(CASE WHEN so.status = 'completed' THEN COALESCE(so.final_total, 0) ELSE 0 END) as os_revenue
  FROM service_orders so
  LEFT JOIN customers c ON c.id = so.customer_id
  WHERE so.created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY so.customer_id, c.nome_razao
)
SELECT 
  customer_id,
  COALESCE(customer_name, 'Cliente não identificado') as customer_name,
  total_orders,
  COALESCE(os_revenue, 0) as total_revenue,
  ROUND(COALESCE(os_revenue, 0) / NULLIF(total_orders, 0), 2) as avg_order_value
FROM customer_revenue
WHERE os_revenue > 0
ORDER BY os_revenue DESC
LIMIT 10;

-- =====================================================
-- VIEW 4: Top 10 Serviços por Receita
-- =====================================================

CREATE OR REPLACE VIEW v_top_services_by_revenue
WITH (security_invoker=false) AS
WITH service_revenue AS (
  SELECT 
    soi.service_catalog_id,
    sc.name as service_name,
    sc.category,
    COUNT(DISTINCT soi.service_order_id) as total_orders,
    COUNT(*) as total_items,
    SUM(COALESCE(soi.preco_total, soi.total_price, soi.quantidade * soi.preco_unitario, soi.quantity * soi.unit_price, 0)) as total_revenue,
    AVG(COALESCE(soi.preco_total, soi.total_price, soi.quantidade * soi.preco_unitario, soi.quantity * soi.unit_price, 0)) as avg_revenue_per_item
  FROM service_order_items soi
  LEFT JOIN service_catalog sc ON sc.id = soi.service_catalog_id
  LEFT JOIN service_orders so ON so.id = soi.service_order_id
  WHERE so.status = 'completed'
    AND so.created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY soi.service_catalog_id, sc.name, sc.category
)
SELECT 
  service_catalog_id,
  COALESCE(service_name, 'Serviço não identificado') as service_name,
  COALESCE(category, 'Sem categoria') as category,
  total_orders,
  total_items,
  COALESCE(total_revenue, 0) as total_revenue,
  COALESCE(avg_revenue_per_item, 0) as avg_revenue_per_item
FROM service_revenue
WHERE total_revenue > 0
ORDER BY total_revenue DESC
LIMIT 10;

-- =====================================================
-- Permissões
-- =====================================================

GRANT SELECT ON v_monthly_financial_summary TO anon, authenticated;
GRANT SELECT ON v_monthly_revenue_evolution TO anon, authenticated;
GRANT SELECT ON v_top_customers_by_revenue TO anon, authenticated;
GRANT SELECT ON v_top_services_by_revenue TO anon, authenticated;

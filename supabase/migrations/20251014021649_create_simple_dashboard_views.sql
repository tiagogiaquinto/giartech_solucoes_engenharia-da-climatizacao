/*
  # Criar Views Simples do Dashboard

  1. Problema
    - Views v_service_performance e v_customer_profitability não existem
    - Erro 404 ao tentar acessá-las

  2. Solução
    - Criar views simples com dados básicos
    - Evitar colunas que podem não existir

  3. Views Criadas
    - v_service_performance
    - v_customer_profitability
*/

-- View de Performance de Serviços (Simples)
CREATE OR REPLACE VIEW v_service_performance AS
SELECT 
  sc.id,
  sc.name AS service_name,
  sc.category,
  sc.base_price,
  COUNT(soi.id) AS total_orders,
  COALESCE(SUM(soi.quantity), 0) AS total_quantity,
  COALESCE(SUM(soi.total_price), 0) AS total_revenue
FROM service_catalog sc
LEFT JOIN service_order_items soi ON soi.service_catalog_id = sc.id
WHERE sc.active = true
GROUP BY sc.id, sc.name, sc.category, sc.base_price;

-- View de Lucratividade por Cliente (Simples)
CREATE OR REPLACE VIEW v_customer_profitability AS
SELECT 
  c.id,
  c.nome_razao AS customer_name,
  c.tipo_pessoa,
  COUNT(so.id) AS total_orders,
  COALESCE(SUM(so.final_total), 0) AS total_revenue,
  MAX(so.created_at) AS last_order_date
FROM customers c
LEFT JOIN service_orders so ON so.customer_id = c.id
GROUP BY c.id, c.nome_razao, c.tipo_pessoa;

-- Conceder permissões
GRANT SELECT ON v_service_performance TO anon, authenticated;
GRANT SELECT ON v_customer_profitability TO anon, authenticated;
/*
  # Fix Gamification Views Permissions

  This migration adds proper permissions to the gamification views so they can be accessed by the application.

  ## Changes
  
  1. Grant SELECT permissions on gamification views to anon and authenticated roles
  2. Ensure views are accessible from the application
*/

-- Grant permissions on gamification views
GRANT SELECT ON v_relatorio_gamificacao_cliente TO anon, authenticated;
GRANT SELECT ON v_os_disponiveis_gamificacao TO anon, authenticated;

-- Ensure the views exist (recreate if needed)
DROP VIEW IF EXISTS v_relatorio_gamificacao_cliente CASCADE;
CREATE OR REPLACE VIEW v_relatorio_gamificacao_cliente AS
SELECT
  c.id,
  c.nome_razao,
  c.participa_gamificacao,
  c.data_adesao_gamificacao,
  COALESCE(cp.total_points, 0) as total_points,
  COALESCE(cp.current_tier, 'bronze') as current_tier,
  COALESCE(cp.total_purchases, 0) as total_purchases,
  COALESCE(cp.total_spent, 0) as total_spent,
  COUNT(DISTINCT cbe.badge_id) as total_badges,
  COUNT(DISTINCT so.id) FILTER (WHERE so.incluir_gamificacao) as os_na_gamificacao,
  COUNT(DISTINCT so.id) FILTER (WHERE so.status = 'concluida' AND NOT COALESCE(so.incluir_gamificacao, false)) as os_pendentes_inclusao,
  COALESCE(SUM(so.total_value) FILTER (WHERE so.status = 'concluida' AND NOT COALESCE(so.incluir_gamificacao, false)), 0) as valor_pendente
FROM customers c
LEFT JOIN customer_points cp ON c.id = cp.customer_id
LEFT JOIN customer_badges_earned cbe ON c.id = cbe.customer_id
LEFT JOIN service_orders so ON c.id = so.customer_id
GROUP BY c.id, c.nome_razao, c.participa_gamificacao, c.data_adesao_gamificacao,
         cp.total_points, cp.current_tier, cp.total_purchases, cp.total_spent;

DROP VIEW IF EXISTS v_os_disponiveis_gamificacao CASCADE;
CREATE OR REPLACE VIEW v_os_disponiveis_gamificacao AS
SELECT
  so.id,
  so.order_number,
  so.customer_id,
  c.nome_razao as customer_name,
  c.participa_gamificacao,
  so.status,
  so.total_value,
  so.created_at,
  so.incluir_gamificacao,
  COALESCE(so.pontos_gerados, 0) as pontos_gerados,
  CASE
    WHEN NOT c.participa_gamificacao THEN 'Cliente não participa'
    WHEN so.status != 'concluida' THEN 'OS não concluída'
    WHEN so.incluir_gamificacao THEN 'Já incluída'
    ELSE 'Disponível'
  END as status_gamificacao,
  (c.participa_gamificacao AND so.status = 'concluida' AND NOT COALESCE(so.incluir_gamificacao, false)) as pode_incluir
FROM service_orders so
INNER JOIN customers c ON so.customer_id = c.id
WHERE so.status = 'concluida';

-- Grant permissions again
GRANT SELECT ON v_relatorio_gamificacao_cliente TO anon, authenticated;
GRANT SELECT ON v_os_disponiveis_gamificacao TO anon, authenticated;

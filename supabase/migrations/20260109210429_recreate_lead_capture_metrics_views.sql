/*
  # Recriar views de métricas de campanhas
  
  1. Remove views antigas
  2. Cria views novas com nomes únicos
  3. Adiciona métricas de performance
*/

-- Remover views antigas se existirem
DROP VIEW IF EXISTS v_campaign_metrics_summary CASCADE;
DROP VIEW IF EXISTS v_campaign_performance CASCADE;
DROP VIEW IF EXISTS v_leads_by_period CASCADE;
DROP VIEW IF EXISTS v_top_campaigns CASCADE;

-- View: Resumo de métricas gerais
CREATE VIEW v_campaign_metrics_summary AS
SELECT
  COUNT(*) as total_campaigns,
  COUNT(*) FILTER (WHERE status = 'ativo') as active_campaigns,
  COUNT(*) FILTER (WHERE status = 'pausado') as paused_campaigns,
  COALESCE(SUM(total_leads_captured), 0) as total_leads,
  COALESCE(ROUND(AVG(total_leads_captured), 1), 0) as avg_leads_per_campaign,
  COUNT(*) FILTER (WHERE auto_capture_enabled = true) as auto_campaigns
FROM lead_capture_campaigns;

-- View: Performance por campanha individual
CREATE VIEW v_campaign_performance AS
SELECT
  lcc.id,
  COALESCE(lcc.name, lcc.nome) as campaign_name,
  lcc.status as campaign_status,
  lcc.search_type,
  lcc.source_type,
  lcc.total_leads_captured,
  lcc.auto_capture_enabled,
  lcc.capture_frequency,
  lcc.last_capture_at,
  lcc.created_at,
  CASE
    WHEN lcc.last_capture_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (NOW() - lcc.last_capture_at)) / 86400
    ELSE NULL
  END as days_since_last_capture,
  array_length(lcc.search_keywords, 1) as keyword_count,
  CASE
    WHEN lcc.created_at < NOW() - INTERVAL '30 days' AND lcc.total_leads_captured > 0 THEN
      ROUND(lcc.total_leads_captured::numeric / EXTRACT(EPOCH FROM (NOW() - lcc.created_at)) * 86400 * 30, 1)
    ELSE 0
  END as leads_per_month_rate
FROM lead_capture_campaigns lcc;

-- View: Top campanhas
CREATE VIEW v_top_campaigns AS
SELECT
  id,
  campaign_name,
  campaign_status,
  search_type,
  total_leads_captured,
  leads_per_month_rate,
  last_capture_at,
  CASE
    WHEN leads_per_month_rate > 100 THEN 'Excelente'
    WHEN leads_per_month_rate > 50 THEN 'Ótima'
    WHEN leads_per_month_rate > 20 THEN 'Boa'
    WHEN leads_per_month_rate > 0 THEN 'Regular'
    ELSE 'Sem dados'
  END as performance_rating
FROM v_campaign_performance
ORDER BY total_leads_captured DESC, leads_per_month_rate DESC
LIMIT 10;

-- Conceder permissões
GRANT SELECT ON v_campaign_metrics_summary TO anon, authenticated;
GRANT SELECT ON v_campaign_performance TO anon, authenticated;
GRANT SELECT ON v_top_campaigns TO anon, authenticated;
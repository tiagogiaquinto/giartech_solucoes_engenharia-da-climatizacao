/*
  # Remover Sistema Google Ads Premium

  1. Remoções
    - Tabelas do sistema Google Ads
    - Funções relacionadas ao Google Ads
    - Triggers e índices

  2. Segurança
    - Operação segura com IF EXISTS
    - Ordem correta de remoção (dependências primeiro)
*/

-- ==========================================
-- REMOVER TABELAS (ordem inversa de dependências)
-- ==========================================

-- Remover tabela de alertas
DROP TABLE IF EXISTS google_ads_alerts CASCADE;

-- Remover tabela de métricas
DROP TABLE IF EXISTS google_ads_metrics CASCADE;

-- Remover tabela de conversões
DROP TABLE IF EXISTS google_ads_conversions CASCADE;

-- Remover tabela de cliques
DROP TABLE IF EXISTS google_ads_clicks CASCADE;

-- Remover tabela de campanhas
DROP TABLE IF EXISTS google_ads_campaigns CASCADE;

-- Remover tabela de tokens OAuth
DROP TABLE IF EXISTS google_ads_oauth_tokens CASCADE;

-- Remover tabela de contas
DROP TABLE IF EXISTS google_ads_accounts CASCADE;

-- ==========================================
-- REMOVER FUNÇÕES (após remover tabelas)
-- ==========================================

DROP FUNCTION IF EXISTS check_token_expired(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_valid_access_token(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_oauth_tokens_updated_at() CASCADE;
DROP FUNCTION IF EXISTS sync_google_ads_data() CASCADE;
DROP FUNCTION IF EXISTS calculate_campaign_roi(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_realtime_campaign_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS check_campaign_alerts() CASCADE;

-- ==========================================
-- LIMPEZA ADICIONAL
-- ==========================================

-- Remover possíveis views relacionadas
DROP VIEW IF EXISTS v_google_ads_performance CASCADE;
DROP VIEW IF EXISTS v_google_ads_daily_stats CASCADE;
DROP VIEW IF EXISTS v_google_ads_roi_analysis CASCADE;

-- Remover possíveis tipos customizados
DROP TYPE IF EXISTS google_ads_status CASCADE;
DROP TYPE IF EXISTS google_ads_conversion_type CASCADE;

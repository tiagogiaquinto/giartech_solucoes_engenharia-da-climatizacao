/*
  # Sistema de Rastreamento Google Ads em Tempo Real
  
  1. Tabelas
    - google_ads_accounts - Contas do Google Ads conectadas
    - google_ads_campaigns - Campanhas rastreadas
    - google_ads_clicks - Cliques em tempo real
    - google_ads_conversions - Conversões rastreadas
    - google_ads_metrics - Métricas agregadas por período
    - google_ads_alerts - Alertas configurados
  
  2. Funções
    - sync_google_ads_data() - Sincroniza dados da API
    - calculate_campaign_roi() - Calcula ROI das campanhas
    - get_realtime_campaign_stats() - Estatísticas em tempo real
    - check_campaign_alerts() - Verifica alertas configurados
  
  3. Segurança
    - RLS habilitado em todas as tabelas
    - Acesso público para desenvolvimento
*/

-- ==========================================
-- TABELAS
-- ==========================================

-- Contas do Google Ads
CREATE TABLE IF NOT EXISTS google_ads_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  customer_id TEXT UNIQUE NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  currency TEXT DEFAULT 'BRL',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_frequency_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campanhas do Google Ads
CREATE TABLE IF NOT EXISTS google_ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES google_ads_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_status TEXT CHECK (campaign_status IN ('ENABLED', 'PAUSED', 'REMOVED', 'UNKNOWN')),
  campaign_type TEXT,
  budget_amount NUMERIC(15,2),
  target_cpa NUMERIC(15,2),
  target_roas NUMERIC(15,2),
  start_date DATE,
  end_date DATE,
  is_tracked BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, campaign_id)
);

-- Cliques em tempo real
CREATE TABLE IF NOT EXISTS google_ads_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES google_ads_campaigns(id) ON DELETE CASCADE,
  click_id TEXT,
  click_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_type TEXT,
  ad_group_id TEXT,
  ad_group_name TEXT,
  keyword TEXT,
  match_type TEXT,
  landing_page_url TEXT,
  cost NUMERIC(15,2),
  quality_score INTEGER,
  user_ip TEXT,
  user_agent TEXT,
  geo_location TEXT,
  converted BOOLEAN DEFAULT false,
  conversion_value NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversões rastreadas
CREATE TABLE IF NOT EXISTS google_ads_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id UUID REFERENCES google_ads_clicks(id) ON DELETE SET NULL,
  campaign_id UUID NOT NULL REFERENCES google_ads_campaigns(id) ON DELETE CASCADE,
  conversion_name TEXT NOT NULL,
  conversion_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  conversion_value NUMERIC(15,2) NOT NULL,
  conversion_type TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  service_order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Métricas agregadas
CREATE TABLE IF NOT EXISTS google_ads_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES google_ads_campaigns(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  metric_hour INTEGER,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost NUMERIC(15,2) DEFAULT 0,
  revenue NUMERIC(15,2) DEFAULT 0,
  ctr NUMERIC(5,2),
  cpc NUMERIC(15,2),
  cpa NUMERIC(15,2),
  roas NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, metric_date, metric_hour)
);

-- Alertas configurados
CREATE TABLE IF NOT EXISTS google_ads_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES google_ads_campaigns(id) ON DELETE CASCADE,
  alert_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('budget_spent', 'low_ctr', 'high_cpa', 'low_conversions', 'campaign_paused')),
  threshold_value NUMERIC(15,2),
  comparison_operator TEXT CHECK (comparison_operator IN ('greater_than', 'less_than', 'equals')),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  notification_channels TEXT[] DEFAULT ARRAY['in_app'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Log de sincronizações
CREATE TABLE IF NOT EXISTS google_ads_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES google_ads_accounts(id) ON DELETE CASCADE,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'error', 'partial')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  sync_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ÍNDICES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_campaigns_account ON google_ads_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON google_ads_campaigns(campaign_status) WHERE is_tracked = true;
CREATE INDEX IF NOT EXISTS idx_clicks_campaign ON google_ads_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON google_ads_clicks(click_timestamp);
CREATE INDEX IF NOT EXISTS idx_clicks_converted ON google_ads_clicks(converted);
CREATE INDEX IF NOT EXISTS idx_conversions_campaign ON google_ads_conversions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_conversions_timestamp ON google_ads_conversions(conversion_timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_campaign_date ON google_ads_metrics(campaign_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON google_ads_alerts(campaign_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sync_log_account ON google_ads_sync_log(account_id, created_at);

-- ==========================================
-- FUNÇÕES
-- ==========================================

-- Função para calcular ROI da campanha
CREATE OR REPLACE FUNCTION calculate_campaign_roi(
  p_campaign_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  total_cost NUMERIC,
  total_revenue NUMERIC,
  total_clicks INTEGER,
  total_conversions INTEGER,
  roi_percentage NUMERIC,
  roas NUMERIC,
  cpa NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS campaign_id,
    c.campaign_name,
    COALESCE(SUM(m.cost), 0) AS total_cost,
    COALESCE(SUM(m.revenue), 0) AS total_revenue,
    COALESCE(SUM(m.clicks), 0)::INTEGER AS total_clicks,
    COALESCE(SUM(m.conversions), 0)::INTEGER AS total_conversions,
    CASE 
      WHEN COALESCE(SUM(m.cost), 0) > 0 
      THEN ((COALESCE(SUM(m.revenue), 0) - COALESCE(SUM(m.cost), 0)) / COALESCE(SUM(m.cost), 0) * 100)
      ELSE 0 
    END AS roi_percentage,
    CASE 
      WHEN COALESCE(SUM(m.cost), 0) > 0 
      THEN (COALESCE(SUM(m.revenue), 0) / COALESCE(SUM(m.cost), 0))
      ELSE 0 
    END AS roas,
    CASE 
      WHEN COALESCE(SUM(m.conversions), 0) > 0 
      THEN (COALESCE(SUM(m.cost), 0) / COALESCE(SUM(m.conversions), 0))
      ELSE 0 
    END AS cpa,
    CASE 
      WHEN COALESCE(SUM(m.clicks), 0) > 0 
      THEN (COALESCE(SUM(m.conversions), 0)::NUMERIC / COALESCE(SUM(m.clicks), 0) * 100)
      ELSE 0 
    END AS conversion_rate
  FROM
    google_ads_campaigns c
    LEFT JOIN google_ads_metrics m ON c.id = m.campaign_id
  WHERE
    c.id = p_campaign_id
    AND m.metric_date BETWEEN p_start_date AND p_end_date
  GROUP BY
    c.id, c.campaign_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para estatísticas em tempo real
CREATE OR REPLACE FUNCTION get_realtime_campaign_stats(
  p_time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  clicks_last_hour INTEGER,
  clicks_today INTEGER,
  conversions_today INTEGER,
  cost_today NUMERIC,
  avg_cpc NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS campaign_id,
    c.campaign_name,
    COUNT(CASE WHEN cl.click_timestamp >= NOW() - INTERVAL '1 hour' THEN 1 END)::INTEGER AS clicks_last_hour,
    COUNT(CASE WHEN cl.click_timestamp >= CURRENT_DATE THEN 1 END)::INTEGER AS clicks_today,
    COUNT(CASE WHEN cl.converted = true AND cl.click_timestamp >= CURRENT_DATE THEN 1 END)::INTEGER AS conversions_today,
    COALESCE(SUM(CASE WHEN cl.click_timestamp >= CURRENT_DATE THEN cl.cost ELSE 0 END), 0) AS cost_today,
    CASE 
      WHEN COUNT(CASE WHEN cl.click_timestamp >= CURRENT_DATE THEN 1 END) > 0
      THEN (COALESCE(SUM(CASE WHEN cl.click_timestamp >= CURRENT_DATE THEN cl.cost ELSE 0 END), 0) / COUNT(CASE WHEN cl.click_timestamp >= CURRENT_DATE THEN 1 END))
      ELSE 0 
    END AS avg_cpc,
    CASE 
      WHEN COUNT(CASE WHEN cl.click_timestamp >= CURRENT_DATE THEN 1 END) > 0
      THEN (COUNT(CASE WHEN cl.converted = true AND cl.click_timestamp >= CURRENT_DATE THEN 1 END)::NUMERIC / COUNT(CASE WHEN cl.click_timestamp >= CURRENT_DATE THEN 1 END) * 100)
      ELSE 0 
    END AS conversion_rate
  FROM
    google_ads_campaigns c
    LEFT JOIN google_ads_clicks cl ON c.id = cl.campaign_id
  WHERE
    c.is_tracked = true
    AND c.campaign_status = 'ENABLED'
    AND cl.click_timestamp >= NOW() - (p_time_window_hours || ' hours')::INTERVAL
  GROUP BY
    c.id, c.campaign_name
  ORDER BY
    clicks_last_hour DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar alertas
CREATE OR REPLACE FUNCTION check_campaign_alerts()
RETURNS TABLE (
  alert_id UUID,
  campaign_name TEXT,
  alert_name TEXT,
  alert_type TEXT,
  current_value NUMERIC,
  threshold_value NUMERIC,
  triggered BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH campaign_metrics AS (
    SELECT
      c.id AS campaign_id,
      c.campaign_name,
      COALESCE(SUM(m.cost), 0) AS total_cost,
      CASE 
        WHEN COALESCE(SUM(m.impressions), 0) > 0
        THEN (COALESCE(SUM(m.clicks), 0)::NUMERIC / COALESCE(SUM(m.impressions), 0) * 100)
        ELSE 0
      END AS ctr,
      CASE 
        WHEN COALESCE(SUM(m.conversions), 0) > 0
        THEN (COALESCE(SUM(m.cost), 0) / COALESCE(SUM(m.conversions), 0))
        ELSE 0
      END AS cpa,
      COALESCE(SUM(m.conversions), 0) AS total_conversions
    FROM
      google_ads_campaigns c
      LEFT JOIN google_ads_metrics m ON c.id = m.campaign_id AND m.metric_date = CURRENT_DATE
    GROUP BY
      c.id, c.campaign_name
  )
  SELECT
    a.id AS alert_id,
    cm.campaign_name,
    a.alert_name,
    a.alert_type,
    CASE a.alert_type
      WHEN 'budget_spent' THEN cm.total_cost
      WHEN 'low_ctr' THEN cm.ctr
      WHEN 'high_cpa' THEN cm.cpa
      WHEN 'low_conversions' THEN cm.total_conversions
      ELSE 0
    END AS current_value,
    a.threshold_value,
    CASE 
      WHEN a.comparison_operator = 'greater_than' AND
        CASE a.alert_type
          WHEN 'budget_spent' THEN cm.total_cost > a.threshold_value
          WHEN 'high_cpa' THEN cm.cpa > a.threshold_value
          ELSE false
        END
      THEN true
      WHEN a.comparison_operator = 'less_than' AND
        CASE a.alert_type
          WHEN 'low_ctr' THEN cm.ctr < a.threshold_value
          WHEN 'low_conversions' THEN cm.total_conversions < a.threshold_value
          ELSE false
        END
      THEN true
      ELSE false
    END AS triggered
  FROM
    google_ads_alerts a
    INNER JOIN campaign_metrics cm ON a.campaign_id = cm.campaign_id
  WHERE
    a.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_google_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_google_ads_accounts_updated
  BEFORE UPDATE ON google_ads_accounts
  FOR EACH ROW EXECUTE FUNCTION update_google_ads_updated_at();

CREATE TRIGGER trigger_google_ads_campaigns_updated
  BEFORE UPDATE ON google_ads_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_google_ads_updated_at();

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE google_ads_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on google_ads_accounts" ON google_ads_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on google_ads_campaigns" ON google_ads_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on google_ads_clicks" ON google_ads_clicks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on google_ads_conversions" ON google_ads_conversions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on google_ads_metrics" ON google_ads_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on google_ads_alerts" ON google_ads_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on google_ads_sync_log" ON google_ads_sync_log FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

GRANT EXECUTE ON FUNCTION calculate_campaign_roi TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_realtime_campaign_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_campaign_alerts TO anon, authenticated;

-- ==========================================
-- COMENTÁRIOS
-- ==========================================

COMMENT ON TABLE google_ads_accounts IS 'Contas do Google Ads conectadas ao sistema';
COMMENT ON TABLE google_ads_campaigns IS 'Campanhas rastreadas do Google Ads';
COMMENT ON TABLE google_ads_clicks IS 'Cliques em tempo real nas campanhas';
COMMENT ON TABLE google_ads_conversions IS 'Conversões rastreadas das campanhas';
COMMENT ON TABLE google_ads_metrics IS 'Métricas agregadas por período';
COMMENT ON TABLE google_ads_alerts IS 'Alertas configurados para as campanhas';
COMMENT ON FUNCTION calculate_campaign_roi IS 'Calcula ROI e métricas das campanhas';
COMMENT ON FUNCTION get_realtime_campaign_stats IS 'Retorna estatísticas em tempo real';
COMMENT ON FUNCTION check_campaign_alerts IS 'Verifica alertas acionados';

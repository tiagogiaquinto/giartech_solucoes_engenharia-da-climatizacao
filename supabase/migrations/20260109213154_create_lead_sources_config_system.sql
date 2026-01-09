/*
  # Sistema de Configuração de Fontes de Leads

  1. Novas Tabelas
    - `lead_sources_config`
      - Configurações de APIs de múltiplas fontes
      - Google Maps, LinkedIn, Facebook, Instagram, etc
      - Armazena credenciais e parâmetros
      
  2. Segurança
    - RLS habilitado
    - Políticas para acesso autenticado
*/

-- Criar tabela de configuração de fontes de leads
CREATE TABLE IF NOT EXISTS lead_sources_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN (
    'google_maps',
    'google_places',
    'linkedin',
    'facebook',
    'instagram',
    'twitter',
    'google_ads',
    'bing_ads',
    'tiktok',
    'youtube',
    'whatsapp_business',
    'email_api',
    'custom'
  )),
  is_active boolean DEFAULT false,
  api_key text,
  api_secret text,
  access_token text,
  refresh_token text,
  client_id text,
  client_secret text,
  additional_config jsonb DEFAULT '{}'::jsonb,
  search_parameters jsonb DEFAULT '{}'::jsonb,
  rate_limits jsonb DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  last_test_at timestamptz,
  test_status text CHECK (test_status IN ('success', 'failed', 'pending', 'not_tested')),
  test_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE lead_sources_config ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow authenticated users to view lead sources config"
  ON lead_sources_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage lead sources config"
  ON lead_sources_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para anon (desenvolvimento)
CREATE POLICY "Allow anon to view lead sources config"
  ON lead_sources_config FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage lead sources config"
  ON lead_sources_config FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_lead_sources_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_lead_sources_config_updated_at_trigger
  BEFORE UPDATE ON lead_sources_config
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_sources_config_updated_at();

-- Inserir configurações padrão
INSERT INTO lead_sources_config (source_name, source_type, is_active, search_parameters, rate_limits)
VALUES
  (
    'Google Maps API',
    'google_maps',
    false,
    '{"default_radius_km": 10, "default_language": "pt-BR", "max_results_per_search": 20}'::jsonb,
    '{"requests_per_day": 1000, "requests_per_minute": 50}'::jsonb
  ),
  (
    'Google Places API',
    'google_places',
    false,
    '{"default_radius_km": 5, "default_language": "pt-BR", "types": ["establishment"]}'::jsonb,
    '{"requests_per_day": 1000, "requests_per_minute": 50}'::jsonb
  ),
  (
    'LinkedIn Sales Navigator',
    'linkedin',
    false,
    '{"search_type": "companies", "default_location": "Brazil", "default_industry": []}'::jsonb,
    '{"requests_per_day": 100, "requests_per_hour": 10}'::jsonb
  ),
  (
    'Facebook Graph API',
    'facebook',
    false,
    '{"search_type": "pages", "default_location": "Brazil", "default_categories": []}'::jsonb,
    '{"requests_per_day": 200, "requests_per_hour": 50}'::jsonb
  ),
  (
    'Instagram Business API',
    'instagram',
    false,
    '{"search_type": "business_accounts", "default_location": "Brazil"}'::jsonb,
    '{"requests_per_day": 200, "requests_per_hour": 50}'::jsonb
  ),
  (
    'Twitter/X API',
    'twitter',
    false,
    '{"search_type": "businesses", "default_location": "Brazil"}'::jsonb,
    '{"requests_per_day": 500, "requests_per_hour": 100}'::jsonb
  ),
  (
    'Google Ads API',
    'google_ads',
    false,
    '{"search_type": "competitors", "default_location": "Brazil"}'::jsonb,
    '{"requests_per_day": 1000, "requests_per_minute": 50}'::jsonb
  ),
  (
    'TikTok Business API',
    'tiktok',
    false,
    '{"search_type": "business_accounts", "default_location": "Brazil"}'::jsonb,
    '{"requests_per_day": 100, "requests_per_hour": 20}'::jsonb
  ),
  (
    'YouTube Data API',
    'youtube',
    false,
    '{"search_type": "channels", "default_location": "Brazil", "min_subscribers": 1000}'::jsonb,
    '{"requests_per_day": 10000, "requests_per_minute": 100}'::jsonb
  ),
  (
    'WhatsApp Business API',
    'whatsapp_business',
    false,
    '{"search_type": "business_profiles", "default_location": "Brazil"}'::jsonb,
    '{"requests_per_day": 1000, "requests_per_minute": 80}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_lead_sources_config_source_type ON lead_sources_config(source_type);
CREATE INDEX IF NOT EXISTS idx_lead_sources_config_is_active ON lead_sources_config(is_active);

-- Comentários
COMMENT ON TABLE lead_sources_config IS 'Configurações de APIs para captação de leads de múltiplas fontes';
COMMENT ON COLUMN lead_sources_config.source_type IS 'Tipo da fonte de leads';
COMMENT ON COLUMN lead_sources_config.is_active IS 'Indica se a fonte está ativa';
COMMENT ON COLUMN lead_sources_config.search_parameters IS 'Parâmetros padrão de busca';
COMMENT ON COLUMN lead_sources_config.rate_limits IS 'Limites de taxa da API';

/*
  # Sistema de Provedores de IA

  1. Novas Tabelas
    - `ai_provider_keys` - Armazena chaves de API dos provedores
    - `ai_provider_usage` - Registra uso dos provedores
    - `thomaz_ai_enhancements` - Melhorias de IA para o Thomaz

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para acesso anônimo (desenvolvimento)

  3. Funcionalidades
    - Suporte para múltiplos provedores de IA gratuitos
    - Rastreamento de uso e tokens
    - Fallback automático entre provedores
*/

-- Tabela de chaves de API dos provedores
CREATE TABLE IF NOT EXISTS ai_provider_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  api_key text NOT NULL,
  active boolean DEFAULT true,
  description text,
  free_tier_limit integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_name)
);

-- Tabela de uso dos provedores
CREATE TABLE IF NOT EXISTS ai_provider_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  model_name text NOT NULL,
  tokens_used integer DEFAULT 0,
  request_type text,
  success boolean DEFAULT true,
  error_message text,
  response_time_ms integer,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Tabela de melhorias de IA para o Thomaz
CREATE TABLE IF NOT EXISTS thomaz_ai_enhancements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enhancement_type text NOT NULL,
  description text NOT NULL,
  provider_used text,
  input_prompt text,
  output_content text,
  quality_score numeric(3,2) DEFAULT 0.0,
  approved boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  applied_at timestamptz
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_provider ON ai_provider_usage(provider_name);
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_created_at ON ai_provider_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_success ON ai_provider_usage(success);
CREATE INDEX IF NOT EXISTS idx_thomaz_ai_enhancements_type ON thomaz_ai_enhancements(enhancement_type);
CREATE INDEX IF NOT EXISTS idx_thomaz_ai_enhancements_approved ON thomaz_ai_enhancements(approved);

-- Habilitar RLS
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_ai_enhancements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso total para desenvolvimento)
CREATE POLICY "Permitir acesso total a ai_provider_keys"
  ON ai_provider_keys
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir acesso total a ai_provider_usage"
  ON ai_provider_usage
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir acesso total a thomaz_ai_enhancements"
  ON thomaz_ai_enhancements
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_provider_keys_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ai_provider_keys_updated_at
  BEFORE UPDATE ON ai_provider_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_provider_keys_updated_at();

-- Função para obter estatísticas de uso
CREATE OR REPLACE FUNCTION get_ai_provider_stats(
  p_days integer DEFAULT 7
)
RETURNS TABLE(
  provider_name text,
  total_requests bigint,
  total_tokens bigint,
  success_rate numeric,
  avg_response_time numeric,
  error_count bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    apu.provider_name,
    COUNT(*)::bigint as total_requests,
    SUM(apu.tokens_used)::bigint as total_tokens,
    ROUND((COUNT(*) FILTER (WHERE apu.success = true)::numeric / COUNT(*)::numeric * 100), 2) as success_rate,
    ROUND(AVG(apu.response_time_ms), 2) as avg_response_time,
    COUNT(*) FILTER (WHERE apu.success = false)::bigint as error_count
  FROM ai_provider_usage apu
  WHERE apu.created_at >= (now() - (p_days || ' days')::interval)
  GROUP BY apu.provider_name
  ORDER BY total_requests DESC;
END;
$$;

-- Função para rotacionar provedores automaticamente
CREATE OR REPLACE FUNCTION get_best_ai_provider()
RETURNS TABLE(
  provider_name text,
  api_key text,
  model_name text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats record;
BEGIN
  -- Buscar provedor com melhor taxa de sucesso nas últimas 24h
  FOR v_stats IN
    SELECT
      apk.provider_name,
      apk.api_key,
      'default' as model_name,
      COALESCE(
        (
          SELECT COUNT(*) FILTER (WHERE success = true)::numeric / NULLIF(COUNT(*)::numeric, 0) * 100
          FROM ai_provider_usage apu
          WHERE apu.provider_name = apk.provider_name
            AND apu.created_at >= now() - interval '24 hours'
        ),
        100.0
      ) as success_rate
    FROM ai_provider_keys apk
    WHERE apk.active = true
    ORDER BY success_rate DESC, apk.created_at ASC
    LIMIT 1
  LOOP
    provider_name := v_stats.provider_name;
    api_key := v_stats.api_key;
    model_name := v_stats.model_name;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

-- Inserir dados de exemplo (provedores configuráveis)
INSERT INTO ai_provider_keys (provider_name, api_key, description, free_tier_limit, active)
VALUES
  ('groq', 'CONFIGURE_SUA_API_KEY_AQUI', 'Groq - Llama 3.1 70B (14,400 req/day)', 14400, false),
  ('together', 'CONFIGURE_SUA_API_KEY_AQUI', 'Together AI - Llama 3.1 70B Turbo', 1000000, false),
  ('huggingface', 'CONFIGURE_SUA_API_KEY_AQUI', 'Hugging Face - Meta Llama 3 70B', 10000, false),
  ('gemini', 'CONFIGURE_SUA_API_KEY_AQUI', 'Google Gemini 1.5 Flash', 1500, false),
  ('cohere', 'CONFIGURE_SUA_API_KEY_AQUI', 'Cohere - Command', 1000, false)
ON CONFLICT (provider_name) DO NOTHING;

-- Comentários
COMMENT ON TABLE ai_provider_keys IS 'Armazena chaves de API dos provedores de IA';
COMMENT ON TABLE ai_provider_usage IS 'Registra cada uso dos provedores de IA';
COMMENT ON TABLE thomaz_ai_enhancements IS 'Melhorias e aprendizados do Thomaz via IA';
COMMENT ON FUNCTION get_ai_provider_stats IS 'Retorna estatísticas de uso dos provedores de IA';
COMMENT ON FUNCTION get_best_ai_provider IS 'Retorna o melhor provedor disponível baseado em taxa de sucesso';

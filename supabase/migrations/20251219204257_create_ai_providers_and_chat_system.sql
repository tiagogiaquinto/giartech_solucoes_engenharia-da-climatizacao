/*
  # Sistema de Provedores de IA e Chat Inteligente
  
  Cria infraestrutura completa para integração com APIs de IA
  e processamento conversacional avançado.
  
  ## Componentes
  
  1. **Tabela de Provedores de IA**
     - Configuração de múltiplos provedores (OpenRouter, OpenAI, Anthropic)
     - Gerenciamento de API keys
     - Modelos disponíveis e configurações
  
  2. **Sistema de Chat com IA**
     - Integração com provedores
     - Histórico de conversas
     - Processamento contextual
*/

-- =====================================================
-- 1. TABELA DE PROVEDORES DE IA
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_type text NOT NULL,
  api_key text,
  api_url text,
  default_model text,
  available_models jsonb DEFAULT '[]',
  config jsonb DEFAULT '{}',
  active boolean DEFAULT false,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(active, priority);

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ai providers"
  ON ai_providers FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. INSERIR PROVEDORES PADRÃO
-- =====================================================

INSERT INTO ai_providers (name, provider_type, api_url, default_model, available_models, config, active, priority) VALUES
(
  'OpenRouter',
  'openrouter',
  'https://openrouter.ai/api/v1/chat/completions',
  'anthropic/claude-3.5-sonnet',
  '["anthropic/claude-3.5-sonnet", "anthropic/claude-3-opus", "openai/gpt-4-turbo", "google/gemini-pro-1.5", "meta-llama/llama-3.1-70b-instruct"]'::jsonb,
  '{
    "temperature": 0.7,
    "max_tokens": 4000,
    "top_p": 0.9,
    "frequency_penalty": 0.1,
    "presence_penalty": 0.1
  }'::jsonb,
  true,
  1
),
(
  'Anthropic',
  'anthropic',
  'https://api.anthropic.com/v1/messages',
  'claude-3-5-sonnet-20241022',
  '["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"]'::jsonb,
  '{
    "temperature": 0.7,
    "max_tokens": 4000
  }'::jsonb,
  false,
  2
),
(
  'OpenAI',
  'openai',
  'https://api.openai.com/v1/chat/completions',
  'gpt-4-turbo-preview',
  '["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]'::jsonb,
  '{
    "temperature": 0.7,
    "max_tokens": 4000
  }'::jsonb,
  false,
  3
);

-- =====================================================
-- 3. FUNÇÃO: OBTER PROVEDOR ATIVO
-- =====================================================

CREATE OR REPLACE FUNCTION get_active_ai_provider()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'provider_type', provider_type,
    'api_key', api_key,
    'api_url', api_url,
    'default_model', default_model,
    'config', config
  ) INTO provider_data
  FROM ai_providers
  WHERE active = true
  ORDER BY priority ASC
  LIMIT 1;
  
  RETURN provider_data;
END;
$$;

-- =====================================================
-- 4. FUNÇÃO: PREPARAR CONTEXTO PARA IA
-- =====================================================

CREATE OR REPLACE FUNCTION prepare_ai_context(
  user_message text,
  session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  context_data jsonb;
  intent_result jsonb;
  business_context jsonb := '{}'::jsonb;
BEGIN
  intent_result := thomaz_detect_intent_advanced(user_message, '{}'::jsonb);
  
  IF (intent_result->>'intent') = 'inventory_query' THEN
    SELECT jsonb_build_object(
      'resumo', resumo,
      'itens_criticos', itens_criticos,
      'analise', analise
    ) INTO business_context
    FROM thomaz_analyze_inventory();
    
  ELSIF (intent_result->>'intent') = 'financial_query' THEN
    SELECT row_to_json(t)::jsonb INTO business_context
    FROM thomaz_analyze_financials(30) t;
    
  ELSIF (intent_result->>'intent') = 'service_order_query' THEN
    SELECT row_to_json(t)::jsonb INTO business_context
    FROM thomaz_analyze_service_orders(30) t;
    
  ELSIF (intent_result->>'intent') = 'customer_query' THEN
    SELECT row_to_json(t)::jsonb INTO business_context
    FROM thomaz_analyze_customers() t;
  END IF;
  
  context_data := jsonb_build_object(
    'intent_analysis', intent_result,
    'business_data', business_context,
    'session_id', session_id,
    'timestamp', now()
  );
  
  RETURN context_data;
END;
$$;

-- =====================================================
-- 5. GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_active_ai_provider() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION prepare_ai_context(text, text) TO authenticated, anon;

COMMENT ON TABLE ai_providers IS 'Configuração de provedores de IA para processamento conversacional';
COMMENT ON FUNCTION get_active_ai_provider() IS 'Retorna o provedor de IA ativo com maior prioridade';
COMMENT ON FUNCTION prepare_ai_context(text, text) IS 'Prepara contexto completo para envio à IA incluindo análise de negócio';

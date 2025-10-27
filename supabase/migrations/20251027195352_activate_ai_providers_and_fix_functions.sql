/*
  # Ativar Sistema de IA e Corrigir Funções

  1. Criar tabela ai_provider_keys se não existir
  2. Criar tabela ai_provider_usage se não existir
  3. Corrigir função thomaz_get_system_stats
  4. Ativar todos os sistemas
*/

-- Criar tabela de provedores de IA se não existir
CREATE TABLE IF NOT EXISTS ai_provider_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL UNIQUE,
  api_key text NOT NULL,
  active boolean DEFAULT true,
  description text,
  free_tier_limit integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de uso se não existir
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

-- Habilitar RLS
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_usage ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso total para desenvolvimento
DROP POLICY IF EXISTS "Permitir acesso total a ai_provider_keys" ON ai_provider_keys;
CREATE POLICY "Permitir acesso total a ai_provider_keys"
  ON ai_provider_keys
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total a ai_provider_usage" ON ai_provider_usage;
CREATE POLICY "Permitir acesso total a ai_provider_usage"
  ON ai_provider_usage
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Corrigir função thomaz_get_system_stats
CREATE OR REPLACE FUNCTION thomaz_get_system_stats()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_oss', COALESCE((SELECT COUNT(*) FROM service_orders), 0),
    'oss_abertas', COALESCE((SELECT COUNT(*) FROM service_orders WHERE status IN ('aberta', 'em_andamento', 'pending', 'in_progress')), 0),
    'total_clientes', COALESCE((SELECT COUNT(*) FROM customers), 0),
    'total_funcionarios', COALESCE((SELECT COUNT(*) FROM employees WHERE active = true), 0),
    'itens_estoque', COALESCE((SELECT COUNT(*) FROM inventory_items), 0),
    'estoque_baixo', COALESCE((
      SELECT COUNT(*) 
      FROM inventory_items 
      WHERE current_quantity <= minimum_quantity
    ), 0),
    'compromissos_hoje', COALESCE((
      SELECT COUNT(*) 
      FROM agenda_events 
      WHERE DATE(start_time) = CURRENT_DATE
    ), 0),
    'receitas_mes', COALESCE((
      SELECT SUM(amount) 
      FROM finance_entries 
      WHERE entry_type = 'receita' 
        AND EXTRACT(MONTH FROM entry_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM entry_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    ), 0),
    'despesas_mes', COALESCE((
      SELECT SUM(amount) 
      FROM finance_entries 
      WHERE entry_type = 'despesa' 
        AND EXTRACT(MONTH FROM entry_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM entry_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    ), 0)
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

-- Inserir provedores de IA padrão
INSERT INTO ai_provider_keys (provider_name, api_key, description, free_tier_limit, active)
VALUES
  ('groq', 'CONFIGURE_SUA_API_KEY_AQUI', 'Groq - Llama 3.1 70B (14,400 req/day)', 14400, false),
  ('together', 'CONFIGURE_SUA_API_KEY_AQUI', 'Together AI - Llama 3.1 70B Turbo', 1000000, false),
  ('huggingface', 'CONFIGURE_SUA_API_KEY_AQUI', 'Hugging Face - Meta Llama 3 70B', 10000, false),
  ('gemini', 'CONFIGURE_SUA_API_KEY_AQUI', 'Google Gemini 1.5 Flash', 1500, false),
  ('cohere', 'CONFIGURE_SUA_API_KEY_AQUI', 'Cohere - Command', 1000, false)
ON CONFLICT (provider_name) DO NOTHING;

-- Verificar instalação
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM ai_provider_keys;
  RAISE NOTICE '✅ Provedores de IA configurados: %', v_count;

  SELECT COUNT(*) INTO v_count FROM thomaz_nlp_patterns;
  RAISE NOTICE '✅ Padrões NLP carregados: %', v_count;

  RAISE NOTICE '';
  RAISE NOTICE '🎉 SISTEMA THOMAZ AI ATIVADO!';
  RAISE NOTICE '';
END $$;

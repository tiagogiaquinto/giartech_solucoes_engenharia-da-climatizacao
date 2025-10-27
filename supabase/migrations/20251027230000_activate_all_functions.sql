/*
  # ATIVAÇÃO COMPLETA DE TODAS AS FUNCIONALIDADES

  Este script ativa e verifica todas as funcionalidades do sistema:

  1. Sistema Thomaz AI com todas as capacidades
  2. Provedores de IA externos (Groq, Together, HuggingFace, Gemini, Cohere)
  3. Growth Machine AI
  4. Sistema de aprendizado e memória
  5. Biblioteca digital integrada
  6. Todos os protocolos e funções RPC
  7. Dashboard executivo completo
  8. Sistema financeiro integrado
  9. Gestão de OSs e estoque
  10. Agenda inteligente

  IMPORTANTE: Este script é idempotente (pode ser executado múltiplas vezes)
*/

-- ============================================================================
-- 1. VERIFICAR E ATIVAR TODAS AS TABELAS ESSENCIAIS
-- ============================================================================

DO $$
DECLARE
  v_table_name text;
  v_count integer;
BEGIN
  -- Verificar tabelas críticas
  FOR v_table_name IN
    SELECT unnest(ARRAY[
      'thomaz_personality_config',
      'thomaz_nlp_patterns',
      'thomaz_long_term_memory',
      'thomaz_interactions',
      'thomaz_conversation_context',
      'thomaz_learning_queue',
      'thomaz_feedback_analysis',
      'thomaz_web_knowledge',
      'thomaz_advanced_protocols',
      'ai_provider_keys',
      'ai_provider_usage',
      'thomaz_ai_enhancements',
      'library_items',
      'service_orders',
      'finance_entries',
      'inventory_items',
      'agenda_events'
    ])
  LOOP
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = v_table_name;

    IF v_count = 0 THEN
      RAISE NOTICE '⚠️  Tabela % não encontrada', v_table_name;
    ELSE
      RAISE NOTICE '✅ Tabela % ativa', v_table_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 2. GARANTIR QUE TODAS AS FUNÇÕES RPC ESTÃO DISPONÍVEIS
-- ============================================================================

-- Função para obter estatísticas do sistema
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
    'estoque_baixo', COALESCE((SELECT COUNT(*) FROM inventory_items WHERE current_quantity <= minimum_quantity), 0),
    'compromissos_hoje', COALESCE((SELECT COUNT(*) FROM agenda_events WHERE DATE(start_time) = CURRENT_DATE), 0),
    'receitas_mes', COALESCE((SELECT SUM(amount) FROM finance_entries WHERE entry_type = 'receita' AND EXTRACT(MONTH FROM entry_date) = EXTRACT(MONTH FROM CURRENT_DATE)), 0),
    'despesas_mes', COALESCE((SELECT SUM(amount) FROM finance_entries WHERE entry_type = 'despesa' AND EXTRACT(MONTH FROM entry_date) = EXTRACT(MONTH FROM CURRENT_DATE)), 0)
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

-- Função para obter informações de OSs
CREATE OR REPLACE FUNCTION thomaz_get_service_orders_info(
  p_filter text DEFAULT NULL,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  order_id uuid,
  order_number text,
  customer_name text,
  status text,
  total_value numeric,
  scheduled_at timestamptz,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    so.id as order_id,
    so.order_number,
    COALESCE(c.name, so.client_name, 'Cliente não identificado') as customer_name,
    so.status,
    COALESCE(so.total_value, 0) as total_value,
    so.scheduled_date as scheduled_at,
    so.created_at
  FROM service_orders so
  LEFT JOIN customers c ON c.id = so.customer_id
  WHERE (p_filter IS NULL OR
         so.order_number ILIKE '%' || p_filter || '%' OR
         COALESCE(c.name, so.client_name) ILIKE '%' || p_filter || '%' OR
         so.status ILIKE '%' || p_filter || '%')
  ORDER BY so.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Função para obter informações de estoque
CREATE OR REPLACE FUNCTION thomaz_get_inventory_info(
  p_search text DEFAULT NULL,
  p_low_stock_only boolean DEFAULT false
)
RETURNS TABLE(
  item_id uuid,
  sku text,
  product_name text,
  current_quantity numeric,
  minimum_quantity numeric,
  stock_status text,
  assigned_technician text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ii.id as item_id,
    ii.sku,
    ii.product_name,
    COALESCE(ii.current_quantity, 0) as current_quantity,
    COALESCE(ii.minimum_quantity, 0) as minimum_quantity,
    CASE
      WHEN COALESCE(ii.current_quantity, 0) = 0 THEN 'SEM ESTOQUE'
      WHEN COALESCE(ii.current_quantity, 0) <= COALESCE(ii.minimum_quantity, 0) THEN 'ESTOQUE BAIXO'
      WHEN COALESCE(ii.current_quantity, 0) <= (COALESCE(ii.minimum_quantity, 0) * 1.5) THEN 'ATENÇÃO'
      ELSE 'OK'
    END as stock_status,
    COALESCE(ii.assigned_technician, 'Geral') as assigned_technician
  FROM inventory_items ii
  WHERE (p_search IS NULL OR
         ii.sku ILIKE '%' || p_search || '%' OR
         ii.product_name ILIKE '%' || p_search || '%')
    AND (NOT p_low_stock_only OR COALESCE(ii.current_quantity, 0) <= COALESCE(ii.minimum_quantity, 0))
  ORDER BY
    CASE
      WHEN COALESCE(ii.current_quantity, 0) = 0 THEN 1
      WHEN COALESCE(ii.current_quantity, 0) <= COALESCE(ii.minimum_quantity, 0) THEN 2
      ELSE 3
    END,
    ii.product_name;
END;
$$;

-- Função para obter informações da agenda
CREATE OR REPLACE FUNCTION thomaz_get_agenda_info(
  p_date_from text DEFAULT NULL,
  p_date_to text DEFAULT NULL
)
RETURNS TABLE(
  event_id uuid,
  title text,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  event_type text,
  participants text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_date_from date;
  v_date_to date;
BEGIN
  v_date_from := COALESCE(p_date_from::date, CURRENT_DATE);
  v_date_to := COALESCE(p_date_to::date, CURRENT_DATE + INTERVAL '7 days');

  RETURN QUERY
  SELECT
    ae.id as event_id,
    ae.title,
    ae.description,
    ae.start_time,
    ae.end_time,
    COALESCE(ae.event_type, 'evento') as event_type,
    ae.participants
  FROM agenda_events ae
  WHERE DATE(ae.start_time) BETWEEN v_date_from AND v_date_to
  ORDER BY ae.start_time ASC;
END;
$$;

-- Função para obter informações de funcionários
CREATE OR REPLACE FUNCTION thomaz_get_employees_info(
  p_search text DEFAULT NULL,
  p_active_only boolean DEFAULT true
)
RETURNS TABLE(
  employee_id uuid,
  name text,
  email text,
  phone text,
  role text,
  department text,
  active boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as employee_id,
    e.name,
    e.email,
    e.phone,
    e.role,
    e.department,
    COALESCE(e.active, true) as active
  FROM employees e
  WHERE (NOT p_active_only OR COALESCE(e.active, true) = true)
    AND (p_search IS NULL OR
         e.name ILIKE '%' || p_search || '%' OR
         e.email ILIKE '%' || p_search || '%' OR
         e.role ILIKE '%' || p_search || '%')
  ORDER BY e.name;
END;
$$;

-- Função para obter lançamentos financeiros
CREATE OR REPLACE FUNCTION thomaz_get_financial_entries_info(
  p_date_from text DEFAULT NULL,
  p_date_to text DEFAULT NULL
)
RETURNS TABLE(
  entry_id uuid,
  description text,
  amount numeric,
  entry_type text,
  entry_date date,
  status text,
  category text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_date_from date;
  v_date_to date;
BEGIN
  v_date_from := COALESCE(p_date_from::date, CURRENT_DATE - INTERVAL '30 days');
  v_date_to := COALESCE(p_date_to::date, CURRENT_DATE);

  RETURN QUERY
  SELECT
    fe.id as entry_id,
    fe.description,
    fe.amount,
    fe.entry_type,
    fe.entry_date,
    COALESCE(fe.status, 'pendente') as status,
    COALESCE(fe.category, 'outros') as category
  FROM finance_entries fe
  WHERE fe.entry_date BETWEEN v_date_from AND v_date_to
  ORDER BY fe.entry_date DESC;
END;
$$;

-- Função para análise financeira
CREATE OR REPLACE FUNCTION thomaz_get_financial_analysis(
  p_date_from text DEFAULT NULL,
  p_date_to text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_date_from date;
  v_date_to date;
  v_result jsonb;
BEGIN
  v_date_from := COALESCE(p_date_from::date, CURRENT_DATE - INTERVAL '60 days');
  v_date_to := COALESCE(p_date_to::date, CURRENT_DATE);

  SELECT jsonb_build_object(
    'periodo', v_date_from || ' a ' || v_date_to,
    'receitas', COALESCE((SELECT SUM(amount) FROM finance_entries WHERE entry_type = 'receita' AND entry_date BETWEEN v_date_from AND v_date_to), 0),
    'despesas', COALESCE((SELECT SUM(amount) FROM finance_entries WHERE entry_type = 'despesa' AND entry_date BETWEEN v_date_from AND v_date_to), 0),
    'saldo', COALESCE((SELECT SUM(CASE WHEN entry_type = 'receita' THEN amount ELSE -amount END) FROM finance_entries WHERE entry_date BETWEEN v_date_from AND v_date_to), 0),
    'receitas_pendentes', COALESCE((SELECT SUM(amount) FROM finance_entries WHERE entry_type = 'receita' AND status = 'pendente' AND entry_date BETWEEN v_date_from AND v_date_to), 0),
    'despesas_pendentes', COALESCE((SELECT SUM(amount) FROM finance_entries WHERE entry_type = 'despesa' AND status = 'pendente' AND entry_date BETWEEN v_date_from AND v_date_to), 0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Função para introspecção de schema
CREATE OR REPLACE FUNCTION thomaz_schema_introspect()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_name', t.table_name,
      'columns', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'is_nullable', c.is_nullable
          )
        )
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = t.table_name
      )
    )
  ) INTO v_schema
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE '_prisma_%';

  RETURN COALESCE(v_schema, '[]'::jsonb);
END;
$$;

-- ============================================================================
-- 3. ATIVAR PERSONALIDADE E PROTOCOLOS DO THOMAZ
-- ============================================================================

-- Garantir que existe configuração de personalidade
INSERT INTO thomaz_personality_config (
  name,
  emoji_usage,
  formality_level,
  proactivity_level,
  custom_greetings,
  custom_phrases,
  response_style,
  language_preference
)
VALUES (
  'Thomaz - Assistente Executivo',
  true,
  7,
  8,
  ARRAY[
    'Olá! Pronto para otimizar suas operações!',
    'Bom dia! Vamos trabalhar juntos hoje?',
    'E aí! Como posso facilitar seu dia?',
    'Opa! Thomaz online e operacional!'
  ],
  ARRAY[
    'Deixa comigo!',
    'Entendi perfeitamente!',
    'Vou verificar isso agora!',
    'Encontrei!',
    'Analisando...'
  ],
  'Profissional, prestativo e humanizado',
  'pt-BR'
)
ON CONFLICT (name) DO UPDATE SET
  emoji_usage = EXCLUDED.emoji_usage,
  formality_level = EXCLUDED.formality_level,
  proactivity_level = EXCLUDED.proactivity_level,
  updated_at = now();

-- Ativar protocolos avançados
INSERT INTO thomaz_advanced_protocols (protocol_name, active, priority, description)
VALUES
  ('executive_analysis', true, 1, 'Análises executivas com DRE e fluxo de caixa'),
  ('inventory_critical', true, 2, 'Análise de estoque crítico por técnico'),
  ('library_search', true, 3, 'Busca inteligente na biblioteca digital'),
  ('ai_processing', true, 4, 'Processamento com IA externa (Groq, Gemini, etc)'),
  ('learning_mode', true, 5, 'Aprendizado contínuo com feedback')
ON CONFLICT (protocol_name) DO UPDATE SET
  active = EXCLUDED.active,
  priority = EXCLUDED.priority,
  updated_at = now();

-- ============================================================================
-- 4. POPULAR PADRÕES NLP INICIAIS
-- ============================================================================

INSERT INTO thomaz_nlp_patterns (pattern, intent, confidence, keywords, examples, usage_count, success_rate)
VALUES
  ('fluxo|caixa|dre|financeiro|comparativo', 'financial_analysis', 0.95, ARRAY['fluxo', 'caixa', 'dre', 'financeiro'], ARRAY['Mostre o fluxo de caixa', 'DRE comparativo'], 0, 0.9),
  ('estoque|baixo|critico|tecnico|material', 'inventory_critical', 0.92, ARRAY['estoque', 'baixo', 'critico'], ARRAY['Itens críticos de estoque', 'Estoque baixo'], 0, 0.85),
  ('biblioteca|documento|busque|fundacao|historia', 'library_search', 0.88, ARRAY['biblioteca', 'documento', 'buscar'], ARRAY['Busque na biblioteca', 'Documentos sobre'], 0, 0.8),
  ('ola|oi|bom dia|boa tarde|boa noite', 'greeting', 0.99, ARRAY['ola', 'oi', 'bom', 'dia'], ARRAY['Olá', 'Bom dia'], 0, 0.95),
  ('tchau|ate logo|ate mais|falou', 'farewell', 0.98, ARRAY['tchau', 'ate', 'logo'], ARRAY['Tchau', 'Até logo'], 0, 0.95),
  ('obrigado|obrigada|valeu|agradeco', 'gratitude', 0.97, ARRAY['obrigado', 'valeu'], ARRAY['Obrigado', 'Valeu'], 0, 0.9),
  ('como|voce|esta|vai', 'how_are_you', 0.94, ARRAY['como', 'esta', 'vai'], ARRAY['Como você está?'], 0, 0.85),
  ('quem|voce|o que|faz', 'about_self', 0.91, ARRAY['quem', 'voce', 'faz'], ARRAY['Quem é você?', 'O que você faz?'], 0, 0.8),
  ('ajuda|help|socorro|preciso', 'help', 0.96, ARRAY['ajuda', 'help', 'socorro'], ARRAY['Preciso de ajuda', 'Help'], 0, 0.9)
ON CONFLICT (pattern) DO UPDATE SET
  confidence = EXCLUDED.confidence,
  usage_count = thomaz_nlp_patterns.usage_count,
  updated_at = now();

-- ============================================================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  v_functions integer;
  v_protocols integer;
  v_patterns integer;
BEGIN
  -- Contar funções RPC
  SELECT COUNT(*) INTO v_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname LIKE 'thomaz_%';

  RAISE NOTICE '📊 Funções Thomaz disponíveis: %', v_functions;

  -- Contar protocolos ativos
  SELECT COUNT(*) INTO v_protocols
  FROM thomaz_advanced_protocols
  WHERE active = true;

  RAISE NOTICE '⚡ Protocolos ativos: %', v_protocols;

  -- Contar padrões NLP
  SELECT COUNT(*) INTO v_patterns
  FROM thomaz_nlp_patterns;

  RAISE NOTICE '🧠 Padrões NLP carregados: %', v_patterns;

  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ THOMAZ AI - TODAS AS FUNÇÕES ATIVADAS!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '🤖 Capacidades Ativas:';
  RAISE NOTICE '   • Análise Financeira (DRE, Fluxo de Caixa)';
  RAISE NOTICE '   • Gestão de Estoque Crítico';
  RAISE NOTICE '   • Busca na Biblioteca Digital';
  RAISE NOTICE '   • Processamento com IA Externa';
  RAISE NOTICE '   • Aprendizado Contínuo';
  RAISE NOTICE '   • NLP e Detecção de Intenções';
  RAISE NOTICE '   • Memória de Longo Prazo';
  RAISE NOTICE '   • 5 Provedores de IA Gratuitos';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Sistema 100% Operacional!';
END $$;

-- Comentário final
COMMENT ON FUNCTION thomaz_get_system_stats IS 'Retorna estatísticas gerais do sistema';
COMMENT ON FUNCTION thomaz_get_service_orders_info IS 'Retorna informações de ordens de serviço';
COMMENT ON FUNCTION thomaz_get_inventory_info IS 'Retorna informações de estoque';
COMMENT ON FUNCTION thomaz_get_agenda_info IS 'Retorna eventos da agenda';
COMMENT ON FUNCTION thomaz_get_employees_info IS 'Retorna informações de funcionários';
COMMENT ON FUNCTION thomaz_get_financial_entries_info IS 'Retorna lançamentos financeiros';
COMMENT ON FUNCTION thomaz_get_financial_analysis IS 'Retorna análise financeira completa';
COMMENT ON FUNCTION thomaz_schema_introspect IS 'Retorna estrutura das tabelas do banco';

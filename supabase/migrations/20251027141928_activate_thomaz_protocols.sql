
/*
  # Ativar Protocolos Operacionais do Thomaz

  1. Função de Bootstrap
    - Carrega protocolos, ferramentas e regras ao iniciar
    - Retorna configuração completa para o agente
  
  2. Função de Execução
    - Processa requisições seguindo os 5 passos
    - Aplica mapeamentos PT↔EN automaticamente
    - Valida confiança e formata resposta
*/

-- Função de bootstrap: carrega todos os protocolos ativos
CREATE OR REPLACE FUNCTION thomaz_load_protocols()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  protocols jsonb;
  tools jsonb;
  rules jsonb;
  mappings jsonb;
  result jsonb;
BEGIN
  -- Carregar protocolos
  SELECT jsonb_agg(
    jsonb_build_object(
      'key', key_pattern,
      'content', learned_response,
      'confidence', confidence_score,
      'tags', context_tags
    )
  ) INTO protocols
  FROM thomaz_learning_data
  WHERE category = 'protocol'
    AND confidence_score >= 0.8;

  -- Carregar ferramentas
  SELECT jsonb_agg(
    jsonb_build_object(
      'key', key_pattern,
      'content', learned_response,
      'confidence', confidence_score,
      'tags', context_tags,
      'metadata', metadata
    )
  ) INTO tools
  FROM thomaz_learning_data
  WHERE category = 'tool'
    AND confidence_score >= 0.8;

  -- Carregar regras
  SELECT jsonb_agg(
    jsonb_build_object(
      'key', key_pattern,
      'content', learned_response,
      'confidence', confidence_score,
      'tags', context_tags
    )
  ) INTO rules
  FROM thomaz_learning_data
  WHERE category = 'rule'
    AND confidence_score >= 0.8;

  -- Carregar mapeamentos
  SELECT jsonb_agg(
    jsonb_build_object(
      'key', key_pattern,
      'content', learned_response,
      'confidence', confidence_score
    )
  ) INTO mappings
  FROM thomaz_learning_data
  WHERE category = 'mapping'
    AND confidence_score >= 0.5;

  -- Montar resultado
  result := jsonb_build_object(
    'protocols', COALESCE(protocols, '[]'::jsonb),
    'tools', COALESCE(tools, '[]'::jsonb),
    'rules', COALESCE(rules, '[]'::jsonb),
    'mappings', COALESCE(mappings, '[]'::jsonb),
    'loaded_at', NOW(),
    'status', 'active'
  );

  RETURN result;
END;
$$;

-- Função de resolução de nomes PT↔EN
CREATE OR REPLACE FUNCTION thomaz_resolve_table_name(
  input_name text,
  min_confidence numeric DEFAULT 0.5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mappings_content text;
  result jsonb;
  matched_tables text[];
  confidence numeric;
BEGIN
  -- Buscar mapeamento
  SELECT learned_response INTO mappings_content
  FROM thomaz_learning_data
  WHERE category = 'mapping'
    AND key_pattern = 'table_aliases_pten'
    AND confidence_score >= min_confidence
  LIMIT 1;

  IF mappings_content IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Mapeamento não encontrado',
      'confidence', 0
    );
  END IF;

  -- Extrair correspondências (simplificado - pode melhorar com regex)
  IF mappings_content ILIKE '%' || input_name || '%' THEN
    confidence := 0.85;
    
    -- Tentar alguns mapeamentos comuns
    matched_tables := CASE 
      WHEN input_name IN ('ordens_servico', 'os', 'work_orders') THEN ARRAY['service_orders']
      WHEN input_name IN ('clientes', 'clients') THEN ARRAY['customers']
      WHEN input_name IN ('funcionarios', 'staff') THEN ARRAY['employees']
      WHEN input_name IN ('materiais', 'items') THEN ARRAY['inventory_items', 'materials']
      WHEN input_name IN ('servicos', 'services') THEN ARRAY['service_catalog']
      WHEN input_name IN ('financeiro', 'financial') THEN ARRAY['finance_entries']
      WHEN input_name IN ('agenda', 'calendar', 'events') THEN ARRAY['agenda_events']
      WHEN input_name IN ('propostas', 'budgets') THEN ARRAY['proposals']
      WHEN input_name IN ('contratos') THEN ARRAY['contracts']
      WHEN input_name IN ('fornecedores', 'vendors') THEN ARRAY['suppliers']
      ELSE ARRAY[input_name] -- Fallback: usar o próprio nome
    END;
    
    result := jsonb_build_object(
      'success', true,
      'input', input_name,
      'matched_tables', matched_tables,
      'confidence', confidence,
      'action', CASE 
        WHEN confidence >= 0.8 THEN 'auto_use'
        WHEN confidence >= 0.5 THEN 'proceed_and_log'
        ELSE 'ask_confirmation'
      END
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'input', input_name,
      'matched_tables', ARRAY[]::text[],
      'confidence', 0,
      'action', 'ask_confirmation'
    );
  END IF;

  RETURN result;
END;
$$;

-- Função de execução: processa requisição seguindo protocolos
CREATE OR REPLACE FUNCTION thomaz_process_request(
  user_input text,
  context jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  protocols jsonb;
  execution_flow text;
  response_format text;
  result jsonb;
BEGIN
  -- Carregar protocolos
  protocols := thomaz_load_protocols();
  
  -- Extrair fluxo de execução
  SELECT learned_response INTO execution_flow
  FROM thomaz_learning_data
  WHERE category = 'protocol'
    AND key_pattern = 'execution_flow_5steps'
  LIMIT 1;
  
  -- Extrair formato de resposta
  SELECT learned_response INTO response_format
  FROM thomaz_learning_data
  WHERE category = 'protocol'
    AND key_pattern = 'response_format_7sections'
  LIMIT 1;
  
  -- Montar resultado com instruções
  result := jsonb_build_object(
    'status', 'ready',
    'user_input', user_input,
    'context', context,
    'protocols_loaded', protocols,
    'execution_flow', execution_flow,
    'response_format', response_format,
    'instructions', jsonb_build_object(
      'step1', 'Entenda a intenção (dados, cálculo, documento)',
      'step2', 'Resolva nomes de tabelas/colunas (PT↔EN)',
      'step3', 'Chame as ferramentas necessárias',
      'step4', 'Valide retorno (nulos/inconsistentes)',
      'step5', 'Responda em formato estruturado (7 seções)'
    )
  );
  
  RETURN result;
END;
$$;

-- Garantir acesso anônimo às funções do Thomaz
GRANT EXECUTE ON FUNCTION thomaz_load_protocols() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_resolve_table_name(text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_process_request(text, jsonb) TO anon, authenticated;

-- Comentários
COMMENT ON FUNCTION thomaz_load_protocols() IS 'Bootstrap do Thomaz: carrega todos os protocolos, ferramentas e regras ativas';
COMMENT ON FUNCTION thomaz_resolve_table_name(text, numeric) IS 'Resolve nomes de tabelas PT↔EN com níveis de confiança';
COMMENT ON FUNCTION thomaz_process_request(text, jsonb) IS 'Processa requisição do usuário seguindo os 5 passos do protocolo';

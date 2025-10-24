/*
  # Funções Inteligentes do Thomaz

  ## Funções Criadas
  
  1. **thomaz_search_knowledge** - Busca inteligente no grafo de conhecimento
  2. **thomaz_get_contextual_answer** - Gera resposta contextual baseada em dados reais
  3. **thomaz_analyze_business_health** - Análise de saúde do negócio
  4. **thomaz_predict_revenue** - Previsão de receita baseada em histórico
  5. **thomaz_recommend_actions** - Recomendações baseadas em dados
  
  ## Segurança
  - Todas as funções com SECURITY DEFINER
  - Acesso público para leitura
*/

-- =====================================================
-- FUNÇÃO 1: Busca Inteligente no Conhecimento
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_search_knowledge(
  search_query TEXT,
  limit_results INT DEFAULT 5
)
RETURNS TABLE (
  entity_name TEXT,
  entity_type TEXT,
  description TEXT,
  relevance_score NUMERIC,
  related_info JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kg.entity_name,
    kg.entity_type,
    kg.properties->>'descricao' as description,
    kg.confidence as relevance_score,
    jsonb_build_object(
      'keywords', kg.properties->'keywords',
      'como_usar', kg.properties->'como_usar',
      'passos', kg.properties->'passos',
      'dica', kg.properties->'dica'
    ) as related_info
  FROM thomaz_knowledge_graph kg
  WHERE 
    LOWER(kg.entity_name) LIKE '%' || LOWER(search_query) || '%'
    OR kg.properties->>'descricao' ILIKE '%' || search_query || '%'
    OR kg.properties->'keywords' @> to_jsonb(LOWER(search_query))
  ORDER BY kg.confidence DESC, kg.entity_name
  LIMIT limit_results;
END;
$$;

-- =====================================================
-- FUNÇÃO 2: Resposta Contextual com Dados Reais
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_get_contextual_answer(
  user_question TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  question_lower TEXT;
BEGIN
  question_lower := LOWER(user_question);
  
  -- Detectar tipo de pergunta e buscar dados reais
  
  -- Perguntas sobre lucro
  IF question_lower ~ '(quanto|qual).*(lucro|lucrei|ganhei|resultado)' THEN
    SELECT jsonb_build_object(
      'tipo', 'lucro_mensal',
      'resposta', 'Vou buscar seu lucro atual...',
      'dados', jsonb_build_object(
        'lucro_mes_atual', (
          SELECT COALESCE(SUM(valor), 0)
          FROM finance_entries
          WHERE tipo = 'receita' 
          AND status IN ('recebido', 'pago')
          AND DATE_TRUNC('month', data) = DATE_TRUNC('month', CURRENT_DATE)
        ) - (
          SELECT COALESCE(SUM(valor), 0)
          FROM finance_entries
          WHERE tipo = 'despesa'
          AND status = 'pago'
          AND DATE_TRUNC('month', data) = DATE_TRUNC('month', CURRENT_DATE)
        ),
        'periodo', TO_CHAR(CURRENT_DATE, 'Month/YYYY')
      )
    ) INTO result;
    
  -- Perguntas sobre OS
  ELSIF question_lower ~ '(quantas|quantos).*(os|ordem|serviço)' THEN
    SELECT jsonb_build_object(
      'tipo', 'contagem_os',
      'resposta', 'Consultando suas ordens de serviço...',
      'dados', jsonb_build_object(
        'total', (SELECT COUNT(*) FROM service_orders),
        'pendentes', (SELECT COUNT(*) FROM service_orders WHERE status = 'pending'),
        'em_andamento', (SELECT COUNT(*) FROM service_orders WHERE status = 'in_progress'),
        'completadas', (SELECT COUNT(*) FROM service_orders WHERE status = 'completed'),
        'mes_atual', (
          SELECT COUNT(*) 
          FROM service_orders 
          WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        )
      )
    ) INTO result;
    
  -- Perguntas sobre clientes
  ELSIF question_lower ~ '(quantos|quantas).*(cliente|customer)' THEN
    SELECT jsonb_build_object(
      'tipo', 'contagem_clientes',
      'resposta', 'Verificando seus clientes...',
      'dados', jsonb_build_object(
        'total', (SELECT COUNT(*) FROM customers),
        'pf', (SELECT COUNT(*) FROM customers WHERE tipo_pessoa = 'PF'),
        'pj', (SELECT COUNT(*) FROM customers WHERE tipo_pessoa = 'PJ'),
        'ativos_mes', (
          SELECT COUNT(DISTINCT customer_id)
          FROM service_orders
          WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        )
      )
    ) INTO result;
    
  -- Perguntas sobre top clientes
  ELSIF question_lower ~ '(melhor|maior|top).*(cliente|customer)' THEN
    SELECT jsonb_build_object(
      'tipo', 'top_clientes',
      'resposta', 'Aqui estão seus melhores clientes:',
      'dados', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'nome', customer_name,
            'total_pedidos', total_orders,
            'receita_total', total_revenue,
            'ticket_medio', avg_order_value
          )
        )
        FROM v_top_customers_by_revenue
        LIMIT 5
      )
    ) INTO result;
    
  -- Perguntas sobre estoque
  ELSIF question_lower ~ '(quanto|quantos).*(estoque|material|produto)' THEN
    SELECT jsonb_build_object(
      'tipo', 'info_estoque',
      'resposta', 'Informações do estoque:',
      'dados', jsonb_build_object(
        'total_itens', (SELECT COUNT(*) FROM materials),
        'valor_estoque', (SELECT COALESCE(SUM(quantity * unit_cost), 0) FROM materials),
        'itens_baixo_estoque', (
          SELECT COUNT(*) FROM materials WHERE quantity < 10
        )
      )
    ) INTO result;
    
  -- Resposta padrão: buscar no conhecimento
  ELSE
    SELECT jsonb_build_object(
      'tipo', 'busca_conhecimento',
      'resposta', 'Deixe-me buscar isso para você...',
      'conhecimento', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'titulo', entity_name,
            'descricao', properties->>'descricao',
            'como_usar', properties->>'como_usar'
          )
        )
        FROM thomaz_knowledge_graph
        WHERE 
          LOWER(entity_name) LIKE '%' || question_lower || '%'
          OR properties->>'descricao' ILIKE '%' || user_question || '%'
        LIMIT 3
      )
    ) INTO result;
  END IF;
  
  RETURN COALESCE(result, jsonb_build_object(
    'tipo', 'nao_entendi',
    'resposta', 'Desculpe, não entendi sua pergunta. Pode reformular?'
  ));
END;
$$;

-- =====================================================
-- FUNÇÃO 3: Análise de Saúde do Negócio
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_analyze_business_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resultado JSONB;
  receita_mes NUMERIC;
  despesa_mes NUMERIC;
  lucro_mes NUMERIC;
  margem NUMERIC;
  os_completadas INT;
  os_canceladas INT;
  taxa_conversao NUMERIC;
BEGIN
  -- Calcular métricas do mês atual
  SELECT 
    COALESCE(SUM(CASE WHEN tipo = 'receita' AND status IN ('recebido', 'pago') THEN valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo = 'despesa' AND status = 'pago' THEN valor ELSE 0 END), 0)
  INTO receita_mes, despesa_mes
  FROM finance_entries
  WHERE DATE_TRUNC('month', data) = DATE_TRUNC('month', CURRENT_DATE);
  
  lucro_mes := receita_mes - despesa_mes;
  margem := CASE WHEN receita_mes > 0 THEN (lucro_mes / receita_mes) * 100 ELSE 0 END;
  
  -- OSs do mês
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'cancelled')
  INTO os_completadas, os_canceladas
  FROM service_orders
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
  
  taxa_conversao := CASE 
    WHEN (os_completadas + os_canceladas) > 0 
    THEN (os_completadas::NUMERIC / (os_completadas + os_canceladas)) * 100 
    ELSE 0 
  END;
  
  -- Avaliar saúde
  resultado := jsonb_build_object(
    'saude_geral', CASE 
      WHEN margem >= 30 AND taxa_conversao >= 80 THEN 'Excelente'
      WHEN margem >= 20 AND taxa_conversao >= 70 THEN 'Boa'
      WHEN margem >= 10 AND taxa_conversao >= 60 THEN 'Regular'
      ELSE 'Precisa Atenção'
    END,
    'metricas', jsonb_build_object(
      'receita_mes', receita_mes,
      'despesa_mes', despesa_mes,
      'lucro_mes', lucro_mes,
      'margem_percentual', ROUND(margem, 2),
      'os_completadas', os_completadas,
      'taxa_conversao', ROUND(taxa_conversao, 2)
    ),
    'alertas', jsonb_build_array(
      CASE WHEN margem < 20 THEN 'Margem de lucro baixa - revisar custos e preços' ELSE NULL END,
      CASE WHEN taxa_conversao < 70 THEN 'Taxa de conversão baixa - verificar cancelamentos' ELSE NULL END,
      CASE WHEN lucro_mes < 0 THEN 'ALERTA: Prejuízo no mês atual!' ELSE NULL END
    ) - 'null'::jsonb,
    'recomendacoes', jsonb_build_array(
      CASE WHEN margem < 30 THEN 'Aumentar preços ou reduzir custos operacionais' ELSE NULL END,
      CASE WHEN os_completadas < 10 THEN 'Aumentar esforços comerciais para mais OSs' ELSE NULL END
    ) - 'null'::jsonb
  );
  
  RETURN resultado;
END;
$$;

-- =====================================================
-- FUNÇÃO 4: Previsão de Receita
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_predict_revenue()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  media_ultimos_3_meses NUMERIC;
  tendencia TEXT;
  previsao NUMERIC;
BEGIN
  -- Calcular média dos últimos 3 meses
  SELECT AVG(total_revenue)
  INTO media_ultimos_3_meses
  FROM v_monthly_financial_summary
  WHERE month >= CURRENT_DATE - INTERVAL '3 months'
  AND month < DATE_TRUNC('month', CURRENT_DATE);
  
  -- Detectar tendência
  WITH meses AS (
    SELECT 
      total_revenue,
      LAG(total_revenue) OVER (ORDER BY month) as mes_anterior
    FROM v_monthly_financial_summary
    WHERE month >= CURRENT_DATE - INTERVAL '2 months'
    AND month < DATE_TRUNC('month', CURRENT_DATE)
    ORDER BY month DESC
    LIMIT 1
  )
  SELECT 
    CASE 
      WHEN total_revenue > mes_anterior * 1.1 THEN 'Crescimento Forte'
      WHEN total_revenue > mes_anterior THEN 'Crescimento'
      WHEN total_revenue > mes_anterior * 0.9 THEN 'Estável'
      ELSE 'Queda'
    END
  INTO tendencia
  FROM meses;
  
  -- Previsão simples baseada na média
  previsao := media_ultimos_3_meses;
  
  RETURN jsonb_build_object(
    'previsao_proximo_mes', ROUND(previsao, 2),
    'media_ultimos_3_meses', ROUND(media_ultimos_3_meses, 2),
    'tendencia', tendencia,
    'confianca', 'Média',
    'base_calculo', 'Média móvel 3 meses'
  );
END;
$$;

-- =====================================================
-- Permissões
-- =====================================================

GRANT EXECUTE ON FUNCTION thomaz_search_knowledge TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_contextual_answer TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_analyze_business_health TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_predict_revenue TO anon, authenticated;

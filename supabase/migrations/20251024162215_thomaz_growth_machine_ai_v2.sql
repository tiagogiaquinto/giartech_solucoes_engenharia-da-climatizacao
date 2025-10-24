/*
  # Thomaz - Inteligência Artificial da Growth Machine V2

  ## Objetivo
  Transformar Thomaz na IA completa da Growth Machine com:
  - Conhecimento sobre Growth Machine
  - Análises de crescimento
  - Identificação de oportunidades
  - Insights de performance
  - Recomendações estratégicas
*/

-- =====================================================
-- 1. ATUALIZAR PERSONALIDADE GROWTH MACHINE
-- =====================================================

UPDATE thomaz_personality_config SET
  personality_type = 'growth_machine_ai',
  response_style = 'strategic_consultative',
  humor_level = 3,
  formality_level = 7,
  proactivity_level = 9,
  emoji_usage = true,
  custom_phrases = '[
    "Vamos impulsionar seu crescimento!",
    "Identifiquei uma oportunidade importante!",
    "Baseado nos dados, recomendo...",
    "Análise completa pronta!",
    "Vou otimizar isso para você!",
    "Encontrei insights valiosos!",
    "Estratégia recomendada:",
    "Pronto para maximizar resultados!",
    "Dados analisados com sucesso!",
    "Vamos acelerar seu negócio!"
  ]'::jsonb,
  custom_greetings = '[
    "Olá! Sou o Thomaz, a IA da Growth Machine. Como posso impulsionar seu negócio hoje?",
    "Bem-vindo! Pronto para analisar seus dados e encontrar oportunidades de crescimento?",
    "Oi! Vamos trabalhar juntos para maximizar seus resultados?",
    "Olá! Que tal começarmos com uma análise estratégica do seu negócio?",
    "Seja bem-vindo! Estou aqui para transformar dados em crescimento!"
  ]'::jsonb,
  tone_preferences = '{
    "missao": "Impulsionar crescimento através de dados e IA",
    "estilo": "Profissional, estratégico e orientado a resultados",
    "foco": "Crescimento, otimização e oportunidades"
  }'::jsonb,
  updated_at = NOW()
WHERE id = (SELECT id FROM thomaz_personality_config LIMIT 1);

-- Se não existir personalidade, criar
INSERT INTO thomaz_personality_config (
  personality_type,
  response_style,
  humor_level,
  formality_level,
  proactivity_level,
  emoji_usage,
  custom_phrases,
  custom_greetings,
  tone_preferences
)
SELECT 
  'growth_machine_ai',
  'strategic_consultative',
  3,
  7,
  9,
  true,
  '[
    "Vamos impulsionar seu crescimento!",
    "Identifiquei uma oportunidade!"
  ]'::jsonb,
  '[
    "Olá! Sou o Thomaz, a IA da Growth Machine!"
  ]'::jsonb,
  '{"missao": "Impulsionar crescimento"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM thomaz_personality_config LIMIT 1);

-- =====================================================
-- 2. CONHECIMENTO GROWTH MACHINE
-- =====================================================

INSERT INTO thomaz_knowledge_graph (
  entity_type, entity_name, properties, related_entities, confidence, source
) VALUES
(
  'empresa',
  'Growth Machine',
  '{
    "descricao": "Growth Machine é uma plataforma completa de gestão empresarial focada em crescimento. Combina OS, CRM, financeiro, estoque e IA em um único sistema.",
    "missao": "Impulsionar crescimento através de tecnologia e dados",
    "diferenciais": [
      "IA integrada que aprende",
      "Análises preditivas",
      "Automação inteligente",
      "Dashboard executivo em tempo real"
    ]
  }'::jsonb,
  '{}'::jsonb,
  1.0,
  'company_identity'
),
(
  'analise',
  'Taxa de Crescimento Mensal',
  '{
    "descricao": "Mede crescimento da receita mês a mês",
    "formula": "((Receita Atual - Receita Anterior) / Receita Anterior) × 100",
    "meta": "5-10% ao mês"
  }'::jsonb,
  '{}'::jsonb,
  0.95,
  'growth_analytics'
),
(
  'estrategia',
  'Otimização de Precificação',
  '{
    "descricao": "Maximizar lucratividade através de preços inteligentes",
    "quando_usar": "Margem < 30%",
    "acoes": [
      "Analisar custos reais",
      "Definir margem alvo 30%+",
      "Testar gradualmente"
    ]
  }'::jsonb,
  '{}'::jsonb,
  0.90,
  'business_strategy'
),
(
  'oportunidade',
  'Clientes Inativos',
  '{
    "descricao": "Clientes sem OSs há 3+ meses",
    "impacto": "Reativar 20% = +15-25% receita",
    "acao": "Campanha de reativação"
  }'::jsonb,
  '{}'::jsonb,
  0.85,
  'opportunity'
);

-- =====================================================
-- 3. ANÁLISE DE CRESCIMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_analyze_growth()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resultado JSONB;
  receita_atual NUMERIC;
  receita_anterior NUMERIC;
  taxa_crescimento NUMERIC;
  os_atual INTEGER;
  os_anterior INTEGER;
BEGIN
  -- Receitas
  SELECT COALESCE(SUM(valor), 0) INTO receita_atual
  FROM finance_entries
  WHERE tipo = 'receita' 
  AND DATE_TRUNC('month', data) = DATE_TRUNC('month', CURRENT_DATE);
  
  SELECT COALESCE(SUM(valor), 0) INTO receita_anterior
  FROM finance_entries
  WHERE tipo = 'receita'
  AND DATE_TRUNC('month', data) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  
  taxa_crescimento := CASE 
    WHEN receita_anterior > 0 
    THEN ((receita_atual - receita_anterior) / receita_anterior) * 100
    ELSE 0 
  END;
  
  -- OSs
  SELECT COUNT(*) INTO os_atual
  FROM service_orders
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
  
  SELECT COUNT(*) INTO os_anterior
  FROM service_orders
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  
  resultado := jsonb_build_object(
    'tipo', 'analise_crescimento',
    'metricas', jsonb_build_object(
      'receita_atual', ROUND(receita_atual, 2),
      'receita_anterior', ROUND(receita_anterior, 2),
      'taxa_crescimento', ROUND(taxa_crescimento, 2),
      'os_atual', os_atual,
      'os_anterior', os_anterior
    ),
    'avaliacao', CASE
      WHEN taxa_crescimento >= 10 THEN 'Crescimento Acelerado 🚀'
      WHEN taxa_crescimento >= 5 THEN 'Crescimento Saudável 📈'
      WHEN taxa_crescimento >= 0 THEN 'Crescimento Lento ⚠️'
      ELSE 'Retração 🚨'
    END,
    'recomendacoes', CASE
      WHEN taxa_crescimento < 5 THEN '["Intensificar ações comerciais", "Reativar clientes inativos"]'::jsonb
      ELSE '["Manter estratégia atual", "Documentar boas práticas"]'::jsonb
    END
  );
  
  RETURN resultado;
END;
$$;

-- =====================================================
-- 4. IDENTIFICAR OPORTUNIDADES
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_identify_opportunities()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oportunidades JSONB := '[]';
  clientes_inativos INTEGER;
  produtos_alta_margem INTEGER;
BEGIN
  -- Clientes Inativos
  SELECT COUNT(DISTINCT id) INTO clientes_inativos
  FROM customers
  WHERE id NOT IN (
    SELECT DISTINCT customer_id 
    FROM service_orders 
    WHERE created_at >= CURRENT_DATE - INTERVAL '3 months'
  );
  
  IF clientes_inativos > 0 THEN
    oportunidades := oportunidades || jsonb_build_object(
      'tipo', 'reativacao',
      'prioridade', 'alta',
      'titulo', 'Clientes Inativos',
      'descricao', format('%s clientes sem OSs há 3+ meses', clientes_inativos),
      'impacto', 'Reativar 20% = +15-25% receita',
      'acao', 'Criar campanha',
      'icone', '👥'
    );
  END IF;
  
  -- Produtos Alta Margem
  SELECT COUNT(*) INTO produtos_alta_margem
  FROM materials
  WHERE (sale_price - unit_cost) / NULLIF(sale_price, 0) > 0.5;
  
  IF produtos_alta_margem > 0 THEN
    oportunidades := oportunidades || jsonb_build_object(
      'tipo', 'produtos',
      'prioridade', 'media',
      'titulo', 'Produtos Alta Margem',
      'descricao', format('%s produtos com margem >50%%', produtos_alta_margem),
      'impacto', '+30% lucro potencial',
      'acao', 'Destacar em propostas',
      'icone', '💎'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'oportunidades', oportunidades,
    'total', jsonb_array_length(oportunidades),
    'timestamp', NOW()
  );
END;
$$;

-- =====================================================
-- 5. INSIGHTS DE PERFORMANCE
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_performance_insights()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  insights JSONB := '[]';
  taxa_conversao NUMERIC;
  margem_media NUMERIC;
BEGIN
  -- Taxa de Conversão
  SELECT 
    (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100
  INTO taxa_conversao
  FROM service_orders;
  
  insights := insights || jsonb_build_object(
    'metrica', 'Taxa de Conversão',
    'valor', ROUND(taxa_conversao, 1) || '%',
    'status', CASE
      WHEN taxa_conversao >= 80 THEN 'excelente'
      WHEN taxa_conversao >= 70 THEN 'bom'
      ELSE 'precisa_melhorar'
    END,
    'benchmark', '80%+'
  );
  
  -- Margem Média
  SELECT AVG(
    CASE WHEN total_value > 0 
    THEN ((total_value - COALESCE(total_cost, 0)) / total_value) * 100
    ELSE 0 END
  ) INTO margem_media
  FROM service_orders
  WHERE status = 'completed';
  
  insights := insights || jsonb_build_object(
    'metrica', 'Margem Média',
    'valor', ROUND(margem_media, 1) || '%',
    'status', CASE
      WHEN margem_media >= 40 THEN 'excelente'
      WHEN margem_media >= 30 THEN 'bom'
      ELSE 'precisa_melhorar'
    END,
    'benchmark', '30-40%'
  );
  
  RETURN jsonb_build_object(
    'insights', insights,
    'timestamp', NOW()
  );
END;
$$;

-- =====================================================
-- 6. IA PRINCIPAL GROWTH MACHINE
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_growth_machine_ai(
  user_query TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query_lower TEXT;
  response JSONB;
BEGIN
  query_lower := LOWER(user_query);
  
  CASE
    WHEN query_lower ~ '(crescimento|evolu[çc][ãa]o)' THEN
      response := thomaz_analyze_growth();
    
    WHEN query_lower ~ '(oportunidade|onde crescer)' THEN
      response := thomaz_identify_opportunities();
    
    WHEN query_lower ~ '(performance|efici[êe]ncia)' THEN
      response := thomaz_performance_insights();
    
    WHEN query_lower ~ '(an[aá]lise completa|overview)' THEN
      response := jsonb_build_object(
        'tipo', 'analise_completa',
        'resposta', '🎯 Análise Growth Machine',
        'crescimento', thomaz_analyze_growth(),
        'oportunidades', thomaz_identify_opportunities(),
        'performance', thomaz_performance_insights()
      );
    
    ELSE
      response := thomaz_get_contextual_answer(user_query);
  END CASE;
  
  RETURN response;
END;
$$;

-- =====================================================
-- Permissões
-- =====================================================

GRANT EXECUTE ON FUNCTION thomaz_analyze_growth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_identify_opportunities TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_performance_insights TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_growth_machine_ai TO anon, authenticated;

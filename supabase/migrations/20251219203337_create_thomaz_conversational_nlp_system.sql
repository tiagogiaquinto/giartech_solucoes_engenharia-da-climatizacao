/*
  # Sistema Conversacional e NLP do Thomaz AI
  
  Adiciona capacidades avançadas de processamento de linguagem natural
  e conversação inteligente, usando a estrutura existente
*/

-- =====================================================
-- 1. BASE DE CONHECIMENTO EMPRESARIAL
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_business_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  topic text NOT NULL,
  content text NOT NULL,
  keywords text[] DEFAULT '{}',
  related_topics text[] DEFAULT '{}',
  examples jsonb DEFAULT '[]',
  context_required boolean DEFAULT false,
  confidence_level numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_thomaz_knowledge_category 
  ON thomaz_business_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_thomaz_knowledge_keywords 
  ON thomaz_business_knowledge USING gin(keywords);

ALTER TABLE thomaz_business_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to business knowledge"
  ON thomaz_business_knowledge FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. PADRÕES DE CONVERSAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_conversation_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type text NOT NULL,
  user_input_pattern text NOT NULL,
  intent text NOT NULL,
  entities_to_extract text[] DEFAULT '{}',
  required_context text[] DEFAULT '{}',
  response_template text,
  follow_up_questions jsonb DEFAULT '[]',
  priority integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_thomaz_patterns_intent 
  ON thomaz_conversation_patterns(intent);

ALTER TABLE thomaz_conversation_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to conversation patterns"
  ON thomaz_conversation_patterns FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. RESPOSTAS CONVERSACIONAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_conversational_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent text NOT NULL,
  response_variations text[] NOT NULL,
  tone text DEFAULT 'professional',
  context_required jsonb DEFAULT '{}',
  follow_up_suggestions jsonb DEFAULT '[]',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_thomaz_responses_intent 
  ON thomaz_conversational_responses(intent);

ALTER TABLE thomaz_conversational_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to conversational responses"
  ON thomaz_conversational_responses FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. FUNÇÃO: ANALISAR SENTIMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_analyze_sentiment(text_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  positive_count integer := 0;
  negative_count integer := 0;
  lower_text text;
BEGIN
  lower_text := lower(text_input);
  
  positive_count := (
    SELECT COUNT(*)
    FROM unnest(ARRAY[
      'bom', 'ótimo', 'excelente', 'perfeito', 'maravilhoso', 'legal',
      'adorei', 'gostei', 'feliz', 'satisfeito', 'obrigado', 'parabéns',
      'show', 'top', 'massa', 'bacana', 'incrível', 'fantástico',
      'muito bom', 'demais', 'sensacional', 'amei'
    ]) AS word
    WHERE lower_text LIKE '%' || word || '%'
  );
  
  negative_count := (
    SELECT COUNT(*)
    FROM unnest(ARRAY[
      'ruim', 'péssimo', 'horrível', 'terrível', 'problema', 'erro',
      'bug', 'falha', 'não funciona', 'travou', 'lento', 'difícil',
      'complicado', 'confuso', 'chato', 'irritante', 'frustrante',
      'não entendi', 'não consigo', 'quebrado', 'bugado'
    ]) AS word
    WHERE lower_text LIKE '%' || word || '%'
  );
  
  result := jsonb_build_object(
    'sentiment', CASE
      WHEN positive_count > negative_count THEN 'positive'
      WHEN negative_count > positive_count THEN 'negative'
      ELSE 'neutral'
    END,
    'positive_score', positive_count,
    'negative_score', negative_count,
    'confidence', CASE
      WHEN positive_count + negative_count = 0 THEN 0.5
      ELSE GREATEST(positive_count, negative_count)::numeric / (positive_count + negative_count)
    END
  );
  
  RETURN result;
END;
$$;

-- =====================================================
-- 5. FUNÇÃO: EXTRAIR ENTIDADES
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_extract_entities(text_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  entities jsonb := '[]'::jsonb;
  lower_text text;
BEGIN
  lower_text := lower(text_input);
  
  IF lower_text ~ 'r\$\s*[0-9.,]+' OR lower_text ~ '[0-9.,]+\s*(reais|real)' THEN
    entities := entities || jsonb_build_object(
      'type', 'money',
      'mentioned', true
    )::jsonb;
  END IF;
  
  IF lower_text ~ '[0-9]{1,2}/[0-9]{1,2}/[0-9]{2,4}' THEN
    entities := entities || jsonb_build_object(
      'type', 'date',
      'mentioned', true
    )::jsonb;
  END IF;
  
  IF lower_text ~ 'cliente|consumidor|comprador' THEN
    entities := entities || jsonb_build_object(
      'type', 'customer',
      'mentioned', true
    )::jsonb;
  END IF;
  
  IF lower_text ~ 'produto|item|estoque|material' THEN
    entities := entities || jsonb_build_object(
      'type', 'product',
      'mentioned', true
    )::jsonb;
  END IF;
  
  IF lower_text ~ '\bos\b|ordem|serviço|servico|atendimento' THEN
    entities := entities || jsonb_build_object(
      'type', 'service_order',
      'mentioned', true
    )::jsonb;
  END IF;
  
  result := jsonb_build_object(
    'entities', entities,
    'count', jsonb_array_length(entities)
  );
  
  RETURN result;
END;
$$;

-- =====================================================
-- 6. FUNÇÃO: DETECTAR INTENÇÃO AVANÇADA
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_detect_intent_advanced(
  text_input text, 
  context_data jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  lower_text text;
  intent text := 'conversation';
  confidence numeric := 0.7;
  requires_clarification boolean := false;
  suggested_questions jsonb := '[]'::jsonb;
  tone text := 'professional';
  conversational_depth text := 'deep';
BEGIN
  lower_text := lower(text_input);
  
  -- Saudações
  IF lower_text ~ '^(oi|olá|ola|hey|e ai|eai|bom dia|boa tarde|boa noite|opa|fala)' THEN
    intent := 'greeting';
    confidence := 0.95;
    tone := 'friendly';
    conversational_depth := 'light';
    
  -- Agradecimentos
  ELSIF lower_text ~ 'obrigad|valeu|agradeço|thanks|vlw' THEN
    intent := 'thanks';
    confidence := 0.95;
    tone := 'warm';
    conversational_depth := 'light';
    
  -- Despedidas
  ELSIF lower_text ~ '^(tchau|até|adeus|falou|abraço|bye|flw)' THEN
    intent := 'goodbye';
    confidence := 0.95;
    tone := 'friendly';
    conversational_depth := 'light';
    
  -- Perguntas sobre capacidades
  ELSIF lower_text ~ 'como (você |voce )?funciona|o que (você |voce )?faz|suas capacidades|o que (você |voce )?sabe' THEN
    intent := 'system_capabilities';
    confidence := 0.9;
    conversational_depth := 'medium';
    
  -- Ajuda
  ELSIF lower_text ~ '^(ajuda|help|socorro|não (sei|entendo)|como (faço|fazer)|me ajuda)' THEN
    intent := 'help_request';
    confidence := 0.9;
    tone := 'supportive';
    suggested_questions := jsonb_build_array(
      'Sobre qual área você precisa de ajuda?',
      'Está com dúvida em algo específico ou quer uma visão geral?'
    );
    requires_clarification := true;
    
  -- Consultas sobre estoque
  ELSIF lower_text ~ 'estoque|inventario|inventário|produto|material|repor|comprar|quanto (tem|tenho)|acabando' THEN
    intent := 'inventory_query';
    confidence := 0.85;
    conversational_depth := 'deep';
    
  -- Consultas financeiras
  ELSIF lower_text ~ 'financeiro|financeira|receita|despesa|pagamento|dinheiro|saldo|faturamento|lucro|prejuízo|quanto (entrou|saiu|gastei|ganhei)' THEN
    intent := 'financial_query';
    confidence := 0.85;
    conversational_depth := 'deep';
    
  -- Consultas sobre OS
  ELSIF lower_text ~ '\bos\b|ordem|serviço|servico|atendimento|técnico|tecnico|pendente|andamento' THEN
    intent := 'service_order_query';
    confidence := 0.85;
    conversational_depth := 'deep';
    
  -- Consultas sobre clientes
  ELSIF lower_text ~ 'cliente|consumidor|comprador|customer|quem comprou|quem (está|esta) comprando' THEN
    intent := 'customer_query';
    confidence := 0.85;
    conversational_depth := 'deep';
    
  -- Problemas/Issues
  ELSIF lower_text ~ 'problema|erro|bug|não (funciona|está|esta) funcionando|travou|quebrou|parou' THEN
    intent := 'issue_report';
    confidence := 0.9;
    tone := 'empathetic';
    suggested_questions := jsonb_build_array(
      'Pode me contar mais sobre o que está acontecendo?',
      'Em que parte do sistema isso está ocorrendo?'
    );
    requires_clarification := true;
    
  -- Perguntas abertas / Conversação
  ELSIF lower_text ~ '^(como|qual|quanto|quantos|onde|quando|por que|porque|o que)' THEN
    intent := 'open_question';
    confidence := 0.75;
    conversational_depth := 'deep';
    
  -- Expressões de dúvida
  ELSIF lower_text ~ 'não sei|dúvida|duvida|será que|acha que|será|talvez' THEN
    intent := 'uncertainty';
    confidence := 0.8;
    tone := 'supportive';
    conversational_depth := 'medium';
  END IF;
  
  result := jsonb_build_object(
    'intent', intent,
    'confidence', confidence,
    'requires_clarification', requires_clarification,
    'suggested_questions', suggested_questions,
    'tone', tone,
    'conversational_depth', conversational_depth,
    'entities', thomaz_extract_entities(text_input),
    'sentiment', thomaz_analyze_sentiment(text_input)
  );
  
  RETURN result;
END;
$$;

-- =====================================================
-- 7. POPULAR BASE DE CONHECIMENTO
-- =====================================================

INSERT INTO thomaz_business_knowledge (category, topic, content, keywords, examples) VALUES

-- Conversação
('conversacao', 'cumprimentos', 
 'Responder de forma natural e amigável, estabelecendo rapport', 
 ARRAY['olá', 'oi', 'hey', 'bom dia', 'boa tarde', 'boa noite'],
 '["Olá! 👋 Como posso ajudar você hoje?", "Oi! Estou aqui para facilitar sua gestão. O que você precisa saber?", "E aí! Vamos ver como seu negócio está indo?"]'::jsonb),

('conversacao', 'despedidas',
 'Finalizar de forma cordial e convidativa para retorno',
 ARRAY['tchau', 'até logo', 'adeus', 'bye'],
 '["Até logo! Estarei aqui sempre que precisar! 👋", "Tchau! Foi ótimo ajudar você hoje!", "Falou! Qualquer coisa, pode me chamar!"]'::jsonb),

('conversacao', 'agradecimentos',
 'Responder com naturalidade e oferecer ajuda adicional',
 ARRAY['obrigado', 'valeu', 'obrigada'],
 '["Por nada! 😊 Fico feliz em ajudar!", "Disponha! Estou aqui para isso!", "Que isso! Se precisar de mais algo, é só falar!"]'::jsonb),

-- Gestão Empresarial
('empresarial', 'analise_estoque',
 'Análise detalhada de estoque incluindo itens críticos, zerados e recomendações de reposição. Foco em ação imediata.',
 ARRAY['estoque', 'inventário', 'materiais', 'produtos', 'reposição'],
 '["Vejo que você tem alguns itens críticos no estoque. Quer que eu liste quais precisam de reposição urgente?", "Seu estoque está com X itens zerados. Posso gerar uma lista de compras para você?"]'::jsonb),

('empresarial', 'analise_financeira',
 'Análise de fluxo de caixa, receitas, despesas e indicadores financeiros. Interpretar números e sugerir ações.',
 ARRAY['financeiro', 'receitas', 'despesas', 'fluxo de caixa', 'saldo'],
 '["Sua margem está em X%. Isso está acima/abaixo do ideal para seu segmento. Quer dicas para melhorar?", "Você tem R$ X em contas a receber. Quer que eu liste os pagamentos mais urgentes?"]'::jsonb),

('empresarial', 'gestao_os',
 'Análise de ordens de serviço, performance operacional e gargalos. Identificar problemas e oportunidades.',
 ARRAY['ordem de serviço', 'os', 'atendimento', 'técnicos'],
 '["Sua taxa de conclusão está em X%. Vamos ver onde podemos melhorar?", "Você tem X OS pendentes. Quer que eu te ajude a priorizá-las?"]'::jsonb),

('empresarial', 'relacionamento_clientes',
 'Análise de base de clientes, comportamento de compra e oportunidades de fidelização.',
 ARRAY['clientes', 'consumidores', 'compradores', 'base'],
 '["Identifiquei X clientes que não compram há mais de 90 dias. Quer criar uma campanha de reativação?", "Seus top 10 clientes representam X% do faturamento. Vamos ver quem são?"]'::jsonb),

-- Indicadores e Métricas
('empresarial', 'kpis_essenciais',
 'KPIs críticos para monitoramento: ticket médio, margem, taxa de conclusão, inadimplência.',
 ARRAY['kpi', 'indicadores', 'métricas', 'performance'],
 '["Os 4 indicadores que você deve acompanhar diariamente são: faturamento, margem, ticket médio e taxa de conclusão", "Seu ticket médio está em R$ X. A média do mercado é R$ Y"]'::jsonb),

-- Boas Práticas
('empresarial', 'melhores_praticas',
 'Dicas práticas de gestão, automação e otimização de processos.',
 ARRAY['dicas', 'boas práticas', 'melhoria', 'otimização'],
 '["Dica: revise seu estoque semanalmente para evitar rupturas", "Automatize lembretes de cobrança para melhorar seu fluxo de caixa"]'::jsonb);

-- =====================================================
-- 8. POPULAR PADRÕES DE CONVERSAÇÃO
-- =====================================================

INSERT INTO thomaz_conversation_patterns (
  pattern_type, user_input_pattern, intent, response_template, follow_up_questions
) VALUES

('greeting', '^(oi|olá|hey)', 'greeting', 
 'Olá! 👋 Sou o Thomaz, seu assistente inteligente de gestão. Como posso ajudar você hoje?',
 '["Quer um resumo do seu negócio?", "Precisa saber algo específico sobre estoque, financeiro ou ordens de serviço?"]'::jsonb),

('help', '(ajuda|help|não entendo)', 'help_request',
 'Claro! Estou aqui para ajudar. Posso te auxiliar com várias coisas:\n\n📦 Análise de Estoque e Reposição\n💰 Controle Financeiro e Fluxo de Caixa\n🔧 Gestão de Ordens de Serviço\n👥 Análise de Clientes\n📊 Relatórios e Insights\n\nSobre qual dessas áreas você precisa de ajuda?',
 '[]'::jsonb),

('capabilities', '(o que você faz|suas capacidades)', 'system_capabilities',
 'Sou seu assistente inteligente! Posso te ajudar com:\n\n✅ Analisar dados do seu negócio em tempo real\n✅ Identificar problemas e oportunidades\n✅ Responder perguntas sobre estoque, financeiro, OS e clientes\n✅ Gerar relatórios detalhados\n✅ Dar recomendações práticas e acionáveis\n✅ Conversar naturalmente sobre sua empresa\n\nÉ só perguntar! Quanto mais você conversa comigo, melhor eu te entendo.',
 '["Quer ver como seu negócio está indo agora?"]'::jsonb);

-- =====================================================
-- 9. POPULAR RESPOSTAS CONVERSACIONAIS
-- =====================================================

INSERT INTO thomaz_conversational_responses (intent, response_variations, tone, follow_up_suggestions) VALUES

('greeting', ARRAY[
  'Olá! 👋 Como posso ajudar você hoje?',
  'Oi! Estou aqui para facilitar sua gestão. O que você precisa?',
  'E aí! Vamos ver como está seu negócio?',
  'Hey! Pronto para analisar alguns dados?'
], 'friendly', '["Ver resumo do negócio", "Analisar área específica"]'::jsonb),

('thanks', ARRAY[
  'Por nada! 😊 Fico feliz em ajudar!',
  'Disponha! Estou aqui para isso!',
  'Que isso! Se precisar de mais algo, é só falar!',
  'Sempre às ordens! Pode contar comigo!'
], 'warm', '[]'::jsonb),

('goodbye', ARRAY[
  'Até logo! Estarei aqui sempre que precisar! 👋',
  'Tchau! Foi ótimo ajudar você!',
  'Falou! Qualquer coisa, pode me chamar!',
  'Até mais! Bom trabalho!'
], 'friendly', '[]'::jsonb);

-- =====================================================
-- 10. GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION thomaz_analyze_sentiment(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION thomaz_extract_entities(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION thomaz_detect_intent_advanced(text, jsonb) TO authenticated, anon;

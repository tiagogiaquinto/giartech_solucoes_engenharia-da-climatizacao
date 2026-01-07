/*
  # Arquitetura Cognitiva do Thomaz - 3 Modos por Intenção
  
  1. Sistema de Modos
    - Modo CFO (Financeiro)
    - Modo Engenheiro (Técnico de Climatização)
    - Modo Estratégico (Conselheiro)
  
  2. Detecção Automática de Intenção
  3. Orquestrador Cognitivo
  4. A conversa guia o banco, não o contrário
*/

-- TABELA: Modos Cognitivos do Thomaz
CREATE TABLE IF NOT EXISTS thomaz_cognitive_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_code text UNIQUE NOT NULL,
  mode_name text NOT NULL,
  description text,
  personality jsonb NOT NULL,
  capabilities text[],
  trigger_keywords text[],
  trigger_patterns text[],
  priority integer DEFAULT 5,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- TABELA: Detecção de Intenção
CREATE TABLE IF NOT EXISTS thomaz_intent_detection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name text NOT NULL,
  mode_code text,
  keywords text[],
  patterns text[],
  examples text[],
  confidence_threshold numeric(3,2) DEFAULT 0.70,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- TABELA: Templates de Reasoning Chains
CREATE TABLE IF NOT EXISTS thomaz_reasoning_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  mode_code text,
  steps jsonb NOT NULL,
  data_requirements text[],
  output_template text,
  examples jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- TABELA: Contexto de Conversação por Modo
CREATE TABLE IF NOT EXISTS thomaz_conversation_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid UNIQUE NOT NULL,
  mode_code text,
  detected_intent text,
  confidence_score numeric(3,2),
  business_context jsonb,
  conversation_history jsonb[],
  active_reasoning_chain text,
  transition_from text,
  transition_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- LIMPAR dados existentes se houver
DELETE FROM thomaz_cognitive_modes;
DELETE FROM thomaz_intent_detection;
DELETE FROM thomaz_reasoning_templates;
DELETE FROM thomaz_conversation_context;

-- INSERIR OS 3 MODOS COGNITIVOS

-- MODO 1: CFO (Financeiro)
INSERT INTO thomaz_cognitive_modes (
  mode_code, mode_name, description, personality, capabilities, trigger_keywords, trigger_patterns, priority
) VALUES (
  'CFO',
  'Chief Financial Officer',
  'Analista financeiro experiente que fala direto e analisa números com contexto empresarial',
  jsonb_build_object(
    'tone', 'professional_analytical',
    'speaking_style', 'direct_honest',
    'use_technical_terms', true,
    'personality_traits', ARRAY['analytical', 'pragmatic', 'honest', 'forward_thinking'],
    'typical_phrases', ARRAY[
      'Financeiramente falando...',
      'Os números mostram que...',
      'O risco aqui é...',
      'Se você continuar nesse ritmo...',
      'Deixa eu ser direto:'
    ]
  ),
  ARRAY[
    'Análise de KPIs financeiros',
    'Projeção de fluxo de caixa',
    'Análise de margem e lucratividade',
    'Detecção de risco financeiro',
    'Recomendações de crescimento financeiro',
    'Análise de investimento vs retorno'
  ],
  ARRAY[
    'caixa', 'fluxo de caixa', 'margem', 'lucro', 'lucratividade',
    'receita', 'despesa', 'custo', 'faturamento',
    'contas a pagar', 'contas a receber', 'vencimento',
    'risco', 'crescimento', 'investimento', 'capital',
    'DRE', 'balanço', 'inadimplência', 'liquidez',
    'ROI', 'payback', 'break even', 'ponto de equilíbrio',
    'dinheiro', 'financeiro', 'saldo', 'pagar', 'receber'
  ],
  ARRAY[
    '(?i)(como|qual|está)(.*)(financeiro|caixa|margem|lucro)',
    '(?i)(precis|dev|quero)(.*)(crescer|investir|expandir)',
    '(?i)(contas|valores|dinheiro)(.*)(pagar|receber|vencido)',
    '(?i)(risco|perigo|problema)(.*)(financeiro|caixa)'
  ],
  10
);

-- MODO 2: Engenheiro de Climatização
INSERT INTO thomaz_cognitive_modes (
  mode_code, mode_name, description, personality, capabilities, trigger_keywords, trigger_patterns, priority
) VALUES (
  'ENGINEER',
  'Engenheiro de Climatização',
  'Engenheiro experiente que conecta técnica com custo e traduz complexidade para gestão',
  jsonb_build_object(
    'tone', 'technical_practical',
    'speaking_style', 'experienced_consultant',
    'use_technical_terms', true,
    'personality_traits', ARRAY['practical', 'experienced', 'cost_aware', 'solution_oriented'],
    'typical_phrases', ARRAY[
      'Tecnicamente é viável, mas...',
      'Na prática, o que acontece é...',
      'Isso vai te custar mais em...',
      'Já vi isso dar errado quando...',
      'O ideal seria..., mas se o orçamento está apertado...'
    ]
  ),
  ARRAY[
    'Análise técnica de equipamentos',
    'Dimensionamento de carga térmica',
    'Avaliação de custo técnico',
    'Recomendação de solução',
    'PMOC e manutenção preventiva',
    'Diagnóstico de falhas',
    'Retrofit e modernização'
  ],
  ARRAY[
    'VRF', 'VRV', 'split', 'multisplit', 'cassete', 'piso teto', 'dutado',
    'carga térmica', 'BTU', 'TR', 'capacidade',
    'PMOC', 'manutenção', 'preventiva', 'corretiva',
    'falha', 'defeito', 'vazamento', 'retorno', 'problema técnico',
    'instalação', 'obra', 'retrofit', 'layout',
    'compressor', 'evaporadora', 'condensadora', 'gás', 'pressão',
    'Carrier', 'Daikin', 'Midea', 'Gree', 'LG', 'Samsung', 'Hitachi',
    'eficiência energética', 'consumo', 'inverter', 'on-off',
    'ar condicionado', 'climatização', 'equipamento', 'aparelho'
  ],
  ARRAY[
    '(?i)(equipamento|aparelho|ar condicionado|climatização)',
    '(?i)(VRF|VRV|split|cassete|duto)',
    '(?i)(carga térmica|BTU|dimensionar|capacidade)',
    '(?i)(PMOC|manutenção|preventiva|corretiva)',
    '(?i)(falha|defeito|problema)(.*)(técnico|equipamento)',
    '(?i)(instalação|obra|retrofit|projeto)'
  ],
  9
);

-- MODO 3: Conselheiro Estratégico
INSERT INTO thomaz_cognitive_modes (
  mode_code, mode_name, description, personality, capabilities, trigger_keywords, trigger_patterns, priority
) VALUES (
  'STRATEGIC',
  'Conselheiro Estratégico',
  'Mentor empresarial que provoca reflexão, organiza pensamento e ajuda em decisões complexas',
  jsonb_build_object(
    'tone', 'thoughtful_provocative',
    'speaking_style', 'mentor_coach',
    'use_technical_terms', false,
    'personality_traits', ARRAY['thoughtful', 'questioning', 'strategic', 'patient'],
    'typical_phrases', ARRAY[
      'Antes disso, deixa eu te perguntar...',
      'Você já parou pra pensar que...',
      'O que realmente está te travando é...',
      'Se a gente olhar de outro ângulo...',
      'Vamos organizar isso:'
    ]
  ),
  ARRAY[
    'Organização de pensamento',
    'Priorização de decisões',
    'Análise de trade-offs',
    'Identificação de gargalos',
    'Planejamento estratégico',
    'Mentoria em crescimento',
    'Resolução de dilemas'
  ],
  ARRAY[
    'decisão', 'decidir', 'dúvida', 'dilema',
    'crescimento', 'crescer', 'expandir', 'escalar',
    'prioridade', 'priorizar', 'urgente', 'importante',
    'contratar', 'demitir', 'time', 'equipe',
    'estrutura', 'organização', 'processo',
    'estratégia', 'planejamento', 'futuro',
    'gargalo', 'trava', 'impedindo', 'dificuldade',
    'não sei', 'confuso', 'perdido', 'ajuda'
  ],
  ARRAY[
    '(?i)(devo|deveria|preciso)(.*)(decidir|escolher|fazer)',
    '(?i)(dúvida|duvida|dilema|incerto)',
    '(?i)(crescer|expandir|escalar)(.*)(empresa|negócio)',
    '(?i)(priorizar|urgente|importante)',
    '(?i)(contratar|demitir|time|equipe)',
    '(?i)(como|qual)(.*)(estratégia|caminho|direção)',
    '(?i)(não sei|confuso|perdido|ajuda)'
  ],
  8
);

-- INSERIR INTENÇÕES DETALHADAS

-- Intenções CFO
INSERT INTO thomaz_intent_detection (intent_name, mode_code, keywords, patterns, examples, confidence_threshold) VALUES
('financial_health', 'CFO', 
  ARRAY['saúde financeira', 'como está', 'situação', 'score', 'desempenho'],
  ARRAY['(?i)como (está|ta)(.*)(financeiro|saúde|situação)', '(?i)qual(.*)(score|desempenho)'],
  ARRAY['Como está minha saúde financeira?', 'Qual o score do negócio?', 'Situação financeira atual'],
  0.75),
  
('cash_flow_analysis', 'CFO',
  ARRAY['fluxo de caixa', 'caixa', 'saldo', 'projeção', 'dinheiro'],
  ARRAY['(?i)(fluxo|projeção)(.*)(caixa)', '(?i)(quanto|qual)(.*)(saldo|caixa|dinheiro)'],
  ARRAY['Projeção de caixa próximos 30 dias', 'Quanto tenho de saldo?', 'Fluxo de caixa mês que vem'],
  0.80),
  
('margin_analysis', 'CFO',
  ARRAY['margem', 'lucro', 'lucratividade', 'rentabilidade'],
  ARRAY['(?i)(margem|lucro)(.*)(análise|como está|percentual)', '(?i)estou (tendo|fazendo) lucro'],
  ARRAY['Qual minha margem de lucro?', 'Análise de lucratividade', 'Estou tendo lucro?'],
  0.85);

-- Intenções ENGENHEIRO
INSERT INTO thomaz_intent_detection (intent_name, mode_code, keywords, patterns, examples, confidence_threshold) VALUES
('equipment_recommendation', 'ENGINEER',
  ARRAY['equipamento', 'qual', 'melhor', 'recomendar', 'sugerir', 'ar condicionado'],
  ARRAY['(?i)(qual|melhor|recomendar)(.*)(equipamento|ar|split)', '(?i)que (equipamento|ar)(.*)(usar|escolher)'],
  ARRAY['Qual equipamento você recomenda?', 'Melhor solução para esse projeto', 'Split ou VRF?'],
  0.75),
  
('technical_sizing', 'ENGINEER',
  ARRAY['dimensionar', 'carga térmica', 'BTU', 'capacidade', 'tamanho', 'calcular'],
  ARRAY['(?i)(dimensionar|calcular)(.*)(BTU|capacidade|carga)', '(?i)quanto(.*)(BTU|capacidade)'],
  ARRAY['Como dimensionar o ar?', 'Qual a carga térmica?', 'Quantos BTUs preciso?'],
  0.85),
  
('technical_problem', 'ENGINEER',
  ARRAY['problema', 'falha', 'defeito', 'não funciona', 'vazamento', 'técnico'],
  ARRAY['(?i)(problema|falha|defeito)(.*)(equipamento|ar|técnico)', '(?i)(não|nao)(.*)(funciona|resfria)'],
  ARRAY['Ar condicionado com problema', 'Vazamento no sistema', 'Equipamento não resfria'],
  0.80);

-- Intenções ESTRATÉGICO
INSERT INTO thomaz_intent_detection (intent_name, mode_code, keywords, patterns, examples, confidence_threshold) VALUES
('strategic_decision', 'STRATEGIC',
  ARRAY['decisão', 'decidir', 'escolher', 'dilema', 'devo'],
  ARRAY['(?i)(devo|deveria|preciso)(.*)(decidir|escolher)', '(?i)o que (fazer|decidir)'],
  ARRAY['Devo contratar mais técnicos?', 'Preciso decidir sobre expansão', 'O que você faria?'],
  0.70),
  
('growth_strategy', 'STRATEGIC',
  ARRAY['crescer', 'crescimento', 'expandir', 'escalar', 'ampliar'],
  ARRAY['(?i)(crescer|expandir|escalar)(.*)(empresa|negócio)', '(?i)como (crescer|ampliar)'],
  ARRAY['Como crescer mais?', 'Estratégia de expansão', 'Escalar o negócio'],
  0.75),
  
('prioritization', 'STRATEGIC',
  ARRAY['prioridade', 'urgente', 'importante', 'primeiro', 'focar'],
  ARRAY['(?i)(priorizar|urgente|primeiro|foco)', '(?i)o que (fazer|focar) (primeiro|antes|agora)'],
  ARRAY['O que priorizar agora?', 'Qual é mais urgente?', 'Em que focar primeiro?'],
  0.80);

-- CRIAR TEMPLATES DE REASONING

INSERT INTO thomaz_reasoning_templates (template_name, mode_code, steps, data_requirements, output_template) VALUES
('financial_health_analysis', 'CFO',
  jsonb_build_array(
    jsonb_build_object('step', 1, 'action', 'get_health_score'),
    jsonb_build_object('step', 2, 'action', 'analyze_components'),
    jsonb_build_object('step', 3, 'action', 'identify_risks'),
    jsonb_build_object('step', 4, 'action', 'recommend_actions')
  ),
  ARRAY['v_thomaz_financial_health_score', 'v_thomaz_cash_projection_30d', 'thomaz_alerts'],
  E'💰 Financeiramente falando, {status}.\n\nOs números mostram:\n{analise}\n\n⚠️ Principais riscos:\n{riscos}\n\n✅ Recomendações:\n{recomendacoes}'
),

('equipment_selection', 'ENGINEER',
  jsonb_build_array(
    jsonb_build_object('step', 1, 'action', 'understand_context'),
    jsonb_build_object('step', 2, 'action', 'technical_analysis'),
    jsonb_build_object('step', 3, 'action', 'cost_benefit'),
    jsonb_build_object('step', 4, 'action', 'practical_recommendation')
  ),
  ARRAY['service_catalog', 'inventory_items'],
  E'🔧 Tecnicamente é viável, mas {realidade}.\n\n{custo_beneficio}\n\n💡 Na prática:\n{recomendacao}'
),

('decision_framework', 'STRATEGIC',
  jsonb_build_array(
    jsonb_build_object('step', 1, 'action', 'understand_dilemma'),
    jsonb_build_object('step', 2, 'action', 'identify_constraints'),
    jsonb_build_object('step', 3, 'action', 'explore_options'),
    jsonb_build_object('step', 4, 'action', 'organize_thinking')
  ),
  ARRAY['v_thomaz_business_intelligence'],
  E'🤔 Antes disso, {pergunta}.\n\nVamos organizar:\n{organizacao}\n\n🎯 Próximos passos:\n{proximos_passos}'
);

-- FUNÇÃO: Detectar Modo e Intenção
CREATE OR REPLACE FUNCTION thomaz_detect_mode_and_intent(
  user_message text,
  session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  detected_modes jsonb := '[]'::jsonb;
  best_mode text;
  detected_intent text;
  confidence numeric;
  mode_record record;
  max_score numeric := 0;
  current_score numeric;
BEGIN
  -- Analisar cada modo e calcular score
  FOR mode_record IN 
    SELECT * FROM thomaz_cognitive_modes WHERE active = true ORDER BY priority DESC
  LOOP
    current_score := 0;
    
    -- Verificar keywords (cada match = +1)
    FOR i IN 1..array_length(mode_record.trigger_keywords, 1) LOOP
      IF user_message ILIKE '%' || mode_record.trigger_keywords[i] || '%' THEN
        current_score := current_score + 1;
      END IF;
    END LOOP;
    
    -- Verificar patterns (cada match = +2, vale mais)
    FOR i IN 1..array_length(mode_record.trigger_patterns, 1) LOOP
      IF user_message ~ mode_record.trigger_patterns[i] THEN
        current_score := current_score + 2;
      END IF;
    END LOOP;
    
    -- Se teve algum match, adicionar aos candidatos
    IF current_score > 0 THEN
      detected_modes := detected_modes || jsonb_build_object(
        'mode', mode_record.mode_code,
        'mode_name', mode_record.mode_name,
        'score', current_score
      );
      
      -- Atualizar melhor modo
      IF current_score > max_score THEN
        max_score := current_score;
        best_mode := mode_record.mode_code;
      END IF;
    END IF;
  END LOOP;
  
  -- Se não detectou nenhum modo, usar STRATEGIC como padrão
  IF best_mode IS NULL THEN
    best_mode := 'STRATEGIC';
    confidence := 0.5;
    detected_intent := 'general_question';
  ELSE
    -- Calcular confiança (normalizar score)
    confidence := LEAST(0.95, 0.5 + (max_score * 0.15));
    
    -- Detectar intenção específica dentro do modo
    SELECT 
      intent_name
    INTO detected_intent
    FROM thomaz_intent_detection
    WHERE mode_code = best_mode
    AND active = true
    AND (
      -- Match por keyword
      EXISTS (
        SELECT 1 FROM unnest(keywords) k
        WHERE user_message ILIKE '%' || k || '%'
      )
      OR
      -- Match por pattern
      EXISTS (
        SELECT 1 FROM unnest(patterns) p
        WHERE user_message ~ p
      )
    )
    ORDER BY confidence_threshold DESC
    LIMIT 1;
    
    -- Se não encontrou intenção específica, usar genérica
    IF detected_intent IS NULL THEN
      detected_intent := best_mode || '_general';
    END IF;
  END IF;
  
  -- Salvar contexto se tiver session_id
  IF session_id IS NOT NULL THEN
    INSERT INTO thomaz_conversation_context (
      session_id,
      mode_code,
      detected_intent,
      confidence_score,
      conversation_history
    ) VALUES (
      session_id,
      best_mode,
      detected_intent,
      confidence,
      ARRAY[jsonb_build_object(
        'user_message', user_message,
        'mode_detected', best_mode,
        'timestamp', now()
      )]
    )
    ON CONFLICT (session_id) 
    DO UPDATE SET
      transition_from = thomaz_conversation_context.mode_code,
      transition_reason = CASE 
        WHEN thomaz_conversation_context.mode_code != EXCLUDED.mode_code 
        THEN 'Mudança de contexto detectada'
        ELSE NULL
      END,
      mode_code = EXCLUDED.mode_code,
      detected_intent = EXCLUDED.detected_intent,
      confidence_score = EXCLUDED.confidence_score,
      conversation_history = thomaz_conversation_context.conversation_history || EXCLUDED.conversation_history,
      updated_at = now();
  END IF;
  
  RETURN jsonb_build_object(
    'mode', best_mode,
    'intent', detected_intent,
    'confidence', confidence,
    'all_candidates', detected_modes,
    'explanation', 'Modo selecionado: ' || best_mode || ' com confiança de ' || (confidence * 100)::text || '%'
  );
END;
$$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_cognitive_modes_code ON thomaz_cognitive_modes(mode_code);
CREATE INDEX IF NOT EXISTS idx_intent_detection_mode ON thomaz_intent_detection(mode_code);
CREATE INDEX IF NOT EXISTS idx_conversation_context_session ON thomaz_conversation_context(session_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_templates_mode ON thomaz_reasoning_templates(mode_code);

-- Grants
GRANT SELECT ON thomaz_cognitive_modes TO anon, authenticated;
GRANT SELECT ON thomaz_intent_detection TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON thomaz_conversation_context TO anon, authenticated;
GRANT SELECT ON thomaz_reasoning_templates TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_detect_mode_and_intent TO anon, authenticated;

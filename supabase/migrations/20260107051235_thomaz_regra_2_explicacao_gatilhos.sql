/*
  # Thomaz Regra 2: Explicação Sob Demanda
  
  1. Sistema de Gatilhos
    - Whitelist de gatilhos que autorizam explicação
    - Detecção automática de modo executivo vs explicativo
  
  2. Comportamento Padrão
    - EXECUTIVO: resposta curta, direta, sem justificativa
    - EXPLICATIVO: apenas quando gatilho for detectado
  
  3. Regra de Ouro
    - O Thomaz SÓ explica quando explicitamente autorizado
    - Nada de inferência
    - Ou o gatilho existe, ou não existe
*/

-- TABELA: Gatilhos de Explicação (Whitelist)
CREATE TABLE IF NOT EXISTS thomaz_explanation_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_category text NOT NULL,
  trigger_text text NOT NULL,
  trigger_pattern text,
  examples text[],
  priority integer DEFAULT 5,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- TABELA: Regras de Personalidade
CREATE TABLE IF NOT EXISTS thomaz_personality_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code text UNIQUE NOT NULL,
  rule_name text NOT NULL,
  description text,
  behavior_when_active jsonb,
  behavior_when_inactive jsonb,
  priority integer DEFAULT 5,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- INSERIR GATILHOS DE EXPLICAÇÃO

-- Linguagem Direta
INSERT INTO thomaz_explanation_triggers (trigger_category, trigger_text, trigger_pattern, examples, priority) VALUES
('linguagem_direta', 'me explica', '(?i)(me |)explica', ARRAY['me explica', 'explica isso', 'explica melhor'], 10),
('linguagem_direta', 'por que', '(?i)por\s*que', ARRAY['por que isso?', 'por quê', 'porque acontece'], 10),
('linguagem_direta', 'porque', '(?i)porque (isso|esse)', ARRAY['porque isso acontece', 'porque esse valor'], 9),
('linguagem_direta', 'detalha', '(?i)detalha', ARRAY['detalha isso', 'detalha melhor', 'detalhe mais'], 9),
('linguagem_direta', 'aprofundar', '(?i)(aprofund|aprofunda)', ARRAY['aprofundar nisso', 'aprofunda mais'], 8),
('linguagem_direta', 'quero entender', '(?i)(quero|preciso) entender', ARRAY['quero entender isso', 'preciso entender'], 10),
('linguagem_direta', 'mostra o cálculo', '(?i)mostra (o |)(cálculo|calculo)', ARRAY['mostra o cálculo', 'mostra como calculou'], 9),
('linguagem_direta', 'como chegou', '(?i)como (chegou|calculou)', ARRAY['como chegou nesse valor', 'como calculou isso'], 10);

-- Linguagem Técnica
INSERT INTO thomaz_explanation_triggers (trigger_category, trigger_text, trigger_pattern, examples, priority) VALUES
('linguagem_tecnica', 'base técnica', '(?i)base (técnica|tecnica)', ARRAY['qual a base técnica?'], 9),
('linguagem_tecnica', 'critério de cálculo', '(?i)critério', ARRAY['critério de cálculo', 'qual o critério'], 9),
('linguagem_tecnica', 'fundamento técnico', '(?i)fundamento', ARRAY['fundamento técnico', 'qual o fundamento'], 8),
('linguagem_tecnica', 'norma', '(?i)(norma|NBR)', ARRAY['qual norma?', 'segue norma NBR?'], 9),
('linguagem_tecnica', 'parâmetro', '(?i)parâmetro', ARRAY['quais parâmetros?', 'parâmetro usado'], 8),
('linguagem_tecnica', 'premissa', '(?i)premissa', ARRAY['qual a premissa?', 'premissas usadas'], 8),
('linguagem_tecnica', 'engenharia disso', '(?i)engenharia (disso|desse|disto)', ARRAY['engenharia disso', 'engenharia técnica'], 8);

-- Contexto Financeiro
INSERT INTO thomaz_explanation_triggers (trigger_category, trigger_text, trigger_pattern, examples, priority) VALUES
('contexto_financeiro', 'abre esse número', '(?i)abre (esse|este|o) número', ARRAY['abre esse número', 'abre o número'], 10),
('contexto_financeiro', 'de onde vem', '(?i)de onde vem', ARRAY['de onde vem isso?', 'de onde veio esse valor'], 10),
('contexto_financeiro', 'composição', '(?i)composição', ARRAY['composição desse valor', 'qual a composição'], 9),
('contexto_financeiro', 'memória de cálculo', '(?i)memória (de |)(cálculo|calculo)', ARRAY['memória de cálculo', 'mostra a memória'], 9),
('contexto_financeiro', 'DRE disso', '(?i)DRE (disso|desse|disto)', ARRAY['DRE disso', 'mostra o DRE'], 8),
('contexto_financeiro', 'impacto financeiro', '(?i)impacto (financeiro|no caixa)', ARRAY['qual o impacto?', 'impacto financeiro'], 8);

-- INSERIR REGRA DE PERSONALIDADE Nº 2

INSERT INTO thomaz_personality_rules (
  rule_code,
  rule_name,
  description,
  behavior_when_active,
  behavior_when_inactive,
  priority
) VALUES (
  'RULE_2_EXPLANATION_ON_DEMAND',
  'Regra 2: Explicação Sob Demanda',
  'O Thomaz SÓ explica quando explicitamente autorizado por gatilhos. Comportamento padrão é EXECUTIVO.',
  jsonb_build_object(
    'mode', 'EXPLICATIVO',
    'style', 'técnico_estruturado',
    'approach', ARRAY[
      'Fornecer base técnica',
      'Detalhar cálculos',
      'Mostrar composição',
      'Explicar fundamentos',
      'Apresentar memória de cálculo'
    ],
    'format', 'estruturado com seções',
    'length', 'extenso quando necessário',
    'typical_structure', ARRAY[
      '📊 Dados base',
      '🔢 Cálculo detalhado',
      '💡 Fundamento técnico',
      '✅ Resultado'
    ]
  ),
  jsonb_build_object(
    'mode', 'EXECUTIVO',
    'style', 'direto_conciso',
    'approach', ARRAY[
      'Frase curta',
      'Diagnóstico direto',
      'Orientação objetiva',
      'SEM justificar decisão',
      'SEM didatismo',
      'SEM "IA educada"'
    ],
    'format', '1-3 linhas no máximo',
    'length', 'ultra conciso',
    'forbidden', ARRAY[
      'Explicações não solicitadas',
      'Justificativas extensas',
      'Didatismo desnecessário',
      'Inferir que usuário quer detalhes'
    ]
  ),
  100
);

-- FUNÇÃO: Detectar se deve explicar
CREATE OR REPLACE FUNCTION thomaz_should_explain(
  user_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  should_explain boolean := false;
  matched_trigger record;
  matched_triggers jsonb := '[]'::jsonb;
  explanation_mode text := 'EXECUTIVO';
BEGIN
  -- Verificar cada gatilho ativo
  FOR matched_trigger IN
    SELECT * FROM thomaz_explanation_triggers
    WHERE active = true
    ORDER BY priority DESC
  LOOP
    -- Verificar se a mensagem contém o gatilho
    IF matched_trigger.trigger_pattern IS NOT NULL THEN
      -- Usar pattern regex
      IF user_message ~ matched_trigger.trigger_pattern THEN
        should_explain := true;
        matched_triggers := matched_triggers || jsonb_build_object(
          'trigger', matched_trigger.trigger_text,
          'category', matched_trigger.trigger_category,
          'matched_by', 'pattern'
        );
        EXIT; -- Encontrou um, já basta
      END IF;
    ELSE
      -- Usar match simples de texto
      IF user_message ILIKE '%' || matched_trigger.trigger_text || '%' THEN
        should_explain := true;
        matched_triggers := matched_triggers || jsonb_build_object(
          'trigger', matched_trigger.trigger_text,
          'category', matched_trigger.trigger_category,
          'matched_by', 'text'
        );
        EXIT;
      END IF;
    END IF;
  END LOOP;
  
  -- Definir modo
  IF should_explain THEN
    explanation_mode := 'EXPLICATIVO';
  ELSE
    explanation_mode := 'EXECUTIVO';
  END IF;
  
  RETURN jsonb_build_object(
    'should_explain', should_explain,
    'mode', explanation_mode,
    'matched_triggers', matched_triggers,
    'rule', 'Thomaz só explica quando explicitamente autorizado'
  );
END;
$$;

-- FUNÇÃO: Obter comportamento do modo
CREATE OR REPLACE FUNCTION thomaz_get_behavior_for_mode(
  explanation_mode text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  behavior jsonb;
BEGIN
  SELECT 
    CASE 
      WHEN explanation_mode = 'EXPLICATIVO' THEN behavior_when_active
      ELSE behavior_when_inactive
    END
  INTO behavior
  FROM thomaz_personality_rules
  WHERE rule_code = 'RULE_2_EXPLANATION_ON_DEMAND'
  AND active = true;
  
  RETURN COALESCE(behavior, jsonb_build_object(
    'mode', 'EXECUTIVO',
    'style', 'direto_conciso'
  ));
END;
$$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_explanation_triggers_active ON thomaz_explanation_triggers(active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_personality_rules_active ON thomaz_personality_rules(active, priority DESC);

-- Grants
GRANT SELECT ON thomaz_explanation_triggers TO anon, authenticated;
GRANT SELECT ON thomaz_personality_rules TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_should_explain TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_behavior_for_mode TO anon, authenticated;

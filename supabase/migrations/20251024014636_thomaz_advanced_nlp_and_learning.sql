/*
  # Sistema Avançado de NLP e Aprendizado do Thomaz

  1. Sistema de Compreensão Natural
    - thomaz_nlp_patterns - Padrões de linguagem natural
    - thomaz_synonyms - Sinônimos e variações
    - thomaz_intent_detection - Detecção de intenções
    
  2. Memória de Longo Prazo
    - thomaz_long_term_memory - Fatos e conhecimentos aprendidos
    - thomaz_user_preferences - Preferências individuais
    - thomaz_conversation_summary - Resumos de conversas
    
  3. Sistema de Aprendizado Ativo
    - thomaz_learning_queue - Fila de novos aprendizados
    - thomaz_knowledge_graph - Grafo de conhecimento
    - thomaz_feedback_analysis - Análise de feedbacks
*/

-- =====================================================
-- 1. SISTEMA DE PROCESSAMENTO DE LINGUAGEM NATURAL
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_nlp_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  intent TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.8,
  examples JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  context_required TEXT[],
  response_template TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nlp_patterns_intent ON thomaz_nlp_patterns(intent);
CREATE INDEX IF NOT EXISTS idx_nlp_patterns_active ON thomaz_nlp_patterns(is_active) WHERE is_active = true;

-- Inserir padrões iniciais de linguagem natural
INSERT INTO thomaz_nlp_patterns (pattern, intent, confidence, keywords, examples) VALUES
('boa noite|boa tarde|bom dia|olá|oi|e aí', 'greeting', 0.95, '["cumprimento", "saudação"]'::jsonb, '["boa noite", "oi", "olá"]'::jsonb),
('tchau|até logo|até mais|falou', 'farewell', 0.95, '["despedida"]'::jsonb, '["tchau", "até mais"]'::jsonb),
('obrigado|valeu|agradeço', 'gratitude', 0.95, '["agradecimento"]'::jsonb, '["obrigado", "valeu"]'::jsonb),
('como está|tudo bem|como vai', 'how_are_you', 0.90, '["cortesia", "estado"]'::jsonb, '["como vai?", "tudo bem?"]'::jsonb),
('ajuda|socorro|não sei', 'help', 0.85, '["auxílio", "dúvida"]'::jsonb, '["preciso de ajuda"]'::jsonb),
('quem é você|o que você faz|sua função', 'about_self', 0.90, '["identidade", "propósito"]'::jsonb, '["quem é você?"]'::jsonb),
('não entendi|repita|explica melhor', 'clarification', 0.85, '["dúvida", "explicação"]'::jsonb, '["não entendi"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Tabela de sinônimos para melhor compreensão
CREATE TABLE IF NOT EXISTS thomaz_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  synonyms JSONB NOT NULL,
  category TEXT,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_synonyms_word ON thomaz_synonyms(word);
CREATE INDEX IF NOT EXISTS idx_synonyms_category ON thomaz_synonyms(category);

-- Inserir sinônimos comuns
INSERT INTO thomaz_synonyms (word, synonyms, category) VALUES
('ordem de serviço', '["os", "ordem", "serviço", "atendimento", "chamado", "ticket"]'::jsonb, 'sistema'),
('estoque', '["inventário", "materiais", "produtos", "itens", "almoxarifado"]'::jsonb, 'sistema'),
('cliente', '["consumidor", "comprador", "contratante", "pessoa"]'::jsonb, 'sistema'),
('funcionário', '["colaborador", "empregado", "trabalhador", "equipe", "staff", "pessoal"]'::jsonb, 'sistema'),
('dinheiro', '["grana", "valor", "valor", "financeiro", "pagamento"]'::jsonb, 'financeiro'),
('compromisso', '["reunião", "encontro", "agendamento", "horário", "appointment"]'::jsonb, 'agenda'),
('mostrar', '["exibir", "listar", "ver", "visualizar", "buscar", "encontrar", "procurar"]'::jsonb, 'ação'),
('criar', '["adicionar", "inserir", "cadastrar", "novo", "incluir"]'::jsonb, 'ação'),
('apagar', '["deletar", "remover", "excluir", "eliminar"]'::jsonb, 'ação'),
('editar', '["modificar", "alterar", "atualizar", "mudar", "corrigir"]'::jsonb, 'ação')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. MEMÓRIA DE LONGO PRAZO
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_long_term_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  source TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.7,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_long_memory_type ON thomaz_long_term_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_long_memory_subject ON thomaz_long_term_memory(subject);
CREATE INDEX IF NOT EXISTS idx_long_memory_tags ON thomaz_long_term_memory USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_long_memory_accessed ON thomaz_long_term_memory(last_accessed_at DESC);

-- Tabela de preferências do usuário
CREATE TABLE IF NOT EXISTS thomaz_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  learned_from TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON thomaz_user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prefs_key ON thomaz_user_preferences(preference_key);

-- Tabela de resumos de conversas
CREATE TABLE IF NOT EXISTS thomaz_conversation_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_topics TEXT[],
  user_sentiment TEXT,
  important_facts JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_summary_user ON thomaz_conversation_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_summary_session ON thomaz_conversation_summary(session_id);

-- =====================================================
-- 3. SISTEMA DE APRENDIZADO ATIVO
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_learning_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_type TEXT NOT NULL,
  source_query TEXT NOT NULL,
  learned_content TEXT,
  related_data JSONB DEFAULT '{}'::jsonb,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  needs_verification BOOLEAN DEFAULT true,
  verified_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_learning_queue_status ON thomaz_learning_queue(status);
CREATE INDEX IF NOT EXISTS idx_learning_queue_type ON thomaz_learning_queue(learning_type);

-- Tabela de grafo de conhecimento
CREATE TABLE IF NOT EXISTS thomaz_knowledge_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  related_entities JSONB DEFAULT '{}'::jsonb,
  properties JSONB DEFAULT '{}'::jsonb,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  source TEXT,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_entity_type ON thomaz_knowledge_graph(entity_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entity_name ON thomaz_knowledge_graph(entity_name);

-- Tabela de análise de feedback
CREATE TABLE IF NOT EXISTS thomaz_feedback_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  user_query TEXT NOT NULL,
  thomaz_response TEXT NOT NULL,
  feedback_type TEXT,
  feedback_score INTEGER,
  what_worked TEXT,
  what_failed TEXT,
  improvement_suggestions TEXT,
  context_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_type ON thomaz_feedback_analysis(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_score ON thomaz_feedback_analysis(feedback_score);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON thomaz_feedback_analysis(created_at DESC);

-- =====================================================
-- FUNCTIONS AVANÇADAS
-- =====================================================

-- Function para detectar intenção da mensagem
CREATE OR REPLACE FUNCTION thomaz_detect_intent(p_message TEXT)
RETURNS TABLE(
  intent TEXT,
  confidence DECIMAL,
  matched_pattern TEXT,
  keywords TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    np.intent,
    np.confidence,
    np.pattern,
    ARRAY(SELECT jsonb_array_elements_text(np.keywords)) as keywords
  FROM thomaz_nlp_patterns np
  WHERE 
    p_message ~* np.pattern
    AND np.is_active = true
  ORDER BY np.confidence DESC, np.usage_count DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para expandir query com sinônimos
CREATE OR REPLACE FUNCTION thomaz_expand_query(p_query TEXT)
RETURNS TEXT AS $$
DECLARE
  v_expanded TEXT := p_query;
  v_word TEXT;
  v_synonyms JSONB;
BEGIN
  FOR v_word, v_synonyms IN 
    SELECT word, synonyms 
    FROM thomaz_synonyms
    WHERE p_query ~* word
  LOOP
    v_expanded := v_expanded || ' ' || jsonb_array_elements_text(v_synonyms);
  END LOOP;
  
  RETURN v_expanded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para salvar aprendizado
CREATE OR REPLACE FUNCTION thomaz_save_learning(
  p_query TEXT,
  p_response TEXT,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_learning_id UUID;
BEGIN
  INSERT INTO thomaz_learning_queue (
    learning_type,
    source_query,
    learned_content,
    related_data,
    confidence
  ) VALUES (
    'conversation',
    p_query,
    p_response,
    p_context,
    0.6
  )
  RETURNING id INTO v_learning_id;
  
  RETURN v_learning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para buscar memórias relevantes
CREATE OR REPLACE FUNCTION thomaz_recall_memories(
  p_query TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  memory_id UUID,
  subject TEXT,
  content TEXT,
  confidence DECIMAL,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.subject,
    m.content,
    m.confidence,
    m.tags
  FROM thomaz_long_term_memory m
  WHERE 
    m.subject ~* p_query OR
    m.content ~* p_query OR
    p_query = ANY(m.tags)
  ORDER BY 
    m.confidence DESC,
    m.access_count DESC,
    m.last_accessed_at DESC
  LIMIT p_limit;
  
  -- Atualizar contador de acesso
  UPDATE thomaz_long_term_memory
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE id IN (
    SELECT m.id FROM thomaz_long_term_memory m
    WHERE m.subject ~* p_query OR m.content ~* p_query
    LIMIT p_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE thomaz_nlp_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_long_term_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_conversation_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_learning_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_knowledge_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_feedback_analysis ENABLE ROW LEVEL SECURITY;

-- Policies permissivas para o Thomaz aprender
CREATE POLICY "Anyone can access NLP patterns - anon"
  ON thomaz_nlp_patterns FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can access synonyms - anon"
  ON thomaz_synonyms FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage memory - anon"
  ON thomaz_long_term_memory FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage preferences - anon"
  ON thomaz_user_preferences FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage summaries - anon"
  ON thomaz_conversation_summary FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage learning - anon"
  ON thomaz_learning_queue FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage knowledge - anon"
  ON thomaz_knowledge_graph FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage feedback - anon"
  ON thomaz_feedback_analysis FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE thomaz_nlp_patterns IS 'Padrões de linguagem natural para compreensão contextual';
COMMENT ON TABLE thomaz_synonyms IS 'Sinônimos e variações de palavras para melhor compreensão';
COMMENT ON TABLE thomaz_long_term_memory IS 'Memória de longo prazo do Thomaz';
COMMENT ON TABLE thomaz_learning_queue IS 'Fila de novos aprendizados aguardando processamento';
COMMENT ON TABLE thomaz_knowledge_graph IS 'Grafo de conhecimento para relações entre entidades';
COMMENT ON FUNCTION thomaz_detect_intent IS 'Detecta intenção da mensagem do usuário';
COMMENT ON FUNCTION thomaz_expand_query IS 'Expande query com sinônimos para melhor busca';
COMMENT ON FUNCTION thomaz_save_learning IS 'Salva novo aprendizado na fila';
COMMENT ON FUNCTION thomaz_recall_memories IS 'Busca memórias relevantes do passado';

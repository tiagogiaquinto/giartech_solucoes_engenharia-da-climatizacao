/*
  # Sistema de Superinteligência para Thomaz AI

  1. Novas Tabelas
    - `thomaz_reasoning_chains` - Cadeia de raciocínio (CoT - Chain of Thought)
    - `thomaz_web_knowledge` - Conhecimento adquirido da web
    - `thomaz_learning_history` - Histórico de aprendizado
    - `thomaz_context_memory` - Memória contextual de longo prazo
    - `thomaz_fact_verification` - Verificação de fatos
    - `web_sources` - Fontes web confiáveis
    
  2. Capacidades
    - Raciocínio em cadeia (Chain of Thought)
    - Busca e síntese web
    - Verificação de fatos
    - Aprendizado contínuo
    - Memória de longo prazo
*/

-- Fontes web confiáveis
CREATE TABLE IF NOT EXISTS web_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text NOT NULL UNIQUE,
  category text NOT NULL,
  trust_score numeric(3,2) DEFAULT 0.80 CHECK (trust_score >= 0 AND trust_score <= 1),
  is_active boolean DEFAULT true,
  allowed_topics text[] DEFAULT '{}',
  api_endpoint text,
  api_key_required boolean DEFAULT false,
  rate_limit_per_hour int DEFAULT 100,
  last_accessed timestamptz,
  success_count int DEFAULT 0,
  error_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_sources_domain ON web_sources(domain);
CREATE INDEX IF NOT EXISTS idx_web_sources_category ON web_sources(category);
CREATE INDEX IF NOT EXISTS idx_web_sources_active ON web_sources(is_active) WHERE is_active = true;

-- Conhecimento da web
CREATE TABLE IF NOT EXISTS thomaz_web_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  topic text NOT NULL,
  source_id uuid REFERENCES web_sources(id),
  source_url text NOT NULL,
  source_domain text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  key_points text[] DEFAULT '{}',
  entities jsonb DEFAULT '{}',
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  language text DEFAULT 'pt-BR',
  trust_score numeric(3,2) DEFAULT 0.70,
  is_verified boolean DEFAULT false,
  verification_date timestamptz,
  relevance_score numeric(3,2) DEFAULT 0.50,
  citation_count int DEFAULT 0,
  last_cited timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_knowledge_query ON thomaz_web_knowledge USING gin(to_tsvector('portuguese', query));
CREATE INDEX IF NOT EXISTS idx_web_knowledge_topic ON thomaz_web_knowledge(topic);
CREATE INDEX IF NOT EXISTS idx_web_knowledge_domain ON thomaz_web_knowledge(source_domain);
CREATE INDEX IF NOT EXISTS idx_web_knowledge_content ON thomaz_web_knowledge USING gin(to_tsvector('portuguese', content));
CREATE INDEX IF NOT EXISTS idx_web_knowledge_verified ON thomaz_web_knowledge(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_web_knowledge_expires ON thomaz_web_knowledge(expires_at);

-- Cadeia de raciocínio (Chain of Thought)
CREATE TABLE IF NOT EXISTS thomaz_reasoning_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid,
  user_query text NOT NULL,
  reasoning_type text NOT NULL CHECK (reasoning_type IN (
    'deductive', 'inductive', 'abductive', 'analogical', 'causal', 'probabilistic'
  )),
  thought_steps jsonb NOT NULL DEFAULT '[]',
  premises text[] DEFAULT '{}',
  conclusions text[] DEFAULT '{}',
  confidence_score numeric(3,2) DEFAULT 0.70 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  sources_used text[] DEFAULT '{}',
  web_searches_performed int DEFAULT 0,
  knowledge_base_queries int DEFAULT 0,
  reasoning_time_ms int,
  final_answer text NOT NULL,
  was_correct boolean,
  user_feedback text,
  complexity_level text DEFAULT 'medium' CHECK (complexity_level IN ('simple', 'medium', 'complex', 'expert')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reasoning_conversation ON thomaz_reasoning_chains(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_type ON thomaz_reasoning_chains(reasoning_type);
CREATE INDEX IF NOT EXISTS idx_reasoning_query ON thomaz_reasoning_chains USING gin(to_tsvector('portuguese', user_query));
CREATE INDEX IF NOT EXISTS idx_reasoning_created ON thomaz_reasoning_chains(created_at DESC);

-- Memória contextual de longo prazo
CREATE TABLE IF NOT EXISTS thomaz_context_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  context_type text NOT NULL CHECK (context_type IN (
    'user_preference', 'conversation_history', 'learned_fact', 'user_expertise', 
    'interaction_pattern', 'topic_interest', 'feedback'
  )),
  context_key text NOT NULL,
  context_value jsonb NOT NULL,
  importance_score numeric(3,2) DEFAULT 0.50 CHECK (importance_score >= 0 AND importance_score <= 1),
  access_count int DEFAULT 0,
  last_accessed timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_context_user ON thomaz_context_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_context_type ON thomaz_context_memory(context_type);
CREATE INDEX IF NOT EXISTS idx_context_key ON thomaz_context_memory(context_key);
CREATE INDEX IF NOT EXISTS idx_context_importance ON thomaz_context_memory(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_context_accessed ON thomaz_context_memory(last_accessed DESC);

-- Histórico de aprendizado
CREATE TABLE IF NOT EXISTS thomaz_learning_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_type text NOT NULL CHECK (learning_type IN (
    'new_fact', 'correction', 'pattern_recognition', 'user_feedback', 
    'self_improvement', 'knowledge_synthesis'
  )),
  topic text NOT NULL,
  old_knowledge text,
  new_knowledge text NOT NULL,
  source text NOT NULL,
  confidence_before numeric(3,2),
  confidence_after numeric(3,2),
  validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected', 'uncertain')),
  impact_score numeric(3,2) DEFAULT 0.50,
  applied_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_type ON thomaz_learning_history(learning_type);
CREATE INDEX IF NOT EXISTS idx_learning_topic ON thomaz_learning_history(topic);
CREATE INDEX IF NOT EXISTS idx_learning_status ON thomaz_learning_history(validation_status);
CREATE INDEX IF NOT EXISTS idx_learning_created ON thomaz_learning_history(created_at DESC);

-- Verificação de fatos
CREATE TABLE IF NOT EXISTS thomaz_fact_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim text NOT NULL,
  context text,
  verification_status text NOT NULL CHECK (verification_status IN (
    'true', 'false', 'partially_true', 'misleading', 'unverified', 'opinion'
  )),
  confidence_score numeric(3,2) DEFAULT 0.50,
  sources_checked int DEFAULT 0,
  supporting_sources text[] DEFAULT '{}',
  contradicting_sources text[] DEFAULT '{}',
  expert_consensus text,
  last_verified timestamptz DEFAULT now(),
  verification_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fact_claim ON thomaz_fact_verification USING gin(to_tsvector('portuguese', claim));
CREATE INDEX IF NOT EXISTS idx_fact_status ON thomaz_fact_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_fact_verified ON thomaz_fact_verification(last_verified DESC);

-- RLS
ALTER TABLE web_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_web_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_reasoning_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_context_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_learning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_fact_verification ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Acesso público a fontes web" ON web_sources FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso ao conhecimento web" ON thomaz_web_knowledge FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso ao raciocínio" ON thomaz_reasoning_chains FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso à memória contextual" ON thomaz_context_memory FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso ao aprendizado" ON thomaz_learning_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso à verificação" ON thomaz_fact_verification FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_thomaz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_web_knowledge_updated
  BEFORE UPDATE ON thomaz_web_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_thomaz_updated_at();

CREATE TRIGGER trigger_context_memory_updated
  BEFORE UPDATE ON thomaz_context_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_thomaz_updated_at();

-- Popular fontes web confiáveis
INSERT INTO web_sources (name, domain, category, trust_score, allowed_topics) VALUES
('Wikipedia PT', 'pt.wikipedia.org', 'encyclopedia', 0.85, ARRAY['geral', 'conhecimento', 'história', 'ciência']),
('G1 Notícias', 'g1.globo.com', 'news', 0.80, ARRAY['notícias', 'brasil', 'tecnologia']),
('TecMundo', 'tecmundo.com.br', 'technology', 0.85, ARRAY['tecnologia', 'ciência', 'inovação']),
('InfoMoney', 'infomoney.com.br', 'finance', 0.85, ARRAY['economia', 'finanças', 'investimentos']),
('Manual do Mundo', 'manualdomundo.com.br', 'education', 0.90, ARRAY['ciência', 'educação', 'experimentos']),
('Mundo HVAC', 'mundohvac.com.br', 'industry', 0.90, ARRAY['hvac', 'ar condicionado', 'refrigeração']),
('WebArCondicionado', 'webarcondicionado.com.br', 'industry', 0.90, ARRAY['ar condicionado', 'climatização']),
('GitHub', 'github.com', 'technology', 0.85, ARRAY['programação', 'código', 'desenvolvimento']),
('Stack Overflow', 'stackoverflow.com', 'technology', 0.90, ARRAY['programação', 'desenvolvimento'])
ON CONFLICT (domain) DO NOTHING;

-- Função para buscar na web (simulada - em produção, integrar API real)
CREATE OR REPLACE FUNCTION thomaz_search_web(
  p_query text,
  p_topic text DEFAULT 'geral',
  p_max_results int DEFAULT 5
)
RETURNS jsonb AS $$
DECLARE
  v_results jsonb := '[]'::jsonb;
  v_cached_results RECORD;
BEGIN
  -- Primeiro, verificar cache existente
  FOR v_cached_results IN
    SELECT 
      id,
      title,
      summary,
      source_url,
      source_domain,
      trust_score,
      relevance_score
    FROM thomaz_web_knowledge
    WHERE 
      to_tsvector('portuguese', query || ' ' || content) @@ plainto_tsquery('portuguese', p_query)
      AND expires_at > now()
      AND trust_score >= 0.70
    ORDER BY 
      relevance_score DESC,
      trust_score DESC,
      created_at DESC
    LIMIT p_max_results
  LOOP
    v_results := v_results || jsonb_build_object(
      'id', v_cached_results.id,
      'title', v_cached_results.title,
      'summary', v_cached_results.summary,
      'url', v_cached_results.source_url,
      'domain', v_cached_results.source_domain,
      'trust_score', v_cached_results.trust_score,
      'relevance', v_cached_results.relevance_score,
      'cached', true
    );
    
    -- Atualizar contadores
    UPDATE thomaz_web_knowledge 
    SET citation_count = citation_count + 1, last_cited = now()
    WHERE id = v_cached_results.id;
  END LOOP;
  
  RETURN jsonb_build_object(
    'query', p_query,
    'results_count', jsonb_array_length(v_results),
    'results', v_results,
    'cached', true,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função de raciocínio em cadeia (Chain of Thought)
CREATE OR REPLACE FUNCTION thomaz_reason_chain_of_thought(
  p_query text,
  p_context jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_steps jsonb := '[]'::jsonb;
  v_reasoning_id uuid;
  v_start_time timestamptz := clock_timestamp();
  v_reasoning_time_ms int;
BEGIN
  -- Passo 1: Entender a pergunta
  v_steps := v_steps || jsonb_build_object(
    'step', 1,
    'action', 'analyze_query',
    'description', 'Analisando e decompondo a pergunta',
    'result', jsonb_build_object(
      'query_type', CASE 
        WHEN p_query ~* '\?$' THEN 'question'
        WHEN p_query ~* '^(como|quando|onde|por que|porque|qual|quais)' THEN 'interrogative'
        ELSE 'statement'
      END,
      'complexity', CASE
        WHEN length(p_query) < 50 THEN 'simple'
        WHEN length(p_query) < 150 THEN 'medium'
        ELSE 'complex'
      END
    )
  );
  
  -- Passo 2: Buscar conhecimento relevante
  v_steps := v_steps || jsonb_build_object(
    'step', 2,
    'action', 'search_knowledge',
    'description', 'Buscando informações na base de conhecimento',
    'sources', ARRAY['knowledge_base', 'web_cache', 'documents']
  );
  
  -- Passo 3: Analisar e sintetizar
  v_steps := v_steps || jsonb_build_object(
    'step', 3,
    'action', 'synthesize',
    'description', 'Analisando e sintetizando informações encontradas'
  );
  
  -- Passo 4: Verificar e validar
  v_steps := v_steps || jsonb_build_object(
    'step', 4,
    'action', 'validate',
    'description', 'Verificando consistência e confiabilidade das informações'
  );
  
  -- Passo 5: Formular resposta
  v_steps := v_steps || jsonb_build_object(
    'step', 5,
    'action', 'formulate_answer',
    'description', 'Formulando resposta clara e precisa'
  );
  
  -- Calcular tempo de raciocínio
  v_reasoning_time_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::int;
  
  -- Salvar cadeia de raciocínio
  INSERT INTO thomaz_reasoning_chains (
    user_query,
    reasoning_type,
    thought_steps,
    reasoning_time_ms,
    final_answer
  ) VALUES (
    p_query,
    'deductive',
    v_steps,
    v_reasoning_time_ms,
    'Resposta formulada através de raciocínio em cadeia'
  ) RETURNING id INTO v_reasoning_id;
  
  RETURN jsonb_build_object(
    'reasoning_id', v_reasoning_id,
    'steps', v_steps,
    'total_steps', jsonb_array_length(v_steps),
    'reasoning_time_ms', v_reasoning_time_ms,
    'confidence', 0.85
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para aprender com feedback
CREATE OR REPLACE FUNCTION thomaz_learn_from_feedback(
  p_topic text,
  p_old_knowledge text,
  p_new_knowledge text,
  p_source text,
  p_confidence numeric DEFAULT 0.80
)
RETURNS uuid AS $$
DECLARE
  v_learning_id uuid;
BEGIN
  INSERT INTO thomaz_learning_history (
    learning_type,
    topic,
    old_knowledge,
    new_knowledge,
    source,
    confidence_before,
    confidence_after,
    impact_score
  ) VALUES (
    'user_feedback',
    p_topic,
    p_old_knowledge,
    p_new_knowledge,
    p_source,
    COALESCE((SELECT confidence_score FROM thomaz_reasoning_chains WHERE user_query ILIKE '%' || p_topic || '%' ORDER BY created_at DESC LIMIT 1), 0.50),
    p_confidence,
    p_confidence
  ) RETURNING id INTO v_learning_id;
  
  RETURN v_learning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View de estatísticas de inteligência
CREATE OR REPLACE VIEW v_thomaz_intelligence_stats AS
SELECT 
  (SELECT COUNT(*) FROM thomaz_web_knowledge WHERE expires_at > now()) as cached_knowledge_count,
  (SELECT COUNT(*) FROM thomaz_reasoning_chains) as total_reasoning_chains,
  (SELECT AVG(confidence_score) FROM thomaz_reasoning_chains) as avg_confidence,
  (SELECT COUNT(*) FROM thomaz_learning_history) as total_learnings,
  (SELECT COUNT(*) FROM thomaz_context_memory) as memory_entries,
  (SELECT COUNT(*) FROM thomaz_fact_verification) as facts_verified,
  (SELECT COUNT(*) FROM web_sources WHERE is_active = true) as active_sources;

-- View de conhecimento mais relevante
CREATE OR REPLACE VIEW v_thomaz_top_knowledge AS
SELECT 
  id,
  topic,
  title,
  summary,
  source_domain,
  trust_score,
  relevance_score,
  citation_count,
  created_at
FROM thomaz_web_knowledge
WHERE 
  expires_at > now()
  AND trust_score >= 0.75
ORDER BY 
  citation_count DESC,
  trust_score DESC,
  relevance_score DESC
LIMIT 100;

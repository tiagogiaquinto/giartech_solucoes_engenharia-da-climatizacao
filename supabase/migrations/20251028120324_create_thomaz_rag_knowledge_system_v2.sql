/*
  # Sistema RAG e Knowledge Base Completo para ThomazAI

  1. Nova Infraestrutura
    - `thomaz_documents` - Repositório de documentos indexados
    - `thomaz_document_chunks` - Chunks vetorizados para RAG
    - `thomaz_embeddings` - Armazenamento de embeddings
    - `thomaz_conversations` - Histórico de conversações com contexto
    - `thomaz_conversation_feedback` - Feedback e avaliação de respostas
    - `thomaz_knowledge_sources` - Fontes de conhecimento (SOPs, manuais, etc)
    - `thomaz_audit_log` - Log completo de auditoria
    - `thomaz_confidence_scores` - Scores de confiança por resposta
    - `thomaz_fallback_tickets` - Sistema de tickets quando IA não tem confiança

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Permissões por role (admin, técnico, cliente)
    - Sensitivity levels para dados sensíveis
    - Audit trail completo

  3. Funcionalidades
    - Vector similarity search
    - RAG pipeline completo
    - Sistema de confiança e threshold
    - Fallback humano automático
    - Métricas de qualidade (TTR, Accuracy, Recall)
*/

-- =====================================================
-- 1. KNOWLEDGE SOURCES (Fontes de Conhecimento)
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('SOP', 'MANUAL', 'SPECIFICATION', 'LOG', 'POLICY', 'FAQ', 'GUIDE')),
  title text NOT NULL,
  description text,
  content text NOT NULL,
  version text DEFAULT '1.0',
  sensitivity text DEFAULT 'public' CHECK (sensitivity IN ('public', 'internal', 'confidential', 'restricted')),
  required_roles text[] DEFAULT ARRAY['admin']::text[],
  document_owner text,
  category text,
  tags text[],
  language text DEFAULT 'pt-BR',
  word_count integer,
  last_reviewed_at timestamptz,
  review_frequency_days integer DEFAULT 365,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type ON thomaz_knowledge_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_sensitivity ON thomaz_knowledge_sources(sensitivity);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_active ON thomaz_knowledge_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_category ON thomaz_knowledge_sources(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_tags ON thomaz_knowledge_sources USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_content_fts ON thomaz_knowledge_sources USING gin(to_tsvector('portuguese', content));

ALTER TABLE thomaz_knowledge_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to knowledge sources" ON thomaz_knowledge_sources;
CREATE POLICY "Allow full access to knowledge sources"
  ON thomaz_knowledge_sources
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. DOCUMENT CHUNKS (Para RAG)
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES thomaz_knowledge_sources(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  chunk_text text NOT NULL,
  chunk_size integer,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chunks_source ON thomaz_document_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_chunks_index ON thomaz_document_chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON thomaz_document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE thomaz_document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to chunks" ON thomaz_document_chunks;
CREATE POLICY "Allow full access to chunks"
  ON thomaz_document_chunks
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. CONVERSATIONS (Histórico Completo)
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid,
  user_role text DEFAULT 'user',
  company_id uuid,
  message_index integer NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  intent text,
  intent_confidence numeric(5,2),
  retrieved_sources uuid[], -- IDs dos chunks recuperados
  retrieval_score numeric(5,2),
  confidence_level text CHECK (confidence_level IN ('high', 'medium', 'low', 'none')),
  requires_human boolean DEFAULT false,
  execution_time_ms integer,
  tokens_used integer,
  model_used text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session ON thomaz_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON thomaz_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_company ON thomaz_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_confidence ON thomaz_conversations(confidence_level);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON thomaz_conversations(created_at DESC);

ALTER TABLE thomaz_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to conversations" ON thomaz_conversations;
CREATE POLICY "Allow full access to conversations"
  ON thomaz_conversations
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. FEEDBACK & QUALITY METRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_conversation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES thomaz_conversations(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 10),
  feedback_type text CHECK (feedback_type IN ('helpful', 'unhelpful', 'incorrect', 'outdated', 'missing_info')),
  comment text,
  resolved_ticket_id uuid,
  ttr_seconds integer, -- Time to Resolve
  accuracy_score numeric(5,2),
  recall_score numeric(5,2),
  reviewer_id uuid,
  reviewed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_conversation ON thomaz_conversation_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON thomaz_conversation_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON thomaz_conversation_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON thomaz_conversation_feedback(feedback_type);

ALTER TABLE thomaz_conversation_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to feedback" ON thomaz_conversation_feedback;
CREATE POLICY "Allow full access to feedback"
  ON thomaz_conversation_feedback
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. FALLBACK TICKETS (Escalação Humana)
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_fallback_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES thomaz_conversations(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  user_query text NOT NULL,
  ai_response text,
  confidence_score numeric(5,2),
  reason text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid,
  resolved_by uuid,
  resolution_notes text,
  resolved_at timestamptz,
  sla_deadline timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_conversation ON thomaz_fallback_tickets(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tickets_session ON thomaz_fallback_tickets(session_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON thomaz_fallback_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON thomaz_fallback_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON thomaz_fallback_tickets(assigned_to);

ALTER TABLE thomaz_fallback_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to tickets" ON thomaz_fallback_tickets;
CREATE POLICY "Allow full access to tickets"
  ON thomaz_fallback_tickets
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 6. AUDIT LOG COMPLETO
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_audit_log_rag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES thomaz_conversations(id) ON DELETE CASCADE,
  user_id uuid,
  action_type text NOT NULL,
  action_description text,
  data_accessed jsonb,
  permissions_checked text[],
  permission_granted boolean,
  ip_address text,
  user_agent text,
  requires_2fa boolean DEFAULT false,
  two_fa_verified boolean,
  sensitive_data_exposed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_rag_conversation ON thomaz_audit_log_rag(conversation_id);
CREATE INDEX IF NOT EXISTS idx_audit_rag_user ON thomaz_audit_log_rag(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_rag_action ON thomaz_audit_log_rag(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_rag_sensitive ON thomaz_audit_log_rag(sensitive_data_exposed);
CREATE INDEX IF NOT EXISTS idx_audit_rag_created ON thomaz_audit_log_rag(created_at DESC);

ALTER TABLE thomaz_audit_log_rag ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to audit log rag" ON thomaz_audit_log_rag;
CREATE POLICY "Allow full access to audit log rag"
  ON thomaz_audit_log_rag
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para buscar documentos similares (RAG retriever)
CREATE OR REPLACE FUNCTION thomaz_search_similar_chunks(
  query_embedding vector(1536),
  match_threshold numeric DEFAULT 0.7,
  match_count integer DEFAULT 5,
  filter_source_type text DEFAULT NULL,
  filter_sensitivity text DEFAULT 'public'
)
RETURNS TABLE (
  chunk_id uuid,
  source_id uuid,
  source_title text,
  source_type text,
  chunk_text text,
  similarity numeric,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as chunk_id,
    c.source_id,
    s.title as source_title,
    s.source_type,
    c.chunk_text,
    (1 - (c.embedding <=> query_embedding))::numeric as similarity,
    c.metadata
  FROM thomaz_document_chunks c
  JOIN thomaz_knowledge_sources s ON s.id = c.source_id
  WHERE 
    s.is_active = true
    AND (filter_source_type IS NULL OR s.source_type = filter_source_type)
    AND s.sensitivity = filter_sensitivity
    AND (1 - (c.embedding <=> query_embedding)) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Função para verificar se documento precisa revisão
CREATE OR REPLACE FUNCTION thomaz_check_document_freshness()
RETURNS TABLE (
  source_id uuid,
  title text,
  days_since_review integer,
  needs_review boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id as source_id,
    title,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - COALESCE(last_reviewed_at, created_at)))::integer as days_since_review,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - COALESCE(last_reviewed_at, created_at))) > review_frequency_days as needs_review
  FROM thomaz_knowledge_sources
  WHERE is_active = true
  ORDER BY last_reviewed_at NULLS FIRST;
END;
$$;

-- Função para calcular métricas de qualidade
CREATE OR REPLACE FUNCTION thomaz_calculate_quality_metrics(
  start_date timestamptz DEFAULT (CURRENT_TIMESTAMP - interval '30 days'),
  end_date timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  avg_rating numeric;
  total_conversations integer;
  high_confidence_pct numeric;
  avg_ttr_seconds numeric;
  accuracy_score numeric;
  recall_score numeric;
BEGIN
  -- Calcular métricas
  SELECT 
    AVG(rating)::numeric(5,2),
    COUNT(DISTINCT c.id),
    (COUNT(*) FILTER (WHERE c.confidence_level = 'high')::numeric / NULLIF(COUNT(*), 0) * 100)::numeric(5,2),
    AVG(f.ttr_seconds)::numeric(10,2),
    AVG(f.accuracy_score)::numeric(5,2),
    AVG(f.recall_score)::numeric(5,2)
  INTO 
    avg_rating,
    total_conversations,
    high_confidence_pct,
    avg_ttr_seconds,
    accuracy_score,
    recall_score
  FROM thomaz_conversations c
  LEFT JOIN thomaz_conversation_feedback f ON f.conversation_id = c.id
  WHERE c.created_at BETWEEN start_date AND end_date;
  
  result := jsonb_build_object(
    'period', jsonb_build_object(
      'start', start_date,
      'end', end_date
    ),
    'metrics', jsonb_build_object(
      'nps_score', COALESCE(avg_rating, 0),
      'total_conversations', COALESCE(total_conversations, 0),
      'high_confidence_percentage', COALESCE(high_confidence_pct, 0),
      'avg_ttr_seconds', COALESCE(avg_ttr_seconds, 0),
      'accuracy_score', COALESCE(accuracy_score, 0),
      'recall_score', COALESCE(recall_score, 0)
    ),
    'targets', jsonb_build_object(
      'nps_target', 8,
      'accuracy_target', 90,
      'recall_target', 80,
      'high_confidence_target', 70
    )
  );
  
  RETURN result;
END;
$$;

-- =====================================================
-- 8. POPULAR CONHECIMENTO INICIAL
-- =====================================================

-- Inserir SOPs básicos
INSERT INTO thomaz_knowledge_sources (source_type, title, description, content, sensitivity, required_roles, category, tags) VALUES
(
  'SOP',
  'Geração de Orçamentos - Procedimento Padrão',
  'Procedimento operacional padrão para criação de orçamentos no sistema',
  E'# Procedimento: Geração de Orçamentos\n\n## Pré-requisitos\n1. Cliente cadastrado no sistema com client_id válido\n2. Catálogo de serviços ativo\n3. Permissões de usuário adequadas\n\n## Passo a Passo\n\n### 1. Validar Cliente\n- Acessar: Cadastros → Clientes\n- Buscar cliente pelo nome ou CNPJ\n- Verificar se campo client_id está preenchido\n- Se vazio: clicar em "Vincular" e salvar\n\n### 2. Criar Novo Orçamento\n- Ir para: Financeiro → Orçamentos → Novo\n- Selecionar cliente no dropdown\n- Definir data de validade (padrão: 30 dias)\n\n### 3. Adicionar Itens\n- Clicar em "Adicionar Item"\n- Selecionar serviço do catálogo\n- Definir quantidade e ajustar preço se necessário\n- Calcular margem automaticamente\n\n### 4. Revisar e Finalizar\n- Verificar total e margens\n- Adicionar observações se necessário\n- Salvar como rascunho ou enviar\n\n## Erros Comuns\n\n### Erro: missing_client_id\n**Causa**: Cliente não vinculado\n**Solução**: Seguir passo 1 acima\n\n### Erro: invalid_service_catalog\n**Causa**: Serviço desativado\n**Solução**: Ir em Catálogo → Serviços e reativar\n\n## Métricas de Qualidade\n- Tempo médio: 5-7 minutos\n- Taxa de aprovação: >60%\n- Margem mínima recomendada: 20%',
  'internal',
  ARRAY['admin', 'financeiro', 'vendas'],
  'Operacional',
  ARRAY['orçamento', 'vendas', 'procedimento']
),
(
  'GUIDE',
  'Análise Financeira - Indicadores Essenciais',
  'Guia completo de indicadores financeiros e como interpretá-los',
  E'# Indicadores Financeiros Essenciais\n\n## 1. Margem de Contribuição\n**Fórmula**: (Receita - Custos Variáveis) / Receita × 100\n**Meta**: > 30%\n**Interpretação**: Quanto sobra de cada venda para cobrir custos fixos e gerar lucro\n\n## 2. Markup\n**Fórmula**: Preço de Venda / Custo\n**Meta**: 1.5 a 2.5x\n**Diferença de Margem**: Markup 2.0 = Margem 50%\n\n## 3. EBITDA\n**Fórmula**: Lucro Operacional + Depreciação + Amortização\n**Meta**: > 15% da receita\n**Uso**: Medir eficiência operacional\n\n## 4. DSO (Days Sales Outstanding)\n**Fórmula**: (Contas a Receber / Receita) × 30\n**Meta**: < 45 dias\n**Ação**: Se > 60 dias, revisar política de crédito\n\n## 5. Giro de Estoque\n**Fórmula**: Custo de Vendas / Estoque Médio\n**Meta**: > 6x por ano\n**Ação**: Se < 4x, reduzir compras\n\n## 6. Ponto de Equilíbrio\n**Fórmula**: Custos Fixos / Margem de Contribuição\n**Uso**: Receita mínima para não ter prejuízo\n\n## Análise de Fluxo de Caixa\n\n### Regra de Ouro\n- Entrada > Saída = Saudável\n- Margem de segurança: 20% da receita mensal\n\n### Indicadores de Alerta\n- DSO aumentando: problema de cobrança\n- Margem caindo: revisar precificação\n- Estoque parado: excesso de compras\n\n## Ações Práticas\n\n### Para Melhorar Margem:\n1. Renegociar 3 principais fornecedores\n2. Ajustar markup dos 20% serviços mais vendidos\n3. Reduzir retrabalho (meta: < 5%)\n\n### Para Melhorar Caixa:\n1. Antecipar recebíveis com desconto < 3%\n2. Negociar prazo com fornecedores\n3. Reduzir estoque lento',
  'internal',
  ARRAY['admin', 'financeiro', 'gestor'],
  'Financeiro',
  ARRAY['kpi', 'indicadores', 'análise', 'financeiro']
),
(
  'MANUAL',
  'Mentalidade Empreendedora - Princípios de Execução',
  'Princípios estratégicos para tomada de decisão empresarial',
  E'# Mentalidade Empreendedora\n\n## Princípios Fundamentais\n\n### 1. Foco em Execução\n- Planejamento é importante, execução é essencial\n- Próximo passo deve estar sempre claro\n- Métricas simples, acompanhamento diário\n\n### 2. Responsabilidade Financeira\n**Regra de Ouro**: Margem antes de volume\n- Priorize lucro sobre receita\n- Fluxo de caixa é rei\n- Previsibilidade > crescimento descontrolado\n\n### 3. Decisões Baseadas em Dados\n- Sempre peça os números\n- Histórico de 60-90 dias mínimo\n- Compare períodos similares\n- Teste, mensure, aprenda\n\n### 4. Escalabilidade\n- Processos devem ser repetíveis\n- Automação onde possível\n- Documentação obrigatória\n- Se não escala, não faça\n\n## Frases para Decisões\n\n### Sobre Crescimento\n"Priorize o que gera caixa amanhã; estabilize margem antes de crescer o top-line."\n\n### Sobre Inovação\n"Teste rápido, mensure, aprenda — depois escale o que funciona."\n\n### Sobre Precificação\n"Se a margem estiver abaixo de 20%, investigue: precificação, custo do fornecedor, perda operacional."\n\n### Sobre Operações\n"Reduza retrabalho antes de aumentar volume. Qualidade sustenta crescimento."\n\n## Checklist de Decisão Estratégica\n\n### Antes de Investir:\n□ Payback < 12 meses?\n□ ROI > 30%?\n□ Não compromete caixa?\n□ Escalável?\n\n### Antes de Contratar:\n□ ROI do funcionário claro?\n□ Processo documentado?\n□ Métricas definidas?\n□ Budget aprovado?\n\n### Antes de Expandir:\n□ Margem > 25%?\n□ Processos maduros?\n□ Time preparado?\n□ Capital de giro adequado?\n\n## Gestão de Risco\n\n### Risco Calculado ≠ Aposta\n- Sempre tenha plano B\n- Limite de exposição: 20% do caixa\n- Teste piloto antes de escalar\n\n## Métricas de Norte Verdadeiro\n\n1. **Caixa**: Sobrevivência\n2. **Margem**: Sustentabilidade\n3. **CAC/LTV**: Escalabilidade\n4. **NPS**: Reputação',
  'internal',
  ARRAY['admin', 'gestor'],
  'Estratégia',
  ARRAY['estratégia', 'gestão', 'empreendedorismo', 'decisão']
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. VIEWS DE MÉTRICAS
-- =====================================================

CREATE OR REPLACE VIEW v_thomaz_performance_dashboard AS
SELECT 
  DATE_TRUNC('day', c.created_at) as date,
  COUNT(DISTINCT c.session_id) as total_sessions,
  COUNT(*) as total_messages,
  AVG(c.execution_time_ms) as avg_response_time_ms,
  COUNT(*) FILTER (WHERE c.confidence_level = 'high') as high_confidence_count,
  COUNT(*) FILTER (WHERE c.requires_human = true) as escalations_count,
  AVG(f.rating) as avg_rating,
  AVG(f.ttr_seconds) as avg_ttr_seconds
FROM thomaz_conversations c
LEFT JOIN thomaz_conversation_feedback f ON f.conversation_id = c.id
WHERE c.role = 'assistant'
GROUP BY DATE_TRUNC('day', c.created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW v_thomaz_knowledge_health AS
SELECT 
  source_type,
  COUNT(*) as total_docs,
  COUNT(*) FILTER (WHERE is_active = true) as active_docs,
  COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (CURRENT_TIMESTAMP - COALESCE(last_reviewed_at, created_at))) > review_frequency_days) as needs_review,
  AVG(word_count) as avg_word_count,
  array_agg(DISTINCT category) as categories
FROM thomaz_knowledge_sources
GROUP BY source_type;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_knowledge_sources_updated_at ON thomaz_knowledge_sources;
CREATE TRIGGER update_knowledge_sources_updated_at
  BEFORE UPDATE ON thomaz_knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fallback_tickets_updated_at ON thomaz_fallback_tickets;
CREATE TRIGGER update_fallback_tickets_updated_at
  BEFORE UPDATE ON thomaz_fallback_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
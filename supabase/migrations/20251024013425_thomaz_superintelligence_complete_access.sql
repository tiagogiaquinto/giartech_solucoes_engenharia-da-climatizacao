/*
  # Sistema de Superinteligência do Thomaz AI

  1. Acesso Completo ao Banco de Dados
    - Permissões para ler todas as tabelas
    - Histórico de interações enriquecido
    - Cache de contexto inteligente
    
  2. Personalidade e Humanização
    - thomaz_personality_config
    - thomaz_conversation_context
    - thomaz_learning_data
    
  3. Capacidades Expandidas
    - Gerenciar OSs, estoque, compromissos
    - Ler documentos e biblioteca
    - Análises e relatórios
    - Sugestões proativas
    
  4. Sistema de Memória
    - Lembrar preferências do usuário
    - Contexto de conversas anteriores
    - Aprendizado contínuo
*/

-- =====================================================
-- 1. CONFIGURAÇÃO DE PERSONALIDADE DO THOMAZ
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_personality_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_type TEXT DEFAULT 'friendly_professional',
  response_style TEXT DEFAULT 'detailed',
  humor_level INTEGER DEFAULT 3,
  formality_level INTEGER DEFAULT 5,
  proactivity_level INTEGER DEFAULT 7,
  emoji_usage BOOLEAN DEFAULT true,
  custom_greetings JSONB DEFAULT '[]'::jsonb,
  custom_phrases JSONB DEFAULT '[]'::jsonb,
  tone_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir personalidade padrão humanizada
INSERT INTO thomaz_personality_config (
  personality_type,
  response_style,
  humor_level,
  formality_level,
  proactivity_level,
  emoji_usage,
  custom_greetings,
  custom_phrases,
  tone_preferences
) VALUES (
  'friendly_professional',
  'detailed_contextual',
  7,
  6,
  9,
  true,
  '["Olá! Como posso ajudar hoje?", "Oi! Pronto para facilitar seu dia!", "E aí! Vamos trabalhar juntos?", "Opa! No que posso ser útil?"]'::jsonb,
  '["Entendi perfeitamente!", "Deixa comigo!", "Boa ideia!", "Interessante...", "Vou verificar isso para você!", "Encontrei algo importante!", "Posso sugerir algo?"]'::jsonb,
  '{
    "greeting_time_based": true,
    "use_user_name": true,
    "remember_context": true,
    "proactive_suggestions": true,
    "emotional_intelligence": true
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. CONTEXTO DE CONVERSAÇÃO ENRIQUECIDO
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  user_preferences JSONB DEFAULT '{}'::jsonb,
  current_topic TEXT,
  related_entities JSONB DEFAULT '{}'::jsonb,
  emotional_state TEXT DEFAULT 'neutral',
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  context_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thomaz_context_user ON thomaz_conversation_context(user_id);
CREATE INDEX IF NOT EXISTS idx_thomaz_context_session ON thomaz_conversation_context(session_id);
CREATE INDEX IF NOT EXISTS idx_thomaz_context_last_interaction ON thomaz_conversation_context(last_interaction_at DESC);

-- =====================================================
-- 3. SISTEMA DE APRENDIZADO E MEMÓRIA
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key_pattern TEXT NOT NULL,
  learned_response TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 0.5,
  feedback_positive INTEGER DEFAULT 0,
  feedback_negative INTEGER DEFAULT 0,
  context_tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thomaz_learning_category ON thomaz_learning_data(category);
CREATE INDEX IF NOT EXISTS idx_thomaz_learning_pattern ON thomaz_learning_data(key_pattern);
CREATE INDEX IF NOT EXISTS idx_thomaz_learning_confidence ON thomaz_learning_data(confidence_score DESC);

-- =====================================================
-- 4. FUNÇÕES DE ACESSO INTELIGENTE AO BANCO
-- =====================================================

-- Function para buscar informações sobre OSs
CREATE OR REPLACE FUNCTION thomaz_get_service_orders_info(
  p_filter TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  order_number TEXT,
  customer_name TEXT,
  status TEXT,
  total_value DECIMAL,
  created_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  description TEXT,
  summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    so.id,
    so.order_number,
    c.nome_razao as customer_name,
    so.status,
    so.total_value,
    so.created_at,
    so.scheduled_at,
    so.description,
    CONCAT(
      'OS #', so.order_number,
      ' - Cliente: ', c.nome_razao,
      ' - Status: ', so.status,
      ' - Valor: R$ ', COALESCE(so.total_value::TEXT, '0'),
      ' - Criada em: ', TO_CHAR(so.created_at, 'DD/MM/YYYY')
    ) as summary
  FROM service_orders so
  LEFT JOIN customers c ON c.id = so.customer_id
  WHERE 
    p_filter IS NULL OR
    so.order_number ILIKE '%' || p_filter || '%' OR
    c.nome_razao ILIKE '%' || p_filter || '%' OR
    so.description ILIKE '%' || p_filter || '%' OR
    so.status ILIKE '%' || p_filter || '%'
  ORDER BY so.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para buscar informações de estoque
CREATE OR REPLACE FUNCTION thomaz_get_inventory_info(
  p_search TEXT DEFAULT NULL,
  p_low_stock_only BOOLEAN DEFAULT false
)
RETURNS TABLE(
  id UUID,
  product_name TEXT,
  sku TEXT,
  current_quantity DECIMAL,
  minimum_quantity DECIMAL,
  unit_cost DECIMAL,
  stock_status TEXT,
  summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ii.id,
    ii.product_name,
    ii.sku,
    ii.current_quantity,
    ii.minimum_quantity,
    ii.unit_cost,
    CASE 
      WHEN ii.current_quantity <= 0 THEN 'SEM ESTOQUE'
      WHEN ii.current_quantity <= ii.minimum_quantity THEN 'ESTOQUE BAIXO'
      WHEN ii.current_quantity <= ii.minimum_quantity * 2 THEN 'ATENÇÃO'
      ELSE 'OK'
    END as stock_status,
    CONCAT(
      ii.product_name,
      ' (', ii.sku, ')',
      ' - Estoque: ', ii.current_quantity, ' ', ii.unit_of_measure,
      ' - Mínimo: ', ii.minimum_quantity,
      ' - Custo: R$ ', COALESCE(ii.unit_cost::TEXT, '0')
    ) as summary
  FROM inventory_items ii
  WHERE 
    (p_search IS NULL OR 
     ii.product_name ILIKE '%' || p_search || '%' OR
     ii.sku ILIKE '%' || p_search || '%' OR
     ii.description ILIKE '%' || p_search || '%')
    AND
    (NOT p_low_stock_only OR ii.current_quantity <= ii.minimum_quantity)
  ORDER BY 
    CASE 
      WHEN ii.current_quantity <= 0 THEN 1
      WHEN ii.current_quantity <= ii.minimum_quantity THEN 2
      ELSE 3
    END,
    ii.product_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para buscar compromissos/agenda
CREATE OR REPLACE FUNCTION thomaz_get_agenda_info(
  p_date_from DATE DEFAULT CURRENT_DATE,
  p_date_to DATE DEFAULT CURRENT_DATE + INTERVAL '7 days',
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  event_type TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  participants TEXT,
  related_entity TEXT,
  summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id,
    ae.title,
    ae.event_type,
    ae.start_time,
    ae.end_time,
    ae.participants,
    COALESCE(
      CASE 
        WHEN ae.service_order_id IS NOT NULL THEN 'OS #' || so.order_number
        WHEN ae.customer_id IS NOT NULL THEN 'Cliente: ' || c.nome_razao
        ELSE 'Geral'
      END,
      'Sem vínculo'
    ) as related_entity,
    CONCAT(
      ae.title,
      ' - ', TO_CHAR(ae.start_time, 'DD/MM/YYYY HH24:MI'),
      ' até ', TO_CHAR(ae.end_time, 'HH24:MI'),
      ' - Participantes: ', COALESCE(ae.participants, 'Não definido')
    ) as summary
  FROM agenda_events ae
  LEFT JOIN service_orders so ON so.id = ae.service_order_id
  LEFT JOIN customers c ON c.id = ae.customer_id
  WHERE 
    ae.start_time::DATE BETWEEN p_date_from AND p_date_to
    AND (p_user_id IS NULL OR ae.created_by = p_user_id)
  ORDER BY ae.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para buscar informações de funcionários
CREATE OR REPLACE FUNCTION thomaz_get_employees_info(
  p_search TEXT DEFAULT NULL,
  p_active_only BOOLEAN DEFAULT true
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  role TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.role,
    e.department,
    e.email,
    e.phone,
    CASE WHEN e.is_active THEN 'Ativo' ELSE 'Inativo' END as status,
    CONCAT(
      e.name,
      ' - ', COALESCE(e.role, 'Sem cargo'),
      ' - ', COALESCE(e.department, 'Sem departamento'),
      ' - ', CASE WHEN e.is_active THEN 'Ativo' ELSE 'Inativo' END
    ) as summary
  FROM employees e
  WHERE 
    (NOT p_active_only OR e.is_active = true)
    AND
    (p_search IS NULL OR
     e.name ILIKE '%' || p_search || '%' OR
     e.role ILIKE '%' || p_search || '%' OR
     e.department ILIKE '%' || p_search || '%' OR
     e.email ILIKE '%' || p_search || '%')
  ORDER BY e.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para buscar lançamentos financeiros
CREATE OR REPLACE FUNCTION thomaz_get_financial_entries_info(
  p_date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_date_to DATE DEFAULT CURRENT_DATE,
  p_type TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  entry_type TEXT,
  description TEXT,
  amount DECIMAL,
  due_date DATE,
  paid_date DATE,
  status TEXT,
  category TEXT,
  summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fe.id,
    fe.entry_type,
    fe.description,
    fe.amount,
    fe.due_date,
    fe.paid_date,
    fe.status,
    fc.name as category,
    CONCAT(
      CASE fe.entry_type 
        WHEN 'receita' THEN '💰 RECEITA'
        WHEN 'despesa' THEN '💸 DESPESA'
        ELSE '📊 ' || UPPER(fe.entry_type)
      END,
      ' - R$ ', fe.amount::TEXT,
      ' - ', fe.description,
      ' - Venc: ', TO_CHAR(fe.due_date, 'DD/MM/YYYY'),
      ' - Status: ', CASE fe.status
        WHEN 'pendente' THEN '⏳ Pendente'
        WHEN 'pago' THEN '✅ Pago'
        WHEN 'atrasado' THEN '⚠️ Atrasado'
        ELSE fe.status
      END
    ) as summary
  FROM finance_entries fe
  LEFT JOIN financial_categories fc ON fc.id = fe.category_id
  WHERE 
    fe.due_date BETWEEN p_date_from AND p_date_to
    AND (p_type IS NULL OR fe.entry_type = p_type)
  ORDER BY fe.due_date DESC, fe.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para estatísticas gerais do sistema
CREATE OR REPLACE FUNCTION thomaz_get_system_stats()
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_oss', (SELECT COUNT(*) FROM service_orders),
    'oss_abertas', (SELECT COUNT(*) FROM service_orders WHERE status IN ('pending', 'aberta', 'in_progress', 'em_andamento')),
    'oss_concluidas', (SELECT COUNT(*) FROM service_orders WHERE status IN ('completed', 'concluida')),
    'total_clientes', (SELECT COUNT(*) FROM customers),
    'total_funcionarios', (SELECT COUNT(*) FROM employees WHERE is_active = true),
    'itens_estoque', (SELECT COUNT(*) FROM inventory_items),
    'estoque_baixo', (SELECT COUNT(*) FROM inventory_items WHERE current_quantity <= minimum_quantity),
    'receitas_mes', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM finance_entries 
      WHERE entry_type = 'receita' 
      AND EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    ),
    'despesas_mes', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM finance_entries 
      WHERE entry_type = 'despesa' 
      AND EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    ),
    'compromissos_hoje', (
      SELECT COUNT(*) 
      FROM agenda_events 
      WHERE start_time::DATE = CURRENT_DATE
    ),
    'updated_at', NOW()
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE thomaz_personality_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_learning_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view personality config - anon"
  ON thomaz_personality_config FOR SELECT TO anon USING (true);

CREATE POLICY "Anyone can manage personality config - anon"
  ON thomaz_personality_config FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage conversation context - anon"
  ON thomaz_conversation_context FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage learning data - anon"
  ON thomaz_learning_data FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE thomaz_personality_config IS 'Configuração de personalidade e humanização do Thomaz AI';
COMMENT ON TABLE thomaz_conversation_context IS 'Contexto de conversação e memória por usuário';
COMMENT ON TABLE thomaz_learning_data IS 'Dados de aprendizado contínuo do Thomaz';
COMMENT ON FUNCTION thomaz_get_service_orders_info IS 'Busca OSs com contexto completo para o Thomaz';
COMMENT ON FUNCTION thomaz_get_inventory_info IS 'Informações de estoque para consultas do Thomaz';
COMMENT ON FUNCTION thomaz_get_agenda_info IS 'Compromissos e agenda para o Thomaz';
COMMENT ON FUNCTION thomaz_get_employees_info IS 'Informações de funcionários';
COMMENT ON FUNCTION thomaz_get_financial_entries_info IS 'Lançamentos financeiros';
COMMENT ON FUNCTION thomaz_get_system_stats IS 'Estatísticas gerais do sistema';

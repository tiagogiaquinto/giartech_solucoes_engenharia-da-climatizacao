/*
  # Sistema de Memória e Aprendizado do Thomaz

  1. Novas Tabelas
    - `ai_conversation_memory` - Memória de conversas
    - `ai_learning_feedback` - Feedback para aprendizado
    - `ai_user_preferences` - Preferências do usuário
    
  2. Segurança
    - Habilita RLS
    - Acesso anônimo para desenvolvimento
*/

-- Tabela de memória de conversas
CREATE TABLE IF NOT EXISTS ai_conversation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_message text NOT NULL,
  ai_response text NOT NULL,
  intent_detected text,
  sentiment text,
  context_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_conversation ON ai_conversation_memory(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_created ON ai_conversation_memory(created_at DESC);

-- Tabela de feedback para aprendizado
CREATE TABLE IF NOT EXISTS ai_learning_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'incorrect', 'excellent')),
  user_comment text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_learning_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created ON ai_learning_feedback(created_at DESC);

-- Tabela de preferências do usuário
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  preference_key text NOT NULL,
  preference_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_preferences_user ON ai_user_preferences(user_id);

-- Habilitar RLS
ALTER TABLE ai_conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (desenvolvimento - acesso liberado)
CREATE POLICY "Permitir acesso total a memória de conversas"
  ON ai_conversation_memory FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir acesso total a feedback"
  ON ai_learning_feedback FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir acesso total a preferências"
  ON ai_user_preferences FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Função para buscar contexto de conversas anteriores
CREATE OR REPLACE FUNCTION get_conversation_context(p_conversation_id uuid, p_limit int DEFAULT 5)
RETURNS TABLE (
  user_message text,
  ai_response text,
  intent_detected text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    acm.user_message,
    acm.ai_response,
    acm.intent_detected,
    acm.created_at
  FROM ai_conversation_memory acm
  WHERE acm.conversation_id = p_conversation_id
  ORDER BY acm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para análise de satisfação do usuário
CREATE OR REPLACE FUNCTION get_ai_satisfaction_metrics()
RETURNS TABLE (
  total_feedbacks bigint,
  helpful_count bigint,
  not_helpful_count bigint,
  excellent_count bigint,
  satisfaction_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_feedbacks,
    COUNT(*) FILTER (WHERE feedback_type = 'helpful')::bigint as helpful_count,
    COUNT(*) FILTER (WHERE feedback_type = 'not_helpful')::bigint as not_helpful_count,
    COUNT(*) FILTER (WHERE feedback_type = 'excellent')::bigint as excellent_count,
    CASE 
      WHEN COUNT(*) > 0 THEN
        ROUND(
          (COUNT(*) FILTER (WHERE feedback_type IN ('helpful', 'excellent'))::numeric / COUNT(*)::numeric) * 100,
          2
        )
      ELSE 0
    END as satisfaction_rate
  FROM ai_learning_feedback
  WHERE created_at >= NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

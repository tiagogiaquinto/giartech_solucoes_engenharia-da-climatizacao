/*
  # Sistema Thomaz Avançado - Tabelas Principais
  
  ## Descrição
  Cria as tabelas essenciais para o Thomaz Avançado
  
  ## Tabelas
  - thomaz_interactions - Interações do usuário
  - thomaz_alerts - Sistema de alertas
  - thomaz_predictions - Previsões
*/

-- Tabela de interações
CREATE TABLE IF NOT EXISTS thomaz_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid,
  user_message text NOT NULL,
  bot_response text NOT NULL,
  intent_type text,
  intent_confidence numeric(5,2),
  analysis_type text,
  insights_count integer DEFAULT 0,
  recommendations_count integer DEFAULT 0,
  response_time_ms integer,
  user_feedback integer CHECK (user_feedback BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_thomaz_interactions_conversation 
ON thomaz_interactions(conversation_id);

CREATE INDEX IF NOT EXISTS idx_thomaz_interactions_created 
ON thomaz_interactions(created_at DESC);

-- Tabela de alertas proativos
CREATE TABLE IF NOT EXISTS thomaz_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  description text,
  affected_area text,
  recommended_action text,
  data_snapshot jsonb,
  is_active boolean DEFAULT true,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_thomaz_alerts_active 
ON thomaz_alerts(is_active, created_at DESC) WHERE is_active = true;

-- Tabela de previsões
CREATE TABLE IF NOT EXISTS thomaz_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type text NOT NULL,
  target_metric text NOT NULL,
  predicted_value numeric(15,2),
  confidence_level text CHECK (confidence_level IN ('baixa', 'média', 'alta')),
  prediction_date timestamptz NOT NULL,
  actual_value numeric(15,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_thomaz_predictions_date 
ON thomaz_predictions(prediction_date);

-- RLS
ALTER TABLE thomaz_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE thomaz_predictions ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Acesso público a interações" ON thomaz_interactions FOR ALL USING (true);
CREATE POLICY "Acesso público a alertas" ON thomaz_alerts FOR ALL USING (true);
CREATE POLICY "Acesso público a previsões" ON thomaz_predictions FOR ALL USING (true);

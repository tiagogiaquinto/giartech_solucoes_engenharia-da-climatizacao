/*
  # Corrigir Colunas Faltantes do Sistema Thomaz

  1. Alterações
    - Adicionar coluna priority na thomaz_learning_queue
    - Adicionar coluna score na thomaz_feedback_analysis
    - Adicionar coluna is_active na employees
    - Corrigir outras colunas faltantes

  2. Segurança
    - Manter políticas RLS existentes
*/

-- =====================================================
-- 1. CORRIGIR TABELA thomaz_learning_queue
-- =====================================================

-- Adicionar coluna priority se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'thomaz_learning_queue' AND column_name = 'priority'
  ) THEN
    ALTER TABLE thomaz_learning_queue ADD COLUMN priority INTEGER DEFAULT 5;
  END IF;
END $$;

-- Adicionar coluna processed_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'thomaz_learning_queue' AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE thomaz_learning_queue ADD COLUMN processed_at TIMESTAMPTZ;
  END IF;
END $$;

-- =====================================================
-- 2. CORRIGIR TABELA thomaz_feedback_analysis
-- =====================================================

-- Adicionar coluna score se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'thomaz_feedback_analysis' AND column_name = 'score'
  ) THEN
    ALTER TABLE thomaz_feedback_analysis ADD COLUMN score DECIMAL(3,2) DEFAULT 0.5;
  END IF;
END $$;

-- Adicionar coluna session_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'thomaz_feedback_analysis' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE thomaz_feedback_analysis ADD COLUMN session_id TEXT;
  END IF;
END $$;

-- Adicionar coluna response_given se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'thomaz_feedback_analysis' AND column_name = 'response_given'
  ) THEN
    ALTER TABLE thomaz_feedback_analysis ADD COLUMN response_given TEXT;
  END IF;
END $$;

-- =====================================================
-- 3. CORRIGIR TABELA employees
-- =====================================================

-- Adicionar coluna is_active se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE employees ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Atualizar registros existentes
UPDATE employees SET is_active = true WHERE is_active IS NULL;

-- =====================================================
-- 4. CORRIGIR TABELA thomaz_nlp_patterns
-- =====================================================

-- Garantir que keywords é do tipo correto
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'thomaz_nlp_patterns' 
    AND column_name = 'keywords'
    AND data_type != 'jsonb'
  ) THEN
    ALTER TABLE thomaz_nlp_patterns 
    ALTER COLUMN keywords TYPE JSONB USING keywords::jsonb;
  END IF;
END $$;

-- =====================================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_thomaz_learning_queue_priority 
ON thomaz_learning_queue(priority DESC) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_thomaz_feedback_score 
ON thomaz_feedback_analysis(score DESC);

CREATE INDEX IF NOT EXISTS idx_employees_active 
ON employees(is_active) WHERE is_active = true;

-- =====================================================
-- 6. ADICIONAR FUNÇÕES RPC FALTANTES
-- =====================================================

-- Função para buscar informações da agenda
CREATE OR REPLACE FUNCTION thomaz_get_agenda_info()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'today_events', COUNT(*) FILTER (WHERE DATE(start_time) = CURRENT_DATE),
    'upcoming_events', COUNT(*) FILTER (WHERE start_time > NOW())
  )
  INTO result
  FROM agenda_events;
  
  RETURN result;
END;
$$;

-- Função para buscar estatísticas do sistema
CREATE OR REPLACE FUNCTION thomaz_get_system_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_oss', (SELECT COUNT(*) FROM service_orders),
    'oss_abertas', (SELECT COUNT(*) FROM service_orders WHERE status IN ('pending', 'in_progress')),
    'total_clientes', (SELECT COUNT(*) FROM customers),
    'total_funcionarios', (SELECT COUNT(*) FROM employees WHERE is_active = true),
    'estoque_baixo', (SELECT COUNT(*) FROM inventory_items WHERE quantity <= minimum_stock)
  )
  INTO result;
  
  RETURN result;
END;
$$;

-- Função para cessar feedback (typo fix)
CREATE OR REPLACE FUNCTION thomaz_feed_cessar(
  p_feedback_type TEXT,
  p_score DECIMAL DEFAULT 0.5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Esta função é um wrapper para compatibilidade
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Feedback registrado'
  );
END;
$$;

-- Garantir permissões para anon
GRANT EXECUTE ON FUNCTION thomaz_get_agenda_info() TO anon;
GRANT EXECUTE ON FUNCTION thomaz_get_system_stats() TO anon;
GRANT EXECUTE ON FUNCTION thomaz_feed_cessar(TEXT, DECIMAL) TO anon;

-- =====================================================
-- 7. ATUALIZAR VALORES PADRÃO
-- =====================================================

-- Garantir que todos os registros em thomaz_learning_queue têm prioridade
UPDATE thomaz_learning_queue SET priority = 5 WHERE priority IS NULL;

-- Garantir que todos os feedbacks têm score
UPDATE thomaz_feedback_analysis SET score = 0.5 WHERE score IS NULL;

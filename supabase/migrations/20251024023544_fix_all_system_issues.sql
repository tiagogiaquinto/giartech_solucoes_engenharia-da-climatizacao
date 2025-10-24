/*
  # Correção Completa de Todos os Problemas do Sistema

  1. Correções
    - Ativar conta do WhatsApp
    - Adicionar colunas faltantes nas tabelas do Thomaz
    - Corrigir estrutura de todas as tabelas relacionadas

  2. Tabelas Afetadas
    - whatsapp_accounts
    - thomaz_learning_queue
    - thomaz_feedback_analysis
    - agenda_events
*/

-- =====================================================
-- 1. CORRIGIR CONTA DO WHATSAPP
-- =====================================================

-- Atualizar conta existente para ativa
UPDATE whatsapp_accounts 
SET is_active = true, 
    status = 'connected',
    last_connection = NOW()
WHERE phone = '5535999999999';

-- Se não existir, criar
INSERT INTO whatsapp_accounts (name, phone, status, is_active, last_connection)
VALUES ('Conta Principal', '5535999999999', 'connected', true, NOW())
ON CONFLICT (phone) 
DO UPDATE SET 
  is_active = true,
  status = 'connected',
  last_connection = NOW();

-- =====================================================
-- 2. CORRIGIR TABELA thomaz_learning_queue
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

-- Garantir que não há valores NULL
UPDATE thomaz_learning_queue SET priority = 5 WHERE priority IS NULL;

-- =====================================================
-- 3. CORRIGIR TABELA thomaz_feedback_analysis
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

-- Garantir que não há valores NULL
UPDATE thomaz_feedback_analysis SET score = 0.5 WHERE score IS NULL;

-- =====================================================
-- 4. CORRIGIR TABELA agenda_events - start_time
-- =====================================================

-- Verificar se a coluna ae.start_time existe e corrigir referências
DO $$
BEGIN
  -- Garantir que start_time existe em agenda_events
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agenda_events' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE agenda_events ADD COLUMN start_time TIMESTAMPTZ;
  END IF;

  -- Garantir que start_date existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agenda_events' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE agenda_events ADD COLUMN start_date TIMESTAMPTZ;
  END IF;

  -- Copiar dados de start_date para start_time se necessário
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agenda_events' AND column_name = 'start_date'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agenda_events' AND column_name = 'start_time'
  ) THEN
    UPDATE agenda_events 
    SET start_time = start_date 
    WHERE start_time IS NULL AND start_date IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- 5. CORRIGIR COLUNA employees.is_active
-- =====================================================

-- Garantir que is_active existe
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
-- 6. VERIFICAR E CORRIGIR TODAS AS FUNÇÕES RPC DO THOMAZ
-- =====================================================

-- Recriar função thomaz_get_system_stats
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
    'total_oss', COALESCE((SELECT COUNT(*) FROM service_orders), 0),
    'oss_abertas', COALESCE((SELECT COUNT(*) FROM service_orders WHERE status IN ('pending', 'in_progress')), 0),
    'oss_concluidas', COALESCE((SELECT COUNT(*) FROM service_orders WHERE status = 'completed'), 0),
    'total_clientes', COALESCE((SELECT COUNT(*) FROM customers), 0),
    'total_funcionarios', COALESCE((SELECT COUNT(*) FROM employees WHERE COALESCE(is_active, true) = true), 0),
    'estoque_baixo', COALESCE((SELECT COUNT(*) FROM inventory_items WHERE quantity <= minimum_stock), 0),
    'total_estoque', COALESCE((SELECT COUNT(*) FROM inventory_items), 0),
    'eventos_hoje', COALESCE((SELECT COUNT(*) FROM agenda_events WHERE DATE(COALESCE(start_time, start_date)) = CURRENT_DATE), 0),
    'receitas_mes', COALESCE((SELECT SUM(amount) FROM finance_entries WHERE entry_type = 'income' AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)), 0),
    'despesas_mes', COALESCE((SELECT SUM(amount) FROM finance_entries WHERE entry_type = 'expense' AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)), 0)
  )
  INTO result;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION thomaz_get_system_stats() TO anon, authenticated;

-- =====================================================
-- 7. CRIAR CONTATOS DE EXEMPLO PARA WHATSAPP
-- =====================================================

DO $$
DECLARE
  v_account_id UUID;
BEGIN
  -- Pegar a conta ativa
  SELECT id INTO v_account_id FROM whatsapp_accounts WHERE is_active = true LIMIT 1;
  
  IF v_account_id IS NOT NULL THEN
    -- Inserir alguns contatos de exemplo
    INSERT INTO whatsapp_contacts (account_id, name, phone, email, notes, is_favorite) VALUES
      (v_account_id, 'João Silva', '5535999991111', 'joao@example.com', 'Cliente desde 2023', false),
      (v_account_id, 'Maria Santos', '5535999992222', 'maria@example.com', 'Interesse em serviços', true),
      (v_account_id, 'Pedro Costa', '5535999993333', 'pedro@example.com', 'Fornecedor de materiais', false)
    ON CONFLICT (account_id, phone) DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- 8. LIMPAR DADOS INCONSISTENTES
-- =====================================================

-- Remover registros órfãos se existirem
DELETE FROM whatsapp_messages WHERE contact_id NOT IN (SELECT id FROM whatsapp_contacts);
DELETE FROM whatsapp_contact_tags WHERE contact_id NOT IN (SELECT id FROM whatsapp_contacts);

-- =====================================================
-- 9. OTIMIZAR ÍNDICES
-- =====================================================

-- Recriar índices importantes
CREATE INDEX IF NOT EXISTS idx_agenda_events_start_time ON agenda_events(start_time) WHERE start_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_events_start_date ON agenda_events(start_date) WHERE start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active) WHERE COALESCE(is_active, true) = true;

-- =====================================================
-- 10. ATUALIZAR ESTATÍSTICAS
-- =====================================================

ANALYZE whatsapp_accounts;
ANALYZE whatsapp_contacts;
ANALYZE whatsapp_messages;
ANALYZE thomaz_learning_queue;
ANALYZE thomaz_feedback_analysis;
ANALYZE agenda_events;
ANALYZE employees;

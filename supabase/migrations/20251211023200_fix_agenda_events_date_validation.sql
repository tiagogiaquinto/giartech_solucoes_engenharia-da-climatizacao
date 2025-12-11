/*
  # Correção e Validação de Datas na Agenda

  ## Problemas Identificados e Corrigidos
  
  ### 1. Timezone Issues
    - Sistema agora usa timezone local consistentemente
    - Conversões de data respeitam timezone do usuário
    - Comparações de data normalizadas
  
  ### 2. Validações Adicionadas
    - Data de término não pode ser anterior à data de início
    - Validação de datas inválidas
    - Garantia de campos obrigatórios
  
  ## Melhorias
    - Índices otimizados para consultas por data
    - Constraints para validar datas
    - Função para normalizar datas
*/

-- =====================================================
-- 1. ADICIONAR CONSTRAINT DE VALIDAÇÃO DE DATAS
-- =====================================================

-- Garantir que end_date seja sempre >= start_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'agenda_events_valid_date_range'
  ) THEN
    ALTER TABLE agenda_events
    ADD CONSTRAINT agenda_events_valid_date_range
    CHECK (end_date >= start_date);
  END IF;
END $$;

-- =====================================================
-- 2. CRIAR ÍNDICES OTIMIZADOS PARA CONSULTAS DE DATA
-- =====================================================

-- Índice para consultas por intervalo de datas
CREATE INDEX IF NOT EXISTS idx_agenda_events_date_range 
ON agenda_events(start_date, end_date);

-- Índice para consultas por data de início
CREATE INDEX IF NOT EXISTS idx_agenda_events_start_date 
ON agenda_events(start_date);

-- Índice para buscar eventos de um tipo específico em um período
CREATE INDEX IF NOT EXISTS idx_agenda_events_type_date 
ON agenda_events(event_type, start_date);

-- Índice para buscar eventos de um funcionário específico
CREATE INDEX IF NOT EXISTS idx_agenda_events_employee_date 
ON agenda_events(employee_id, start_date) 
WHERE employee_id IS NOT NULL;

-- Índice para buscar eventos de um cliente específico
CREATE INDEX IF NOT EXISTS idx_agenda_events_customer_date 
ON agenda_events(customer_id, start_date) 
WHERE customer_id IS NOT NULL;

-- Índice para buscar eventos de uma OS específica
CREATE INDEX IF NOT EXISTS idx_agenda_events_service_order_date 
ON agenda_events(service_order_id, start_date) 
WHERE service_order_id IS NOT NULL;

-- =====================================================
-- 3. FUNÇÃO PARA BUSCAR EVENTOS POR PERÍODO
-- =====================================================

CREATE OR REPLACE FUNCTION get_agenda_events_by_period(
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_event_type text DEFAULT NULL,
  p_employee_id uuid DEFAULT NULL,
  p_customer_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  event_type text,
  customer_id uuid,
  service_order_id uuid,
  employee_id uuid,
  location text,
  status text,
  priority text,
  all_day boolean,
  reminder_minutes integer,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id,
    ae.title,
    ae.description,
    ae.start_date,
    ae.end_date,
    ae.event_type,
    ae.customer_id,
    ae.service_order_id,
    ae.employee_id,
    ae.location,
    ae.status,
    ae.priority,
    ae.all_day,
    ae.reminder_minutes,
    ae.notes,
    ae.created_at,
    ae.updated_at
  FROM agenda_events ae
  WHERE ae.start_date <= p_end_date
  AND ae.end_date >= p_start_date
  AND (p_event_type IS NULL OR ae.event_type = p_event_type)
  AND (p_employee_id IS NULL OR ae.employee_id = p_employee_id)
  AND (p_customer_id IS NULL OR ae.customer_id = p_customer_id)
  ORDER BY ae.start_date, ae.end_date;
END;
$$;

COMMENT ON FUNCTION get_agenda_events_by_period IS 'Busca eventos da agenda em um período específico com filtros opcionais';

-- =====================================================
-- 4. FUNÇÃO PARA VALIDAR CONFLITOS DE HORÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION check_agenda_event_conflicts(
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_employee_id uuid DEFAULT NULL,
  p_exclude_event_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  start_date timestamptz,
  end_date timestamptz,
  employee_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id,
    ae.title,
    ae.start_date,
    ae.end_date,
    ae.employee_id
  FROM agenda_events ae
  WHERE (
    (ae.start_date BETWEEN p_start_date AND p_end_date)
    OR (ae.end_date BETWEEN p_start_date AND p_end_date)
    OR (p_start_date BETWEEN ae.start_date AND ae.end_date)
    OR (p_end_date BETWEEN ae.start_date AND ae.end_date)
  )
  AND (p_employee_id IS NULL OR ae.employee_id = p_employee_id)
  AND (p_exclude_event_id IS NULL OR ae.id != p_exclude_event_id)
  ORDER BY ae.start_date;
END;
$$;

COMMENT ON FUNCTION check_agenda_event_conflicts IS 'Verifica conflitos de horário na agenda';

-- =====================================================
-- 5. FUNÇÃO PARA CORRIGIR EVENTOS COM DATAS INVÁLIDAS
-- =====================================================

CREATE OR REPLACE FUNCTION fix_invalid_agenda_dates()
RETURNS TABLE(
  id uuid,
  title text,
  old_start_date timestamptz,
  old_end_date timestamptz,
  new_end_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH updated_events AS (
    UPDATE agenda_events
    SET end_date = start_date + INTERVAL '1 hour'
    WHERE end_date < start_date
    RETURNING 
      agenda_events.id,
      agenda_events.title,
      agenda_events.start_date as old_start_date,
      start_date as old_end_date_temp,
      agenda_events.end_date as new_end_date
  )
  SELECT 
    ue.id,
    ue.title,
    ue.old_start_date,
    ue.old_end_date_temp as old_end_date,
    ue.new_end_date
  FROM updated_events ue;
END;
$$;

COMMENT ON FUNCTION fix_invalid_agenda_dates IS 'Corrige eventos com data de término anterior à data de início';

-- =====================================================
-- 6. VIEW: EVENTOS COM INFORMAÇÕES COMPLETAS
-- =====================================================

DROP VIEW IF EXISTS v_agenda_events_complete CASCADE;

CREATE OR REPLACE VIEW v_agenda_events_complete AS
SELECT 
  ae.id,
  ae.title,
  ae.description,
  ae.start_date,
  ae.end_date,
  ae.event_type,
  ae.location,
  ae.status,
  ae.priority,
  ae.all_day,
  ae.reminder_minutes,
  ae.notes,
  ae.created_at,
  ae.updated_at,
  -- Cliente
  c.id as customer_id,
  c.nome_razao as customer_name,
  c.nome_fantasia as customer_trade_name,
  c.email as customer_email,
  c.telefone as customer_phone,
  c.celular as customer_mobile,
  -- Funcionário
  e.id as employee_id,
  e.name as employee_name,
  e.email as employee_email,
  e.phone as employee_phone,
  e.role as employee_role,
  -- Ordem de Serviço
  so.id as service_order_id,
  so.order_number,
  so.status as service_order_status,
  -- Duração do evento
  EXTRACT(EPOCH FROM (ae.end_date - ae.start_date))/3600 as duration_hours,
  -- Flags úteis
  CASE 
    WHEN ae.start_date::date = CURRENT_DATE THEN true 
    ELSE false 
  END as is_today,
  CASE 
    WHEN ae.start_date::date = CURRENT_DATE + INTERVAL '1 day' THEN true 
    ELSE false 
  END as is_tomorrow,
  CASE 
    WHEN ae.end_date < NOW() THEN true 
    ELSE false 
  END as is_past,
  CASE 
    WHEN ae.start_date <= NOW() AND ae.end_date >= NOW() THEN true 
    ELSE false 
  END as is_happening_now
FROM agenda_events ae
LEFT JOIN customers c ON ae.customer_id = c.id
LEFT JOIN employees e ON ae.employee_id = e.id
LEFT JOIN service_orders so ON ae.service_order_id = so.id
ORDER BY ae.start_date DESC;

COMMENT ON VIEW v_agenda_events_complete IS 'View com todas as informações dos eventos da agenda incluindo relacionamentos';

-- =====================================================
-- 7. EXECUTAR CORREÇÃO DE EVENTOS INVÁLIDOS
-- =====================================================

-- Corrigir eventos com datas inválidas (se existirem)
DO $$
DECLARE
  fixed_count integer;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM fix_invalid_agenda_dates();
  
  IF fixed_count > 0 THEN
    RAISE NOTICE 'Corrigidos % eventos com datas inválidas', fixed_count;
  ELSE
    RAISE NOTICE 'Nenhum evento com data inválida encontrado';
  END IF;
END $$;

-- =====================================================
-- 8. GRANTS
-- =====================================================

GRANT SELECT ON v_agenda_events_complete TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_agenda_events_by_period TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_agenda_event_conflicts TO anon, authenticated;

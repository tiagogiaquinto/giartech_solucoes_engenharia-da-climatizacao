/*
  # Criar Função para Contar Eventos Urgentes por Tipo

  1. Nova Função
    - `get_urgent_events_by_type()` - Retorna a contagem de eventos urgentes separados por tipo
    
  2. Tipos de Eventos
    - Pessoal/Reunião (meeting) - Azul
    - Financeiro/Pagar (reminder + pagar) - Vermelho
    - Financeiro/Cobrar (reminder + cobrar) - Verde
    - Operacional/Tarefa (task) - Laranja
    - Outros - Roxo
    
  3. Retorno
    - JSON com contagens por tipo
    - Total de eventos urgentes
*/

-- Função para contar eventos urgentes separados por tipo
CREATE OR REPLACE FUNCTION get_urgent_events_by_type()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  meeting_count INTEGER := 0;
  pagar_count INTEGER := 0;
  cobrar_count INTEGER := 0;
  operational_count INTEGER := 0;
  other_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Contar reuniões/pessoal urgentes (azul)
  SELECT COUNT(*)::INTEGER INTO meeting_count
  FROM agenda_events
  WHERE 
    (status IS NULL OR status NOT IN ('completed', 'cancelled'))
    AND event_type IN ('meeting', 'appointment')
    AND (
      DATE(start_date) = CURRENT_DATE
      OR DATE(start_date) < CURRENT_DATE
      OR (priority = 'high' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '24 hours')
    );

  -- Contar lembretes financeiros - pagar (vermelho)
  SELECT COUNT(*)::INTEGER INTO pagar_count
  FROM agenda_events
  WHERE 
    (status IS NULL OR status NOT IN ('completed', 'cancelled'))
    AND (
      (event_type = 'reminder' AND (title ILIKE '%pagar%' OR description ILIKE '%pagar%' OR notes ILIKE '%pagar%'))
      OR (notes ILIKE '%pagamento%' OR title ILIKE '%pagamento%')
    )
    AND (
      DATE(start_date) = CURRENT_DATE
      OR DATE(start_date) < CURRENT_DATE
      OR (priority = 'high' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '24 hours')
    );

  -- Contar lembretes financeiros - cobrar (verde)
  SELECT COUNT(*)::INTEGER INTO cobrar_count
  FROM agenda_events
  WHERE 
    (status IS NULL OR status NOT IN ('completed', 'cancelled'))
    AND (
      (event_type = 'reminder' AND (title ILIKE '%cobrar%' OR description ILIKE '%cobrar%' OR notes ILIKE '%cobrar%'))
      OR (notes ILIKE '%cobrança%' OR title ILIKE '%cobrança%')
    )
    AND (
      DATE(start_date) = CURRENT_DATE
      OR DATE(start_date) < CURRENT_DATE
      OR (priority = 'high' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '24 hours')
    );

  -- Contar tarefas operacionais (laranja)
  SELECT COUNT(*)::INTEGER INTO operational_count
  FROM agenda_events
  WHERE 
    (status IS NULL OR status NOT IN ('completed', 'cancelled'))
    AND event_type IN ('task', 'service_order')
    AND (
      DATE(start_date) = CURRENT_DATE
      OR DATE(start_date) < CURRENT_DATE
      OR (priority = 'high' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '24 hours')
    );

  -- Contar outros eventos (roxo)
  SELECT COUNT(*)::INTEGER INTO other_count
  FROM agenda_events
  WHERE 
    (status IS NULL OR status NOT IN ('completed', 'cancelled'))
    AND (
      event_type IS NULL 
      OR event_type NOT IN ('meeting', 'appointment', 'reminder', 'task', 'service_order')
    )
    AND (
      DATE(start_date) = CURRENT_DATE
      OR DATE(start_date) < CURRENT_DATE
      OR (priority = 'high' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '24 hours')
    );

  -- Calcular total
  total_count := meeting_count + pagar_count + cobrar_count + operational_count + other_count;

  -- Montar resultado em JSON
  result := json_build_object(
    'total', total_count,
    'meeting', meeting_count,
    'pagar', pagar_count,
    'cobrar', cobrar_count,
    'operational', operational_count,
    'other', other_count
  );

  RETURN result;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_urgent_events_by_type() TO authenticated;
GRANT EXECUTE ON FUNCTION get_urgent_events_by_type() TO anon;

COMMENT ON FUNCTION get_urgent_events_by_type() IS 
  'Retorna eventos urgentes categorizados por tipo com cores específicas';

/*
  # Criar Função para Contar Eventos Urgentes

  1. Nova Função
    - `get_urgent_events_count()` - Retorna a contagem de eventos urgentes
    
  2. Critérios de Urgência
    - Eventos de hoje que ainda não foram completados
    - Eventos atrasados (data passada e não completados)
    - Eventos de alta prioridade das próximas 24 horas
    
  3. Segurança
    - Função disponível para usuários autenticados e anônimos
*/

-- Criar função para contar eventos urgentes
CREATE OR REPLACE FUNCTION get_urgent_events_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  urgent_count INTEGER;
BEGIN
  -- Contar eventos urgentes:
  -- 1. Eventos de hoje que não estão completados ou cancelados
  -- 2. Eventos atrasados (data passada e não completados)
  -- 3. Eventos de alta prioridade nas próximas 24 horas
  SELECT COUNT(*)::INTEGER INTO urgent_count
  FROM agenda_events
  WHERE 
    -- Eventos não completados ou cancelados
    (status IS NULL OR status NOT IN ('completed', 'cancelled'))
    AND (
      -- Eventos de hoje
      (DATE(start_date) = CURRENT_DATE)
      OR 
      -- Eventos atrasados (data passada)
      (DATE(start_date) < CURRENT_DATE)
      OR
      -- Eventos de alta prioridade nas próximas 24 horas
      (
        priority = 'high' 
        AND start_date >= NOW() 
        AND start_date <= NOW() + INTERVAL '24 hours'
      )
    );
  
  RETURN urgent_count;
END;
$$;

-- Garantir permissões para execução
GRANT EXECUTE ON FUNCTION get_urgent_events_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_urgent_events_count() TO anon;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_agenda_events_urgency 
  ON agenda_events(start_date, status, priority) 
  WHERE status IS NULL OR status NOT IN ('completed', 'cancelled');

COMMENT ON FUNCTION get_urgent_events_count() IS 
  'Retorna a contagem de eventos urgentes: hoje, atrasados ou alta prioridade nas próximas 24h';

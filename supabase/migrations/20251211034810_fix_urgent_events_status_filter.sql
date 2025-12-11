/*
  # Corrigir Filtros de Status nos Alertas Urgentes

  1. Problema
    - A função get_urgent_events_by_type usa status em inglês ('completed', 'cancelled')
    - Mas o sistema usa status em português ('feito', 'cancelado', 'em_andamento', 'a_fazer')
    - Tipos de eventos também foram atualizados para português
    - Alertas não desapareciam quando tarefas eram concluídas

  2. Correções
    - Atualizar filtros de status para português
    - Adicionar suporte aos novos tipos de evento em português
    - Incluir 'em_andamento' nos filtros (tarefas em andamento ainda são alertas)
    - Excluir 'feito' e 'cancelado' dos alertas

  3. Tipos de Eventos Suportados
    - Pessoal: 'pessoal', 'meeting', 'appointment'
    - Financeiro Pagar: 'pagar', evento com 'pagar' ou 'pagamento' no texto
    - Financeiro Cobrar: 'cobrar', evento com 'cobrar' ou 'cobrança' no texto  
    - Operacional: 'operacional', 'task', 'service_order'
    - Outros: 'networking', 'financeiro', 'other', 'reminder'
*/

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
  -- FILTRO CORRIGIDO: status NOT IN ('feito', 'cancelado')
  SELECT COUNT(*)::INTEGER INTO meeting_count
  FROM agenda_events
  WHERE 
    (status IS NULL OR status NOT IN ('feito', 'cancelado'))
    AND event_type IN ('meeting', 'appointment', 'pessoal')
    AND (
      DATE(start_date) = CURRENT_DATE
      OR DATE(start_date) < CURRENT_DATE
      OR (priority = 'high' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '24 hours')
      OR (priority = 'urgent' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '48 hours')
    );

  -- Contar lembretes financeiros - pagar (vermelho)
  -- FILTRO CORRIGIDO: status NOT IN ('feito', 'cancelado')
  SELECT COUNT(*)::INTEGER INTO pagar_count
  FROM agenda_events
  WHERE 
    (status IS NULL OR status NOT IN ('feito', 'cancelado'))
    AND (
      event_type = 'pagar'
      OR (event_type = 'reminder' AND (title ILIKE '%pagar%' OR description ILIKE '%pagar%' OR notes ILIKE '%pagar%'))
      OR (notes ILIKE '%pagamento%' OR title ILIKE '%pagamento%')
      OR (event_type = 'financeiro' AND (title ILIKE '%pagar%' OR title ILIKE '%pagamento%'))
    )
    AND (
      DATE(start_date) = CURRENT_DATE
      OR DATE(start_date) < CURRENT_DATE
      OR (priority = 'high' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '24 hours')
      OR (priority = 'urgent' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '48 hours')
    );

  -- Contar lembretes financeiros - cobrar (verde)
  -- FILTRO CORRIGIDO: status NOT IN ('feito', 'cancelado')
  SELECT COUNT(*)::INTEGER INTO cobrar_count
  FROM agenda_events
  WHERE 
    (status IS NULL OR status NOT IN ('feito', 'cancelado'))
    AND (
      event_type = 'cobrar'
      OR (event_type = 'reminder' AND (title ILIKE '%cobrar%' OR description ILIKE '%cobrar%' OR notes ILIKE '%cobrar%'))
      OR (notes ILIKE '%cobrança%' OR title ILIKE '%cobrança%')
      OR (event_type = 'financeiro' AND (title ILIKE '%cobrar%' OR title ILIKE '%cobrança%'))
    )
    AND (
      DATE(start_date) = CURRENT_DATE
      OR DATE(start_date) < CURRENT_DATE
      OR (priority = 'high' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '24 hours')
      OR (priority = 'urgent' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '48 hours')
    );

  -- Contar tarefas operacionais (laranja)
  -- FILTRO CORRIGIDO: status NOT IN ('feito', 'cancelado')
  SELECT COUNT(*)::INTEGER INTO operational_count
  FROM agenda_events
  WHERE 
    (status IS NULL OR status NOT IN ('feito', 'cancelado'))
    AND event_type IN ('task', 'service_order', 'operacional')
    AND (
      DATE(start_date) = CURRENT_DATE
      OR DATE(start_date) < CURRENT_DATE
      OR (priority = 'high' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '24 hours')
      OR (priority = 'urgent' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '48 hours')
    );

  -- Contar outros eventos (roxo)
  -- FILTRO CORRIGIDO: status NOT IN ('feito', 'cancelado')
  SELECT COUNT(*)::INTEGER INTO other_count
  FROM agenda_events
  WHERE 
    (status IS NULL OR status NOT IN ('feito', 'cancelado'))
    AND (
      event_type IN ('networking', 'financeiro', 'other', 'reminder')
      OR event_type IS NULL
    )
    -- Excluir eventos já contabilizados em outras categorias
    AND event_type NOT IN ('meeting', 'appointment', 'pessoal', 'pagar', 'cobrar', 'task', 'service_order', 'operacional')
    -- Excluir eventos de pagar/cobrar que já foram contados
    AND NOT (
      (title ILIKE '%pagar%' OR title ILIKE '%pagamento%' OR notes ILIKE '%pagar%' OR notes ILIKE '%pagamento%')
      OR (title ILIKE '%cobrar%' OR title ILIKE '%cobrança%' OR notes ILIKE '%cobrar%' OR notes ILIKE '%cobrança%')
    )
    AND (
      DATE(start_date) = CURRENT_DATE
      OR DATE(start_date) < CURRENT_DATE
      OR (priority = 'high' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '24 hours')
      OR (priority = 'urgent' AND start_date >= NOW() AND start_date <= NOW() + INTERVAL '48 hours')
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
  'Retorna eventos urgentes categorizados por tipo. EXCLUÍ eventos com status "feito" ou "cancelado". Usa tipos em português.';

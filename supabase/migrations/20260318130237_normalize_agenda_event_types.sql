/*
  # Normalizar tipos de eventos da agenda

  ## Problema
  Todos os 208 eventos da agenda_events estavam com event_type = 'operational' (inglês),
  pois o código anterior convertia os tipos para inglês ao salvar.

  ## Correção
  - Converte 'operational' → 'operacional' (padrão do sistema)
  - Garante que tipos em inglês (legados) sejam normalizados para português
  - Os eventos criados pela tela de agenda agora salvam corretamente em português
*/

UPDATE agenda_events
SET event_type = 'operacional'
WHERE event_type IN ('operational', 'service_order');

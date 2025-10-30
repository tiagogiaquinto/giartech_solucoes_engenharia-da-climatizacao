/*
  # Adicionar Status em Inglês

  Adiciona valores de status em inglês à constraint de service_orders:
  - pending (pendente)
  - in_progress (em_andamento)
  - paused (pausado)
  - completed (concluido)
  - cancelled (cancelada/cancelado)
  - deleted (excluida)
  - open (aberta)
  - finished (finalizada)
*/

-- Remover constraint antiga
ALTER TABLE service_orders 
DROP CONSTRAINT IF EXISTS service_orders_status_check;

-- Adicionar nova constraint com ambos os idiomas
ALTER TABLE service_orders 
ADD CONSTRAINT service_orders_status_check 
CHECK (status IN (
  -- Português
  'pendente',
  'em_andamento', 
  'pausado',
  'concluido',
  'cancelada',
  'cancelado',
  'excluida',
  'aberta',
  'finalizada',
  -- Inglês
  'pending',
  'in_progress',
  'paused',
  'completed',
  'cancelled',
  'deleted',
  'open',
  'finished'
));

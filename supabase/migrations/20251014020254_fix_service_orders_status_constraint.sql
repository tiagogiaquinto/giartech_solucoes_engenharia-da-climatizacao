/*
  # Corrigir Constraint de Status das Ordens de Serviço

  1. Problema
    - A constraint service_orders_status_check não inclui 'on_hold'
    - Frontend usa 'on_hold' mas banco não aceita

  2. Solução
    - Remove constraint antiga
    - Adiciona nova constraint incluindo 'on_hold'

  3. Status Permitidos (após correção)
    - pending, in_progress, completed, cancelled
    - on_hold (NOVO - para status pausado)
    - Mantém compatibilidade com status antigos em português
*/

-- Remove constraint antiga
ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;

-- Adiciona nova constraint com 'on_hold'
ALTER TABLE service_orders ADD CONSTRAINT service_orders_status_check 
CHECK (status IN (
  'pending', 
  'in_progress', 
  'on_hold',
  'completed', 
  'cancelled',
  'aberta',
  'em_andamento',
  'concluida',
  'cancelada',
  'agendada',
  'aguardando_pecas',
  'pausada'
));
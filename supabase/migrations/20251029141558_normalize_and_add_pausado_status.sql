/*
  # Normalizar Status e Adicionar "Pausado"

  1. Normalização
    - Converter 'aberta' → 'pendente'
    - Converter 'in_progress' → 'em_andamento'
    - Converter 'completed' → 'concluido'
    
  2. Novo Status
    - Adicionar 'pausado' aos status válidos
*/

-- Primeiro, remover constraint temporariamente
ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;

-- Normalizar status existentes
UPDATE service_orders SET status = 'pendente' WHERE status = 'aberta';
UPDATE service_orders SET status = 'em_andamento' WHERE status = 'in_progress';
UPDATE service_orders SET status = 'concluido' WHERE status = 'completed';
UPDATE service_orders SET status = 'cancelado' WHERE status = 'cancelled';

-- Adicionar novo constraint com todos os status incluindo 'pausado'
ALTER TABLE service_orders
ADD CONSTRAINT service_orders_status_check 
CHECK (status IN ('pendente', 'em_andamento', 'pausado', 'concluido', 'cancelado'));

-- Adicionar comentário explicativo
COMMENT ON COLUMN service_orders.status IS 'Status: pendente, em_andamento, pausado, concluido, cancelado';

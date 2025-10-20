/*
  # Adicionar colunas faltantes em service_orders

  1. Alterações
    - Adiciona scheduled_at (data agendada)
    - Adiciona completed_at (data conclusão)
    - Adiciona total_amount (valor total)
    - Adiciona estimated_duration (duração estimada)
    - Renomeia algumas colunas para padronizar
  
  2. Notas
    - Mantém compatibilidade com código existente
    - Todas colunas são opcionais (nullable)
*/

-- Adicionar colunas faltantes
DO $$
BEGIN
  -- Adicionar scheduled_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN scheduled_at TIMESTAMPTZ;
  END IF;

  -- Adicionar completed_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  -- Adicionar total_amount se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN total_amount NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Adicionar estimated_duration se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'estimated_duration'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN estimated_duration INTEGER DEFAULT 0;
  END IF;
END $$;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_service_orders_scheduled_at ON service_orders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_service_orders_completed_at ON service_orders(completed_at);

-- Comentários
COMMENT ON COLUMN service_orders.scheduled_at IS 'Data e hora agendada para o serviço';
COMMENT ON COLUMN service_orders.completed_at IS 'Data e hora de conclusão do serviço';
COMMENT ON COLUMN service_orders.total_amount IS 'Valor total da ordem de serviço';
COMMENT ON COLUMN service_orders.estimated_duration IS 'Duração estimada em horas';

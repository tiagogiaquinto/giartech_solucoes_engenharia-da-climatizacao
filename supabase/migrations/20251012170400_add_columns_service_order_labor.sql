/*
  # Adicionar colunas em service_order_labor

  1. Alterações
    - Adiciona service_order_item_id (relação com item específico)
    - Adiciona nome_funcionario
    - Adiciona tempo_minutos
    - Adiciona custo_hora
    - Adiciona custo_total (já existe como total_cost, criar alias)
  
  2. Notas
    - Mantém compatibilidade com código existente
*/

-- Adicionar colunas faltantes
DO $$
BEGIN
  -- ID do item de serviço
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_labor' AND column_name = 'service_order_item_id'
  ) THEN
    ALTER TABLE service_order_labor ADD COLUMN service_order_item_id UUID;
  END IF;

  -- Nome do funcionário
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_labor' AND column_name = 'nome_funcionario'
  ) THEN
    ALTER TABLE service_order_labor ADD COLUMN nome_funcionario TEXT;
  END IF;

  -- Tempo em minutos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_labor' AND column_name = 'tempo_minutos'
  ) THEN
    ALTER TABLE service_order_labor ADD COLUMN tempo_minutos INTEGER DEFAULT 0;
  END IF;

  -- Custo por hora
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_labor' AND column_name = 'custo_hora'
  ) THEN
    ALTER TABLE service_order_labor ADD COLUMN custo_hora NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Custo total (alias para total_cost)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_labor' AND column_name = 'custo_total'
  ) THEN
    ALTER TABLE service_order_labor ADD COLUMN custo_total NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Adicionar foreign key se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_order_labor_item_fk'
  ) THEN
    ALTER TABLE service_order_labor 
    ADD CONSTRAINT service_order_labor_item_fk 
    FOREIGN KEY (service_order_item_id) 
    REFERENCES service_order_items(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_service_order_labor_item_id ON service_order_labor(service_order_item_id);

-- Comentários
COMMENT ON COLUMN service_order_labor.service_order_item_id IS 'Referência ao item de serviço específico';
COMMENT ON COLUMN service_order_labor.nome_funcionario IS 'Nome do funcionário';
COMMENT ON COLUMN service_order_labor.tempo_minutos IS 'Tempo trabalhado em minutos';
COMMENT ON COLUMN service_order_labor.custo_hora IS 'Custo por hora do funcionário';
COMMENT ON COLUMN service_order_labor.custo_total IS 'Custo total calculado';

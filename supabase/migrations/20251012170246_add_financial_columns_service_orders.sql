/*
  # Adicionar colunas financeiras em service_orders

  1. Alterações
    - Adiciona custo_total_materiais
    - Adiciona custo_total_mao_obra  
    - Adiciona custo_total (já existe como total_cost, criar alias)
    - Adiciona lucro_total
    - Adiciona margem_lucro
  
  2. Notas
    - Mantém compatibilidade com código existente
    - Valores padrão 0 para cálculos
*/

-- Adicionar colunas financeiras
DO $$
BEGIN
  -- Custo total de materiais
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'custo_total_materiais'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN custo_total_materiais NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Custo total de mão de obra
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'custo_total_mao_obra'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN custo_total_mao_obra NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Custo total geral (além do total_cost existente)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'custo_total'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN custo_total NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Lucro total
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'lucro_total'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN lucro_total NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Margem de lucro percentual
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'margem_lucro'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN margem_lucro NUMERIC(5, 2) DEFAULT 0;
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN service_orders.custo_total_materiais IS 'Custo total dos materiais utilizados';
COMMENT ON COLUMN service_orders.custo_total_mao_obra IS 'Custo total da mão de obra';
COMMENT ON COLUMN service_orders.custo_total IS 'Custo total geral (materiais + mão de obra)';
COMMENT ON COLUMN service_orders.lucro_total IS 'Lucro total calculado';
COMMENT ON COLUMN service_orders.margem_lucro IS 'Margem de lucro em percentual';

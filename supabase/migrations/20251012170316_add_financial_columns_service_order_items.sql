/*
  # Adicionar colunas financeiras em service_order_items

  1. Alterações
    - Adiciona descricao (descrição do serviço)
    - Adiciona quantidade (já existe como quantity, criar compatibilidade)
    - Adiciona preco_unitario (já existe como unit_price)
    - Adiciona preco_total (já existe como total_price)
    - Adiciona tempo_estimado_minutos
    - Adiciona custo_materiais
    - Adiciona custo_mao_obra
    - Adiciona custo_total
    - Adiciona lucro
    - Adiciona margem_lucro
  
  2. Notas
    - Mantém compatibilidade com código existente
    - Valores padrão para cálculos
*/

-- Adicionar colunas faltantes
DO $$
BEGIN
  -- Descrição do item
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' AND column_name = 'descricao'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN descricao TEXT;
  END IF;

  -- Quantidade (alias para quantity)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' AND column_name = 'quantidade'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN quantidade NUMERIC(10, 2) DEFAULT 1;
  END IF;

  -- Preço unitário (alias para unit_price)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' AND column_name = 'preco_unitario'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN preco_unitario NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Preço total (alias para total_price)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' AND column_name = 'preco_total'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN preco_total NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Tempo estimado em minutos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' AND column_name = 'tempo_estimado_minutos'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN tempo_estimado_minutos INTEGER DEFAULT 0;
  END IF;

  -- Custo de materiais
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' AND column_name = 'custo_materiais'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN custo_materiais NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Custo de mão de obra
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' AND column_name = 'custo_mao_obra'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN custo_mao_obra NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Custo total
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' AND column_name = 'custo_total'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN custo_total NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Lucro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' AND column_name = 'lucro'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN lucro NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Margem de lucro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' AND column_name = 'margem_lucro'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN margem_lucro NUMERIC(5, 2) DEFAULT 0;
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN service_order_items.descricao IS 'Descrição detalhada do item de serviço';
COMMENT ON COLUMN service_order_items.quantidade IS 'Quantidade do item (compatibilidade)';
COMMENT ON COLUMN service_order_items.preco_unitario IS 'Preço unitário (compatibilidade)';
COMMENT ON COLUMN service_order_items.preco_total IS 'Preço total (compatibilidade)';
COMMENT ON COLUMN service_order_items.tempo_estimado_minutos IS 'Tempo estimado em minutos';
COMMENT ON COLUMN service_order_items.custo_materiais IS 'Custo total dos materiais';
COMMENT ON COLUMN service_order_items.custo_mao_obra IS 'Custo total da mão de obra';
COMMENT ON COLUMN service_order_items.custo_total IS 'Custo total do item';
COMMENT ON COLUMN service_order_items.lucro IS 'Lucro calculado';
COMMENT ON COLUMN service_order_items.margem_lucro IS 'Margem de lucro percentual';

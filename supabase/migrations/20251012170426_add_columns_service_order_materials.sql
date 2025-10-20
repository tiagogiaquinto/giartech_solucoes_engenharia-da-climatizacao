/*
  # Adicionar colunas em service_order_materials

  1. Alterações
    - Adiciona service_order_item_id (relação com item específico)
    - Adiciona nome_material (já existe como material_name, criar alias)
    - Adiciona quantidade (já existe como quantity, criar alias)
    - Adiciona preco_compra
    - Adiciona preco_venda (já existe como unit_sale_price)
    - Adiciona custo_total (já existe como total_cost, criar alias)
    - Adiciona valor_total (já existe como total_sale_price, criar alias)
    - Adiciona lucro
  
  2. Notas
    - Mantém compatibilidade com código existente
*/

-- Adicionar colunas faltantes
DO $$
BEGIN
  -- ID do item de serviço
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_materials' AND column_name = 'service_order_item_id'
  ) THEN
    ALTER TABLE service_order_materials ADD COLUMN service_order_item_id UUID;
  END IF;

  -- Nome do material (alias)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_materials' AND column_name = 'nome_material'
  ) THEN
    ALTER TABLE service_order_materials ADD COLUMN nome_material TEXT;
  END IF;

  -- Quantidade (alias)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_materials' AND column_name = 'quantidade'
  ) THEN
    ALTER TABLE service_order_materials ADD COLUMN quantidade NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Preço de compra
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_materials' AND column_name = 'preco_compra'
  ) THEN
    ALTER TABLE service_order_materials ADD COLUMN preco_compra NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Preço de venda (alias)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_materials' AND column_name = 'preco_venda'
  ) THEN
    ALTER TABLE service_order_materials ADD COLUMN preco_venda NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Custo total (alias)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_materials' AND column_name = 'custo_total'
  ) THEN
    ALTER TABLE service_order_materials ADD COLUMN custo_total NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Valor total (alias)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_materials' AND column_name = 'valor_total'
  ) THEN
    ALTER TABLE service_order_materials ADD COLUMN valor_total NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Lucro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_materials' AND column_name = 'lucro'
  ) THEN
    ALTER TABLE service_order_materials ADD COLUMN lucro NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Adicionar foreign key se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_order_materials_item_fk'
  ) THEN
    ALTER TABLE service_order_materials 
    ADD CONSTRAINT service_order_materials_item_fk 
    FOREIGN KEY (service_order_item_id) 
    REFERENCES service_order_items(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_service_order_materials_item_id ON service_order_materials(service_order_item_id);

-- Comentários
COMMENT ON COLUMN service_order_materials.service_order_item_id IS 'Referência ao item de serviço específico';
COMMENT ON COLUMN service_order_materials.nome_material IS 'Nome do material (compatibilidade)';
COMMENT ON COLUMN service_order_materials.quantidade IS 'Quantidade (compatibilidade)';
COMMENT ON COLUMN service_order_materials.preco_compra IS 'Preço de compra unitário';
COMMENT ON COLUMN service_order_materials.preco_venda IS 'Preço de venda unitário (compatibilidade)';
COMMENT ON COLUMN service_order_materials.custo_total IS 'Custo total (compatibilidade)';
COMMENT ON COLUMN service_order_materials.valor_total IS 'Valor total de venda (compatibilidade)';
COMMENT ON COLUMN service_order_materials.lucro IS 'Lucro calculado';

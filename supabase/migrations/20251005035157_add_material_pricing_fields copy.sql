/*
  # Adicionar Campos de Precificação aos Materiais

  1. Alterações na tabela `materials`
    - Adicionar `preco_compra` (preço de custo/compra)
    - Adicionar `preco_venda` (preço de venda)
    - Adicionar `margem_lucro` (calculado automaticamente)
    - Adicionar `descricao` (descrição do item)
    - Adicionar `unidade_medida` (UN, KG, MT, LT, etc)
    - Adicionar `estoque_minimo` (alerta de estoque baixo)
    - Adicionar `ativo` (status do item)
    - Renomear campos para padrão PT-BR

  2. Notas
    - Campos de preço permitem análise de lucratividade
    - Margem calculada automaticamente via trigger
    - Estoque mínimo para alertas
*/

-- Adicionar novos campos
DO $$
BEGIN
  -- Adicionar campos de precificação
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'preco_compra') THEN
    ALTER TABLE materials ADD COLUMN preco_compra NUMERIC(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'preco_venda') THEN
    ALTER TABLE materials ADD COLUMN preco_venda NUMERIC(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'margem_lucro') THEN
    ALTER TABLE materials ADD COLUMN margem_lucro NUMERIC(5,2) DEFAULT 0;
  END IF;

  -- Adicionar campos complementares
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'descricao') THEN
    ALTER TABLE materials ADD COLUMN descricao TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'unidade_medida') THEN
    ALTER TABLE materials ADD COLUMN unidade_medida TEXT DEFAULT 'UN';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'estoque_minimo') THEN
    ALTER TABLE materials ADD COLUMN estoque_minimo INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'ativo') THEN
    ALTER TABLE materials ADD COLUMN ativo BOOLEAN DEFAULT true;
  END IF;

  -- Adicionar campos PT-BR se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'nome') THEN
    ALTER TABLE materials ADD COLUMN nome TEXT;
    UPDATE materials SET nome = name WHERE nome IS NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'preco_unitario') THEN
    ALTER TABLE materials ADD COLUMN preco_unitario NUMERIC(10,2);
    UPDATE materials SET preco_unitario = unit_price WHERE preco_unitario IS NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'quantidade_estoque') THEN
    ALTER TABLE materials ADD COLUMN quantidade_estoque INTEGER;
    UPDATE materials SET quantidade_estoque = stock_integer WHERE quantidade_estoque IS NULL;
  END IF;
END $$;

-- Criar função para calcular margem de lucro automaticamente
CREATE OR REPLACE FUNCTION calculate_material_margin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.preco_compra > 0 THEN
    NEW.margem_lucro := ((NEW.preco_venda - NEW.preco_compra) / NEW.preco_compra) * 100;
  ELSE
    NEW.margem_lucro := 0;
  END IF;
  
  -- Atualizar timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para calcular margem automaticamente
DROP TRIGGER IF EXISTS calculate_material_margin_trigger ON materials;
CREATE TRIGGER calculate_material_margin_trigger
  BEFORE INSERT OR UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION calculate_material_margin();

-- Atualizar campos existentes com valores padrão
UPDATE materials 
SET 
  preco_compra = COALESCE(unit_price * 0.6, 0),
  preco_venda = COALESCE(unit_price, 0),
  unidade_medida = COALESCE(unidade_medida, 'UN'),
  estoque_minimo = COALESCE(estoque_minimo, 5),
  ativo = COALESCE(ativo, true)
WHERE preco_compra = 0 OR preco_venda = 0;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_materials_ativo ON materials(ativo);
CREATE INDEX IF NOT EXISTS idx_materials_estoque ON materials(quantidade_estoque);
CREATE INDEX IF NOT EXISTS idx_materials_sku ON materials(sku);

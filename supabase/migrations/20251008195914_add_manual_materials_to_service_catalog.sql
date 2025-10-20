/*
  # Permitir Materiais Manuais no Catálogo de Serviços

  1. Alterações na tabela service_catalog_materials
    - Torna material_id opcional (permite materiais manuais)
    - Adiciona campos para inserção manual de materiais
    - Adiciona flag para identificar se é do estoque ou manual

  2. Novos campos
    - material_name: nome do material (para materiais manuais)
    - material_code: código do material (opcional)
    - material_unit: unidade de medida
    - from_inventory: flag para indicar se vem do estoque
    - save_to_inventory: flag para indicar se deve salvar no estoque
*/

-- Torna material_id opcional
ALTER TABLE service_catalog_materials 
ALTER COLUMN material_id DROP NOT NULL;

-- Adiciona campos para materiais manuais
ALTER TABLE service_catalog_materials 
ADD COLUMN IF NOT EXISTS material_name text,
ADD COLUMN IF NOT EXISTS material_code text,
ADD COLUMN IF NOT EXISTS material_unit text DEFAULT 'un',
ADD COLUMN IF NOT EXISTS from_inventory boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS save_to_inventory boolean DEFAULT false;

-- Adiciona constraint: deve ter material_id OU material_name
ALTER TABLE service_catalog_materials 
DROP CONSTRAINT IF EXISTS check_material_source;

ALTER TABLE service_catalog_materials 
ADD CONSTRAINT check_material_source 
CHECK (
  (material_id IS NOT NULL AND from_inventory = true) OR 
  (material_name IS NOT NULL AND from_inventory = false)
);

-- Cria índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_service_catalog_materials_inventory
ON service_catalog_materials(from_inventory);

-- Função auxiliar para salvar material manual no estoque
CREATE OR REPLACE FUNCTION save_manual_material_to_inventory()
RETURNS TRIGGER AS $$
DECLARE
  new_inventory_id uuid;
BEGIN
  -- Se o material foi marcado para salvar no estoque e ainda não tem material_id
  IF NEW.save_to_inventory = true AND NEW.material_id IS NULL AND NEW.from_inventory = false THEN
    -- Insere no estoque
    INSERT INTO inventory (
      name,
      code,
      unit_measure,
      quantity,
      unit_price,
      active
    ) VALUES (
      NEW.material_name,
      NEW.material_code,
      NEW.material_unit,
      0, -- quantidade inicial zero
      NEW.unit_cost_at_time,
      true
    )
    RETURNING id INTO new_inventory_id;
    
    -- Atualiza o registro para referenciar o item do estoque
    NEW.material_id := new_inventory_id;
    NEW.from_inventory := true;
    NEW.save_to_inventory := false; -- Já salvou, reseta a flag
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria trigger para salvar automaticamente no estoque
DROP TRIGGER IF EXISTS trigger_save_manual_material ON service_catalog_materials;
CREATE TRIGGER trigger_save_manual_material
  BEFORE INSERT OR UPDATE ON service_catalog_materials
  FOR EACH ROW
  EXECUTE FUNCTION save_manual_material_to_inventory();

-- Comentários para documentação
COMMENT ON COLUMN service_catalog_materials.material_name IS 'Nome do material (usado quando inserido manualmente)';
COMMENT ON COLUMN service_catalog_materials.from_inventory IS 'TRUE = material do estoque, FALSE = material inserido manualmente';
COMMENT ON COLUMN service_catalog_materials.save_to_inventory IS 'TRUE = salvar material manual no estoque automaticamente';

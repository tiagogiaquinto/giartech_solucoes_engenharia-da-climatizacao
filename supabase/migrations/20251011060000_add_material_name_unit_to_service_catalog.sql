/*
  # Add material_name and material_unit to service_catalog_materials

  1. Changes
    - Add material_name (TEXT) for denormalization
    - Add material_unit (TEXT) for easy display
    
  2. Security
    - Maintain existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_catalog_materials' AND column_name = 'material_name'
  ) THEN
    ALTER TABLE service_catalog_materials ADD COLUMN material_name TEXT;
    COMMENT ON COLUMN service_catalog_materials.material_name IS 'Nome do material (denormalizado para performance)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_catalog_materials' AND column_name = 'material_unit'
  ) THEN
    ALTER TABLE service_catalog_materials ADD COLUMN material_unit TEXT DEFAULT 'UN';
    COMMENT ON COLUMN service_catalog_materials.material_unit IS 'Unidade de medida do material';
  END IF;
END $$;

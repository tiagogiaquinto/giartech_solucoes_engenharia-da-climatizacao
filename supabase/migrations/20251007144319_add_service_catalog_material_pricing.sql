/*
  # Add Material Pricing to Service Catalog

  1. Changes to `materials` table
    - Ensure unit_cost and unit_price (sale price) exist
    - Add sale_price if missing (for clarity)
    - Add total_quantity_purchased (for fractionation calculation)
    
  2. Changes to `service_catalog_materials` table
    - Add unit_cost_at_time (custo no momento da adição)
    - Add unit_sale_price (preço de venda unitário)
    - Add total_cost (custo total = quantity * unit_cost)
    - Add total_sale_price (preço total de venda = quantity * unit_sale_price)
    - Add notes (observações sobre o material no serviço)
    
  3. Changes to `service_orders` table
    - Add show_material_costs (boolean para mostrar/ocultar custos)
    - Add material_total_cost (custo total dos materiais)
    - Add material_total_sale (valor total de venda dos materiais)
    
  4. Security
    - Maintain existing RLS policies
*/

-- Ensure materials table has all needed fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' AND column_name = 'sale_price'
  ) THEN
    ALTER TABLE materials ADD COLUMN sale_price NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' AND column_name = 'total_quantity_purchased'
  ) THEN
    ALTER TABLE materials ADD COLUMN total_quantity_purchased NUMERIC(10,3) DEFAULT 0;
    COMMENT ON COLUMN materials.total_quantity_purchased IS 'Quantidade total comprada (ex: 15 metros de cobre) para cálculo de custo unitário';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' AND column_name = 'total_cost_purchased'
  ) THEN
    ALTER TABLE materials ADD COLUMN total_cost_purchased NUMERIC(10,2) DEFAULT 0;
    COMMENT ON COLUMN materials.total_cost_purchased IS 'Valor total pago na compra (ex: R$ 196,00 pela panqueca)';
  END IF;
END $$;

-- Add pricing fields to service_catalog_materials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_catalog_materials' AND column_name = 'unit_cost_at_time'
  ) THEN
    ALTER TABLE service_catalog_materials ADD COLUMN unit_cost_at_time NUMERIC(10,2) DEFAULT 0;
    COMMENT ON COLUMN service_catalog_materials.unit_cost_at_time IS 'Custo unitário do material no momento da adição ao catálogo';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_catalog_materials' AND column_name = 'unit_sale_price'
  ) THEN
    ALTER TABLE service_catalog_materials ADD COLUMN unit_sale_price NUMERIC(10,2) DEFAULT 0;
    COMMENT ON COLUMN service_catalog_materials.unit_sale_price IS 'Preço de venda unitário do material';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_catalog_materials' AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE service_catalog_materials ADD COLUMN total_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost_at_time) STORED;
    COMMENT ON COLUMN service_catalog_materials.total_cost IS 'Custo total calculado automaticamente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_catalog_materials' AND column_name = 'total_sale_price'
  ) THEN
    ALTER TABLE service_catalog_materials ADD COLUMN total_sale_price NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_sale_price) STORED;
    COMMENT ON COLUMN service_catalog_materials.total_sale_price IS 'Preço de venda total calculado automaticamente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_catalog_materials' AND column_name = 'notes'
  ) THEN
    ALTER TABLE service_catalog_materials ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Add cost visibility flag to service_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'show_material_costs'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN show_material_costs BOOLEAN DEFAULT false;
    COMMENT ON COLUMN service_orders.show_material_costs IS 'Se true, mostra custos dos materiais no documento. Se false, mostra apenas preços de venda';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'material_total_cost'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN material_total_cost NUMERIC(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'material_total_sale'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN material_total_sale NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- Create function to calculate unit cost from total purchase
CREATE OR REPLACE FUNCTION calculate_material_unit_cost(
  p_total_cost NUMERIC,
  p_total_quantity NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_total_quantity = 0 OR p_total_quantity IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(p_total_cost / p_total_quantity, 4);
END;
$$;

COMMENT ON FUNCTION calculate_material_unit_cost IS 'Calcula o custo unitário fracionado a partir do valor total da compra e quantidade total';

-- Create view for service catalog with material costs summary
CREATE OR REPLACE VIEW service_catalog_with_costs AS
SELECT 
  sc.id,
  sc.name,
  sc.description,
  sc.category,
  sc.base_price,
  sc.estimated_duration,
  sc.active,
  COALESCE(SUM(scm.total_cost), 0) as total_material_cost,
  COALESCE(SUM(scm.total_sale_price), 0) as total_material_sale,
  COALESCE(SUM(scm.total_sale_price), 0) - COALESCE(SUM(scm.total_cost), 0) as material_profit_margin,
  COUNT(scm.id) as material_count,
  sc.created_at,
  sc.updated_at
FROM service_catalog sc
LEFT JOIN service_catalog_materials scm ON sc.id = scm.service_catalog_id
GROUP BY sc.id, sc.name, sc.description, sc.category, sc.base_price, sc.estimated_duration, sc.active, sc.created_at, sc.updated_at;

COMMENT ON VIEW service_catalog_with_costs IS 'Visão do catálogo de serviços com resumo de custos e margens de lucro dos materiais';
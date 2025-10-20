/*
  # Create Service Order Materials Table

  ## Description
  Creates table to track materials used in service orders with inventory integration

  ## New Table
  - `service_order_materials`: Links service orders to inventory items
    - Tracks quantity used
    - Records cost at time of use
    - Links to inventory for stock control

  ## Changes
  1. Create service_order_materials table
  2. Add foreign keys to service_orders and inventory
  3. Add triggers for stock updates
  4. Create function to check low stock
*/

-- Create service_order_materials table
CREATE TABLE IF NOT EXISTS service_order_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  material_name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'un',
  unit_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_order_materials_service_order
ON service_order_materials(service_order_id);

CREATE INDEX IF NOT EXISTS idx_service_order_materials_inventory
ON service_order_materials(inventory_id);

-- Enable RLS
ALTER TABLE service_order_materials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read service_order_materials"
  ON service_order_materials FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert service_order_materials"
  ON service_order_materials FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update service_order_materials"
  ON service_order_materials FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete service_order_materials"
  ON service_order_materials FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_service_order_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_order_materials_updated_at
  BEFORE UPDATE ON service_order_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_materials_updated_at();

-- Create function to get low stock materials
CREATE OR REPLACE FUNCTION get_low_stock_materials()
RETURNS TABLE (
  inventory_id UUID,
  name TEXT,
  current_stock NUMERIC,
  min_stock NUMERIC,
  stock_percentage NUMERIC,
  urgency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.name,
    i.quantity,
    i.min_stock,
    CASE
      WHEN i.min_stock > 0 THEN ROUND((i.quantity::NUMERIC / i.min_stock::NUMERIC) * 100, 2)
      ELSE 100
    END as stock_percentage,
    CASE
      WHEN i.quantity = 0 THEN 'critical'::TEXT
      WHEN i.quantity < i.min_stock * 0.5 THEN 'urgent'::TEXT
      WHEN i.quantity < i.min_stock THEN 'warning'::TEXT
      ELSE 'ok'::TEXT
    END as urgency
  FROM inventory i
  WHERE i.quantity <= i.min_stock
  ORDER BY
    CASE
      WHEN i.quantity = 0 THEN 1
      WHEN i.quantity < i.min_stock * 0.5 THEN 2
      ELSE 3
    END,
    i.quantity ASC;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE service_order_materials IS 'Materiais utilizados nas ordens de serviço';
COMMENT ON COLUMN service_order_materials.inventory_id IS 'Referência ao item no estoque (pode ser NULL para materiais avulsos)';
COMMENT ON COLUMN service_order_materials.material_name IS 'Nome do material (copiado do estoque ou inserido manualmente)';
COMMENT ON FUNCTION get_low_stock_materials IS 'Retorna lista de materiais com estoque baixo ou zerado';

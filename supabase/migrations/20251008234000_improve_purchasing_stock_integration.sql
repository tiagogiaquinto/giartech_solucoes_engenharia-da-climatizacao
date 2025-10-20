/*
  # Improve Purchasing and Stock Integration

  ## Description
  Enhances integration between inventory and purchasing department with real-time alerts and cost data

  ## Changes
  1. Improve get_items_needing_purchase function with real cost data
  2. Add automatic badge count for sidebar
  3. Add supplier information from inventory
  4. Calculate recommended quantities based on usage patterns
*/

-- Drop and recreate improved function
DROP FUNCTION IF EXISTS get_items_needing_purchase();

CREATE OR REPLACE FUNCTION get_items_needing_purchase()
RETURNS TABLE (
  inventory_id UUID,
  item_name TEXT,
  current_stock NUMERIC,
  min_stock NUMERIC,
  max_stock NUMERIC,
  unit_price NUMERIC,
  supplier TEXT,
  category TEXT,
  location TEXT,
  last_purchase_date DATE,
  recommended_order_qty NUMERIC,
  urgency TEXT,
  estimated_cost NUMERIC,
  days_until_stockout INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS inventory_id,
    i.item_name,
    i.quantity AS current_stock,
    i.min_stock,
    i.max_stock,
    i.unit_price,
    i.supplier,
    i.category,
    i.location,
    i.last_purchase_date,
    CASE
      WHEN i.quantity <= 0 THEN GREATEST(i.max_stock, i.min_stock * 2, 10)
      WHEN i.quantity < (i.min_stock * 0.5) THEN (i.max_stock - i.quantity)
      ELSE (i.min_stock * 1.5 - i.quantity)
    END AS recommended_order_qty,
    CASE
      WHEN i.quantity <= 0 THEN 'critical'
      WHEN i.quantity < (i.min_stock * 0.3) THEN 'urgent'
      WHEN i.quantity < (i.min_stock * 0.7) THEN 'normal'
      ELSE 'low'
    END AS urgency,
    CASE
      WHEN i.quantity <= 0 THEN GREATEST(i.max_stock, i.min_stock * 2, 10) * COALESCE(i.unit_price, 0)
      WHEN i.quantity < (i.min_stock * 0.5) THEN (i.max_stock - i.quantity) * COALESCE(i.unit_price, 0)
      ELSE (i.min_stock * 1.5 - i.quantity) * COALESCE(i.unit_price, 0)
    END AS estimated_cost,
    CASE
      WHEN i.quantity <= 0 THEN 0
      WHEN i.average_usage > 0 THEN FLOOR(i.quantity / i.average_usage)::INTEGER
      ELSE 999
    END AS days_until_stockout
  FROM
    inventory i
  WHERE
    i.quantity <= i.min_stock
    AND i.active = true
  ORDER BY
    CASE
      WHEN i.quantity <= 0 THEN 1
      WHEN i.quantity < (i.min_stock * 0.3) THEN 2
      WHEN i.quantity < (i.min_stock * 0.7) THEN 3
      ELSE 4
    END,
    i.quantity ASC,
    i.item_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get count of critical items for badge
CREATE OR REPLACE FUNCTION get_critical_stock_count()
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_result
  FROM inventory
  WHERE quantity <= min_stock
    AND active = true;

  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get count of items by urgency
CREATE OR REPLACE FUNCTION get_stock_alerts_summary()
RETURNS TABLE (
  total_alerts INTEGER,
  critical_count INTEGER,
  urgent_count INTEGER,
  normal_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_alerts,
    COUNT(*) FILTER (WHERE quantity <= 0)::INTEGER AS critical_count,
    COUNT(*) FILTER (WHERE quantity > 0 AND quantity < (min_stock * 0.3))::INTEGER AS urgent_count,
    COUNT(*) FILTER (WHERE quantity >= (min_stock * 0.3) AND quantity <= min_stock)::INTEGER AS normal_count
  FROM inventory
  WHERE quantity <= min_stock
    AND active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add average_usage column if not exists (for stockout prediction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory' AND column_name = 'average_usage'
  ) THEN
    ALTER TABLE inventory ADD COLUMN average_usage NUMERIC DEFAULT 0;
    COMMENT ON COLUMN inventory.average_usage IS 'Média de uso diário para previsão de ruptura';
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity, min_stock) WHERE active = true AND quantity <= min_stock;

-- Comments
COMMENT ON FUNCTION get_items_needing_purchase IS 'Retorna itens que necessitam compra com dados completos de custo e fornecedor';
COMMENT ON FUNCTION get_critical_stock_count IS 'Retorna contagem de itens críticos para badge do menu';
COMMENT ON FUNCTION get_stock_alerts_summary IS 'Retorna resumo de alertas por urgência';

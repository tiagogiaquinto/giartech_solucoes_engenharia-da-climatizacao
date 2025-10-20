/*
  # Fix Purchasing Functions - Correct Column Names

  ## Description
  Updates purchasing functions to use correct column names from inventory_items table

  ## Changes
  - min_stock → min_quantity
  - max_stock → max_quantity
  - cost/price → unit_cost/unit_price
  - supplier → supplier_name
*/

-- Function to get items needing purchase (corrected column names)
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
    COALESCE(i.name, 'Item sem nome') AS item_name,
    COALESCE(i.quantity, 0) AS current_stock,
    COALESCE(i.min_quantity, 0) AS min_stock,
    COALESCE(i.max_quantity, i.min_quantity * 2, 20) AS max_stock,
    COALESCE(i.unit_cost, i.unit_price, 0) AS unit_price,
    i.supplier_name AS supplier,
    i.category,
    i.location,
    NULL::DATE AS last_purchase_date,
    CASE
      WHEN COALESCE(i.quantity, 0) <= 0 THEN GREATEST(COALESCE(i.max_quantity, i.min_quantity * 2, 20), COALESCE(i.min_quantity, 10) * 2, 10)
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_quantity, 10) * 0.5) THEN (COALESCE(i.max_quantity, i.min_quantity * 2, 20) - COALESCE(i.quantity, 0))
      ELSE (COALESCE(i.min_quantity, 10) * 1.5 - COALESCE(i.quantity, 0))
    END AS recommended_order_qty,
    CASE
      WHEN COALESCE(i.quantity, 0) <= 0 THEN 'critical'
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_quantity, 10) * 0.3) THEN 'urgent'
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_quantity, 10) * 0.7) THEN 'normal'
      ELSE 'low'
    END AS urgency,
    CASE
      WHEN COALESCE(i.quantity, 0) <= 0 THEN 
        GREATEST(COALESCE(i.max_quantity, i.min_quantity * 2, 20), COALESCE(i.min_quantity, 10) * 2, 10) * COALESCE(i.unit_cost, i.unit_price, 0)
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_quantity, 10) * 0.5) THEN 
        (COALESCE(i.max_quantity, i.min_quantity * 2, 20) - COALESCE(i.quantity, 0)) * COALESCE(i.unit_cost, i.unit_price, 0)
      ELSE 
        (COALESCE(i.min_quantity, 10) * 1.5 - COALESCE(i.quantity, 0)) * COALESCE(i.unit_cost, i.unit_price, 0)
    END AS estimated_cost,
    CASE
      WHEN COALESCE(i.quantity, 0) <= 0 THEN 0
      ELSE 999
    END AS days_until_stockout
  FROM
    inventory_items i
  WHERE
    i.active = true
    AND COALESCE(i.quantity, 0) <= COALESCE(i.min_quantity, 0)
  ORDER BY
    CASE
      WHEN COALESCE(i.quantity, 0) <= 0 THEN 1
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_quantity, 10) * 0.3) THEN 2
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_quantity, 10) * 0.7) THEN 3
      ELSE 4
    END,
    i.quantity ASC,
    i.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get count of critical items for badge (corrected)
CREATE OR REPLACE FUNCTION get_critical_stock_count()
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_result
  FROM inventory_items
  WHERE active = true
    AND COALESCE(quantity, 0) <= COALESCE(min_quantity, 0);

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comments
COMMENT ON FUNCTION get_items_needing_purchase IS 'Retorna itens com estoque baixo usando nomes corretos das colunas (min_quantity, max_quantity, unit_cost, supplier_name)';
COMMENT ON FUNCTION get_critical_stock_count IS 'Retorna contagem de itens críticos usando min_quantity';

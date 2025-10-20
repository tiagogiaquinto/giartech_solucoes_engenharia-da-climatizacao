/*
  # Corrigir Precisão de Campos de Margem com Recriação de View

  ## Problema
  - Campos de margem com precision 5, scale 2 (max: 999.99)
  - View materials_with_profit depende do campo profit_margin_percent
  - Necessário dropar view, alterar campos e recriar view

  ## Alterações
  1. Drop view materials_with_profit
  2. Alterar precision dos campos:
     - materials.profit_margin_percent: numeric(5,2) → numeric(10,2)
     - service_order_items.margem_lucro: numeric(5,2) → numeric(10,2)
  3. Recriar view materials_with_profit
*/

-- 1. Dropar view temporariamente
DROP VIEW IF EXISTS materials_with_profit;

-- 2. Alterar campos de margem
ALTER TABLE materials 
ALTER COLUMN profit_margin_percent TYPE numeric(10,2);

ALTER TABLE service_order_items 
ALTER COLUMN margem_lucro TYPE numeric(10,2);

-- 3. Recriar view materials_with_profit
CREATE VIEW materials_with_profit AS
SELECT 
  id,
  name,
  description,
  category,
  unit,
  quantity,
  min_quantity,
  unit_price,
  supplier,
  active,
  created_at,
  updated_at,
  unit_cost,
  sale_price,
  total_quantity_purchased,
  total_cost_purchased,
  profit_margin_percent,
  sku,
  sale_price - unit_cost AS unit_profit,
  (sale_price - unit_cost) * quantity AS total_profit,
  unit_cost * quantity AS total_cost_in_stock,
  sale_price * quantity AS total_value_in_stock,
  CASE
    WHEN quantity <= min_quantity THEN 'low'::text
    WHEN quantity = 0::numeric THEN 'out'::text
    ELSE 'ok'::text
  END AS stock_status
FROM materials m;

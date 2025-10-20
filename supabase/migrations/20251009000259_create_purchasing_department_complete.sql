/*
  # Create Purchasing Department - Complete System

  ## Description
  Creates complete purchasing department infrastructure with tables for orders, items, quotes, and schedules
  Integrates with inventory_items table for real-time alerts

  ## Tables Created
  1. purchase_orders - Main purchase orders table
  2. purchase_order_items - Items in each purchase order
  3. supplier_quotes - Price quotes from suppliers
  4. purchase_schedules - Recurring purchase schedules

  ## Functions Created
  1. generate_purchase_order_number() - Auto-generates PO numbers
  2. generate_quote_number() - Auto-generates quote numbers
  3. update_purchase_order_total() - Updates order totals
  4. get_items_needing_purchase() - Returns low stock items
  5. get_critical_stock_count() - Returns count for badge

  ## Security
  - RLS enabled on all tables
  - Public access for development
*/

-- ==========================================
-- TABLES
-- ==========================================

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  supplier_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  subtotal NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  shipping_amount NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  final_amount NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(15,3) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  total_price NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  received_quantity NUMERIC(15,3) DEFAULT 0,
  urgency_level TEXT CHECK (urgency_level IN ('low', 'normal', 'urgent', 'critical')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create supplier_quotes table
CREATE TABLE IF NOT EXISTS supplier_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  supplier_name TEXT NOT NULL,
  inventory_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC(15,3) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  total_price NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  validity_date DATE,
  lead_time_days INTEGER,
  payment_terms TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- Create purchase_schedules table
CREATE TABLE IF NOT EXISTS purchase_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_name TEXT NOT NULL,
  inventory_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly')),
  quantity NUMERIC(15,3) NOT NULL,
  unit_price NUMERIC(15,2),
  next_order_date DATE NOT NULL,
  last_order_date DATE,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_name);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_inventory ON purchase_order_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_supplier ON supplier_quotes(supplier_name);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_status ON supplier_quotes(status);
CREATE INDEX IF NOT EXISTS idx_purchase_schedules_next_date ON purchase_schedules(next_order_date) WHERE active = true;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to generate purchase order numbers
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'PO' || year_prefix || '(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM purchase_orders
  WHERE order_number LIKE 'PO' || year_prefix || '%';
  
  RETURN 'PO' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 'QT' || year_prefix || '(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM supplier_quotes
  WHERE quote_number LIKE 'QT' || year_prefix || '%';
  
  RETURN 'QT' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update purchase order totals
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM purchase_order_items
      WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
    ),
    final_amount = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM purchase_order_items
      WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
    ) + COALESCE((SELECT tax_amount FROM purchase_orders WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)), 0)
      + COALESCE((SELECT shipping_amount FROM purchase_orders WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)), 0)
      - COALESCE((SELECT discount_amount FROM purchase_orders WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to get items needing purchase (with real cost data from inventory)
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
    COALESCE(i.name, i.item_name, 'Item sem nome') AS item_name,
    COALESCE(i.quantity, 0) AS current_stock,
    COALESCE(i.min_stock, 0) AS min_stock,
    COALESCE(i.max_stock, i.min_stock * 2, 20) AS max_stock,
    COALESCE(i.cost, i.price, 0) AS unit_price,
    i.supplier,
    i.category,
    i.location,
    NULL::DATE AS last_purchase_date,
    CASE
      WHEN COALESCE(i.quantity, 0) <= 0 THEN GREATEST(COALESCE(i.max_stock, i.min_stock * 2, 20), COALESCE(i.min_stock, 10) * 2, 10)
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_stock, 10) * 0.5) THEN (COALESCE(i.max_stock, i.min_stock * 2, 20) - COALESCE(i.quantity, 0))
      ELSE (COALESCE(i.min_stock, 10) * 1.5 - COALESCE(i.quantity, 0))
    END AS recommended_order_qty,
    CASE
      WHEN COALESCE(i.quantity, 0) <= 0 THEN 'critical'
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_stock, 10) * 0.3) THEN 'urgent'
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_stock, 10) * 0.7) THEN 'normal'
      ELSE 'low'
    END AS urgency,
    CASE
      WHEN COALESCE(i.quantity, 0) <= 0 THEN 
        GREATEST(COALESCE(i.max_stock, i.min_stock * 2, 20), COALESCE(i.min_stock, 10) * 2, 10) * COALESCE(i.cost, i.price, 0)
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_stock, 10) * 0.5) THEN 
        (COALESCE(i.max_stock, i.min_stock * 2, 20) - COALESCE(i.quantity, 0)) * COALESCE(i.cost, i.price, 0)
      ELSE 
        (COALESCE(i.min_stock, 10) * 1.5 - COALESCE(i.quantity, 0)) * COALESCE(i.cost, i.price, 0)
    END AS estimated_cost,
    CASE
      WHEN COALESCE(i.quantity, 0) <= 0 THEN 0
      ELSE 999
    END AS days_until_stockout
  FROM
    inventory_items i
  WHERE
    COALESCE(i.quantity, 0) <= COALESCE(i.min_stock, 0)
  ORDER BY
    CASE
      WHEN COALESCE(i.quantity, 0) <= 0 THEN 1
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_stock, 10) * 0.3) THEN 2
      WHEN COALESCE(i.quantity, 0) < (COALESCE(i.min_stock, 10) * 0.7) THEN 3
      ELSE 4
    END,
    i.quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get count of critical items for badge
CREATE OR REPLACE FUNCTION get_critical_stock_count()
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_result
  FROM inventory_items
  WHERE COALESCE(quantity, 0) <= COALESCE(min_stock, 0);

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGERS
-- ==========================================

DROP TRIGGER IF EXISTS trigger_update_purchase_order_total ON purchase_order_items;

CREATE TRIGGER trigger_update_purchase_order_total
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_order_total();

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Allow all operations on purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Allow all operations on supplier_quotes" ON supplier_quotes;
DROP POLICY IF EXISTS "Allow all operations on purchase_schedules" ON purchase_schedules;

CREATE POLICY "Allow all operations on purchase_orders" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_order_items" ON purchase_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on supplier_quotes" ON supplier_quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_schedules" ON purchase_schedules FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE purchase_orders IS 'Pedidos de compra do departamento de compras';
COMMENT ON TABLE purchase_order_items IS 'Itens de cada pedido de compra';
COMMENT ON TABLE supplier_quotes IS 'Cotações de preços dos fornecedores';
COMMENT ON TABLE purchase_schedules IS 'Programação de compras recorrentes';
COMMENT ON FUNCTION generate_purchase_order_number IS 'Gera números sequenciais para pedidos (PO20250001)';
COMMENT ON FUNCTION generate_quote_number IS 'Gera números sequenciais para cotações (QT20250001)';
COMMENT ON FUNCTION update_purchase_order_total IS 'Atualiza totais do pedido automaticamente';
COMMENT ON FUNCTION get_items_needing_purchase IS 'Retorna itens com estoque baixo com dados completos';
COMMENT ON FUNCTION get_critical_stock_count IS 'Retorna contagem de itens críticos para badge';

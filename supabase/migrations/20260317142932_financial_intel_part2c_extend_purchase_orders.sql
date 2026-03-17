/*
  # Parte 2c: Extender purchase_orders existente com service_order_id e tipo
  
  A tabela purchase_orders já existe com esquema anterior.
  Adicionamos as colunas necessárias para integração com OS.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='service_order_id') THEN
    ALTER TABLE purchase_orders ADD COLUMN service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='tipo') THEN
    ALTER TABLE purchase_orders ADD COLUMN tipo text NOT NULL DEFAULT 'compra'
      CHECK (tipo IN ('compra','locacao'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='total_amount') THEN
    ALTER TABLE purchase_orders ADD COLUMN total_amount numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Garantir que a tabela purchase_order_items tem inventory_item_id como texto de fallback
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_order_items' AND column_name='inventory_item_id') THEN
    ALTER TABLE purchase_order_items ADD COLUMN inventory_item_id uuid REFERENCES inventory_items(id);
  END IF;
END $$;

-- RLS para purchase_orders (se ainda não existir)
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='purchase_orders' AND policyname='purchase_orders_read') THEN
    CREATE POLICY "purchase_orders_read"   ON purchase_orders FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "purchase_orders_insert" ON purchase_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
    CREATE POLICY "purchase_orders_update" ON purchase_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "purchase_orders_delete" ON purchase_orders FOR DELETE TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='purchase_order_items' AND policyname='poi_read') THEN
    CREATE POLICY "poi_read"   ON purchase_order_items FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "poi_insert" ON purchase_order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
    CREATE POLICY "poi_update" ON purchase_order_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "poi_delete" ON purchase_order_items FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_po_so_fk   ON purchase_orders(service_order_id);
CREATE INDEX IF NOT EXISTS idx_po_status2 ON purchase_orders(status);

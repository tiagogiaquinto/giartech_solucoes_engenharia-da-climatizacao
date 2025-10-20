/*
  # Criar Tabelas Finais - Parte 3

  Últimas tabelas do sistema
*/

-- CAMPANHAS WHATSAPP
CREATE TABLE IF NOT EXISTS wpp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wpp_account_id uuid REFERENCES wpp_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  message_template text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled')),
  scheduled_at timestamptz,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  read_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all wpp_campaigns" ON wpp_campaigns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TAGS WHATSAPP
CREATE TABLE IF NOT EXISTS wpp_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all wpp_tags" ON wpp_tags
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TAGS DOS CONTATOS
CREATE TABLE IF NOT EXISTS wpp_contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wpp_contact_id uuid REFERENCES wpp_contacts(id) ON DELETE CASCADE,
  wpp_tag_id uuid REFERENCES wpp_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wpp_contact_id, wpp_tag_id)
);

ALTER TABLE wpp_contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all wpp_contact_tags" ON wpp_contact_tags
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MATERIAIS DAS ORDENS DE SERVIÇO
CREATE TABLE IF NOT EXISTS service_order_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id),
  quantity numeric DEFAULT 1,
  unit_price numeric DEFAULT 0,
  total_price numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_order_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all service_order_materials" ON service_order_materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MÃO DE OBRA DAS ORDENS DE SERVIÇO
CREATE TABLE IF NOT EXISTS service_order_labor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  hours numeric DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  staff_id uuid REFERENCES staff(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_order_labor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all service_order_labor" ON service_order_labor
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CATÁLOGO DE SERVIÇOS (catalog_services)
CREATE TABLE IF NOT EXISTS catalog_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  name text NOT NULL,
  description text,
  category text,
  base_price numeric DEFAULT 0,
  estimated_hours numeric DEFAULT 0,
  complexity text CHECK (complexity IN ('simple', 'medium', 'complex')),
  requires_certification boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE catalog_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all catalog_services" ON catalog_services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MATERIAIS DO CATÁLOGO DE SERVIÇOS
CREATE TABLE IF NOT EXISTS catalog_service_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_service_id uuid REFERENCES catalog_services(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id),
  quantity numeric DEFAULT 1,
  is_optional boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE catalog_service_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all catalog_service_materials" ON catalog_service_materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TAREFAS DO CATÁLOGO
CREATE TABLE IF NOT EXISTS catalog_service_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_service_id uuid REFERENCES catalog_services(id) ON DELETE CASCADE,
  task_order integer DEFAULT 0,
  title text NOT NULL,
  description text,
  estimated_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE catalog_service_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all catalog_service_tasks" ON catalog_service_tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MATERIAIS DO SERVICE_CATALOG
CREATE TABLE IF NOT EXISTS service_catalog_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_catalog_id uuid REFERENCES service_catalog(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id),
  quantity numeric DEFAULT 1,
  is_optional boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_catalog_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all service_catalog_materials" ON service_catalog_materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MÃO DE OBRA DO SERVICE_CATALOG
CREATE TABLE IF NOT EXISTS service_catalog_labor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_catalog_id uuid REFERENCES service_catalog(id) ON DELETE CASCADE,
  description text NOT NULL,
  hours numeric DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_catalog_labor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all service_catalog_labor" ON service_catalog_labor
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ETAPAS DO SERVICE_CATALOG
CREATE TABLE IF NOT EXISTS service_catalog_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_catalog_id uuid REFERENCES service_catalog(id) ON DELETE CASCADE,
  step_order integer DEFAULT 0,
  title text NOT NULL,
  description text,
  estimated_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_catalog_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all service_catalog_steps" ON service_catalog_steps
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Adicionar FK em inventory_items para suppliers
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_supplier_id_fkey;
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_supplier_id_fkey 
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_customer ON agenda(customer_id);
CREATE INDEX IF NOT EXISTS idx_agenda_staff ON agenda(staff_id);
CREATE INDEX IF NOT EXISTS idx_agenda_dates ON agenda(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_wpp_messages_contact ON wpp_messages(wpp_contact_id);
CREATE INDEX IF NOT EXISTS idx_wpp_contacts_account ON wpp_contacts(wpp_account_id);
CREATE INDEX IF NOT EXISTS idx_service_order_materials_order ON service_order_materials(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_labor_order ON service_order_labor(service_order_id);

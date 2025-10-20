/*
  # Sistema de Gestão de Ordens de Serviço - Schema Completo
  
  ## Estrutura do Banco de Dados
  
  Este sistema gerencia ordens de serviço, clientes, estoque, usuários e integrações financeiras.
  
  ## 1. Tabelas Criadas
  
  ### Gestão de Usuários e Autenticação
  - `users` - Usuários do sistema com roles e permissões
  - `permissions` - Permissões específicas do sistema
  - `role_permissions` - Relacionamento entre roles e permissões
  
  ### Gestão de Clientes
  - `clients` - Cadastro de clientes PF e PJ
  - `contracts` - Contratos de manutenção e SLA
  - `client_inventory` - Equipamentos e inventário por cliente
  
  ### Gestão de Ordens de Serviço
  - `service_orders` - Ordens de serviço principais
  - `service_order_history` - Histórico de alterações das OS
  - `service_catalog` - Catálogo de serviços disponíveis
  
  ### Gestão de Estoque
  - `inventory_items` - Itens do estoque
  - `inventory_movements` - Movimentações de estoque
  
  ### Integração Financeira
  - `financial_tasks` - Tarefas de cobrança
  - `invoices` - Notas fiscais emitidas
  - `invoice_items` - Itens das notas fiscais
  - `payments` - Registros de pagamentos
  
  ### Outras Entidades
  - `departments` - Departamentos da empresa
  - `projects` - Projetos e agrupamentos de OS
  - `attachments` - Arquivos anexados
  - `notifications` - Notificações do sistema
  - `audit_logs` - Logs de auditoria
  
  ## 2. Segurança
  
  - RLS (Row Level Security) habilitado em todas as tabelas
  - Políticas específicas por tipo de usuário
  - Auditoria completa de ações
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'technician', 'external', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE client_type AS ENUM ('PF', 'PJ');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('active', 'expired', 'cancelled', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE contract_type AS ENUM ('maintenance', 'support', 'service', 'consulting');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE frequency_type AS ENUM ('monthly', 'quarterly', 'biannual', 'annual', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE financial_status AS ENUM ('pending', 'invoiced', 'paid', 'overdue', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'pix', 'check', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'return');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar text,
  role user_role DEFAULT 'viewer' NOT NULL,
  status user_status DEFAULT 'active' NOT NULL,
  department_id uuid,
  phone text,
  last_login timestamptz,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid REFERENCES users(id),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view departments" ON departments;
CREATE POLICY "Users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view permissions" ON permissions;
CREATE POLICY "Users can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(role, permission_id)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
CREATE POLICY "Users can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  address text NOT NULL,
  client_type client_type NOT NULL,
  document text,
  company_name text,
  trade_name text,
  state_registration text,
  is_active boolean DEFAULT true NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view clients" ON clients;
CREATE POLICY "Users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert clients" ON clients;
CREATE POLICY "Users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager', 'technician')
    )
  );

DROP POLICY IF EXISTS "Users can update clients" ON clients;
CREATE POLICY "Users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager', 'technician')
    )
  );

DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  contract_number text UNIQUE NOT NULL,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  contract_type contract_type NOT NULL,
  frequency frequency_type,
  value numeric(15, 2) NOT NULL DEFAULT 0,
  status contract_status DEFAULT 'active' NOT NULL,
  sla_response_time integer,
  sla_resolution_time integer,
  sla_availability numeric(5, 2),
  next_service_date date,
  terms_and_conditions text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view contracts" ON contracts;
CREATE POLICY "Users can view contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage contracts" ON contracts;
CREATE POLICY "Users can manage contracts"
  ON contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE TABLE IF NOT EXISTS client_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  equipment text NOT NULL,
  brand text,
  model text,
  serial_number text,
  install_date date,
  last_maintenance date,
  next_maintenance date,
  warranty_expiry date,
  status text DEFAULT 'active' NOT NULL,
  location text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE client_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view client inventory" ON client_inventory;
CREATE POLICY "Users can view client inventory"
  ON client_inventory FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage client inventory" ON client_inventory;
CREATE POLICY "Users can manage client inventory"
  ON client_inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager', 'technician')
    )
  );

CREATE TABLE IF NOT EXISTS service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  estimated_duration integer,
  base_price numeric(15, 2) DEFAULT 0,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view service catalog" ON service_catalog;
CREATE POLICY "Users can view service catalog"
  ON service_catalog FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Managers can manage service catalog" ON service_catalog;
CREATE POLICY "Managers can manage service catalog"
  ON service_catalog FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) NOT NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_address text NOT NULL,
  service_type text NOT NULL,
  description text NOT NULL,
  priority order_priority DEFAULT 'medium' NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  assigned_to text,
  assigned_user_id uuid REFERENCES users(id),
  created_by uuid REFERENCES users(id),
  due_date date NOT NULL,
  estimated_value numeric(15, 2),
  actual_value numeric(15, 2),
  notes text,
  internal_notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view service orders" ON service_orders;
CREATE POLICY "Users can view service orders"
  ON service_orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create service orders" ON service_orders;
CREATE POLICY "Users can create service orders"
  ON service_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager', 'technician')
    )
  );

DROP POLICY IF EXISTS "Users can update service orders" ON service_orders;
CREATE POLICY "Users can update service orders"
  ON service_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager', 'technician')
    )
  );

DROP POLICY IF EXISTS "Admins can delete service orders" ON service_orders;
CREATE POLICY "Admins can delete service orders"
  ON service_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS service_order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  changed_by uuid REFERENCES users(id) NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE service_order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view service order history" ON service_order_history;
CREATE POLICY "Users can view service order history"
  ON service_order_history FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  quantity integer DEFAULT 0 NOT NULL,
  min_stock integer DEFAULT 0 NOT NULL,
  price numeric(15, 2) DEFAULT 0 NOT NULL,
  supplier text NOT NULL,
  description text,
  sku text,
  location text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view inventory items" ON inventory_items;
CREATE POLICY "Users can view inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage inventory items" ON inventory_items;
CREATE POLICY "Users can manage inventory items"
  ON inventory_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager', 'technician')
    )
  );

CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
  movement_type movement_type NOT NULL,
  quantity integer NOT NULL,
  reference_id uuid,
  reference_type text,
  notes text,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view inventory movements" ON inventory_movements;
CREATE POLICY "Users can view inventory movements"
  ON inventory_movements FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create inventory movements" ON inventory_movements;
CREATE POLICY "Users can create inventory movements"
  ON inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager', 'technician')
    )
  );

CREATE TABLE IF NOT EXISTS financial_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  service_order_id uuid REFERENCES service_orders(id),
  client_name text NOT NULL,
  client_type client_type NOT NULL,
  service_value numeric(15, 2) NOT NULL DEFAULT 0,
  status financial_status DEFAULT 'pending' NOT NULL,
  due_date date NOT NULL,
  invoice_number text,
  payment_method payment_method,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE financial_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view financial tasks" ON financial_tasks;
CREATE POLICY "Users can view financial tasks"
  ON financial_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can manage financial tasks" ON financial_tasks;
CREATE POLICY "Users can manage financial tasks"
  ON financial_tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  order_number text NOT NULL,
  service_order_id uuid REFERENCES service_orders(id),
  client_id uuid REFERENCES clients(id) NOT NULL,
  client_name text NOT NULL,
  client_type client_type NOT NULL,
  value numeric(15, 2) NOT NULL DEFAULT 0,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  status invoice_status DEFAULT 'draft' NOT NULL,
  pdf_url text,
  xml_url text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view invoices" ON invoices;
CREATE POLICY "Users can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can manage invoices" ON invoices;
CREATE POLICY "Users can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  unit_price numeric(15, 2) NOT NULL DEFAULT 0,
  total numeric(15, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view invoice items" ON invoice_items;
CREATE POLICY "Users can view invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  amount numeric(15, 2) NOT NULL DEFAULT 0,
  payment_date date NOT NULL,
  payment_method payment_method NOT NULL,
  transaction_id text,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view payments" ON payments;
CREATE POLICY "Users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can create payments" ON payments;
CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  client_id uuid REFERENCES clients(id),
  start_date date,
  end_date date,
  status text DEFAULT 'active' NOT NULL,
  manager_id uuid REFERENCES users(id),
  budget numeric(15, 2),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view projects" ON projects;
CREATE POLICY "Users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Managers can manage projects" ON projects;
CREATE POLICY "Managers can manage projects"
  ON projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL,
  reference_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view attachments" ON attachments;
CREATE POLICY "Users can view attachments"
  ON attachments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can upload attachments" ON attachments;
CREATE POLICY "Users can upload attachments"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = uploaded_by::text);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type DEFAULT 'info' NOT NULL,
  status notification_status DEFAULT 'unread' NOT NULL,
  reference_id uuid,
  reference_type text,
  created_at timestamptz DEFAULT now() NOT NULL,
  read_at timestamptz
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_inventory_updated_at ON client_inventory;
CREATE TRIGGER update_client_inventory_updated_at BEFORE UPDATE ON client_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_catalog_updated_at ON service_catalog;
CREATE TRIGGER update_service_catalog_updated_at BEFORE UPDATE ON service_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_orders_updated_at ON service_orders;
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON service_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_tasks_updated_at ON financial_tasks;
CREATE TRIGGER update_financial_tasks_updated_at BEFORE UPDATE ON financial_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_service_orders_order_number ON service_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_service_orders_client_id ON service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_priority ON service_orders(priority);
CREATE INDEX IF NOT EXISTS idx_service_orders_assigned_user_id ON service_orders(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_due_date ON service_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX IF NOT EXISTS idx_financial_tasks_status ON financial_tasks(status);
CREATE INDEX IF NOT EXISTS idx_financial_tasks_due_date ON financial_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_tasks_service_order_id ON financial_tasks(service_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(number);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
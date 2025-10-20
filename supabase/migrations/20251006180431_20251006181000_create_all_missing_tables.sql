/*
  # Criar Todas as Tabelas Faltantes do Sistema

  1. Novas Tabelas
    - company_settings - Configurações da empresa
    - equipments - Equipamentos da empresa
    - inventory_items - Itens de estoque
    - stock_movements - Movimentações de estoque
    - staff - Equipe/funcionários
    - orders - Pedidos/ordens
    - order_items - Itens dos pedidos
    - order_staff - Equipe dos pedidos
    - finance_invoices - Notas fiscais
    - financial_transactions - Transações financeiras
    - bank_accounts - Contas bancárias
    - agenda - Agenda/calendário
    - crm_leads - Leads do CRM
    - empresas - Empresas cadastradas
    - user_profiles - Perfis de usuários
    - contract_types - Tipos de contratos
    - contracts - Contratos
    - tenants - Inquilinos/tenants multi-empresa
    - users - Usuários do sistema
    - suppliers - Fornecedores
    - projects - Projetos
    - inventory_movements - Movimentações de inventário
    - wpp_accounts - Contas WhatsApp
    - wpp_contacts - Contatos WhatsApp
    - wpp_messages - Mensagens WhatsApp
    - wpp_campaigns - Campanhas WhatsApp
    - wpp_tags - Tags WhatsApp
    - wpp_contact_tags - Tags dos contatos
    - service_order_materials - Materiais das OS
    - service_order_labor - Mão de obra das OS
    - catalog_services - Catálogo de serviços
    - catalog_service_materials - Materiais do catálogo
    - catalog_service_tasks - Tarefas do catálogo
    - service_catalog_materials - Materiais do catálogo (alt)
    - service_catalog_labor - Mão de obra do catálogo
    - service_catalog_steps - Etapas do catálogo

  2. Security
    - RLS habilitado em todas as tabelas
    - Policies básicas de acesso
*/

-- CONFIGURAÇÕES DA EMPRESA
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  cnpj text,
  email text,
  phone text,
  address text,
  logo_url text,
  primary_color text DEFAULT '#3b82f6',
  secondary_color text DEFAULT '#10b981',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read company_settings" ON company_settings
  FOR SELECT TO authenticated USING (true);

-- EQUIPAMENTOS DA EMPRESA
CREATE TABLE IF NOT EXISTS equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  brand text,
  model text,
  serial_number text,
  purchase_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all equipments" ON equipments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ITENS DE ESTOQUE
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  name text NOT NULL,
  description text,
  category text,
  unit text DEFAULT 'un',
  quantity numeric DEFAULT 0,
  min_quantity numeric DEFAULT 0,
  max_quantity numeric,
  unit_cost numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  location text,
  supplier_id uuid,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all inventory_items" ON inventory_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
  quantity numeric NOT NULL,
  unit_cost numeric,
  total_cost numeric,
  reason text,
  reference_type text,
  reference_id uuid,
  user_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all stock_movements" ON stock_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EQUIPE/FUNCIONÁRIOS (STAFF)
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  role text,
  department text,
  hire_date date,
  salary numeric,
  status text DEFAULT 'active' CHECK (status IN ('active', 'vacation', 'inactive')),
  user_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all staff" ON staff
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PEDIDOS/ORDENS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id),
  order_date date DEFAULT CURRENT_DATE,
  delivery_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all orders" ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ITENS DOS PEDIDOS
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  item_type text DEFAULT 'product' CHECK (item_type IN ('product', 'service')),
  item_id uuid,
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit_price numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all order_items" ON order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EQUIPE DOS PEDIDOS
CREATE TABLE IF NOT EXISTS order_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  role text CHECK (role IN ('leader', 'technician', 'assistant', 'supervisor')),
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all order_staff" ON order_staff
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- NOTAS FISCAIS
CREATE TABLE IF NOT EXISTS finance_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  invoice_type text CHECK (invoice_type IN ('sale', 'purchase', 'service')),
  customer_id uuid REFERENCES customers(id),
  issue_date date DEFAULT CURRENT_DATE,
  due_date date,
  total numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'overdue')),
  payment_method text,
  notes text,
  xml_file text,
  pdf_file text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE finance_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all finance_invoices" ON finance_invoices
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CONTAS BANCÁRIAS
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  bank_name text,
  account_number text,
  agency text,
  account_type text CHECK (account_type IN ('checking', 'savings', 'investment')),
  balance numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all bank_accounts" ON bank_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRANSAÇÕES FINANCEIRAS
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid REFERENCES bank_accounts(id),
  transaction_date date DEFAULT CURRENT_DATE,
  transaction_type text CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  category text,
  amount numeric NOT NULL,
  description text,
  reference_type text,
  reference_id uuid,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all financial_transactions" ON financial_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AGENDA/CALENDÁRIO
CREATE TABLE IF NOT EXISTS agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  event_type text,
  customer_id uuid REFERENCES customers(id),
  staff_id uuid REFERENCES staff(id),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all agenda" ON agenda
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CRM LEADS
CREATE TABLE IF NOT EXISTS crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  source text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  score integer DEFAULT 0,
  assigned_to uuid REFERENCES staff(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all crm_leads" ON crm_leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CONTINUA NA PRÓXIMA PARTE...

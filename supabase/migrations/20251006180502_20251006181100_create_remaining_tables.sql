/*
  # Criar Tabelas Restantes - Parte 2

  Continuação da criação de tabelas do sistema
*/

-- EMPRESAS (MULTI-TENANT)
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text UNIQUE,
  inscricao_estadual text,
  inscricao_municipal text,
  email text,
  telefone text,
  website text,
  logo_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all empresas" ON empresas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'technician', 'user')),
  department text,
  phone text,
  empresa_id uuid REFERENCES empresas(id),
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all user_profiles" ON user_profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TIPOS DE CONTRATOS
CREATE TABLE IF NOT EXISTS contract_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration_months integer,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all contract_types" ON contract_types
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CONTRATOS
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id),
  contract_type_id uuid REFERENCES contract_types(id),
  start_date date NOT NULL,
  end_date date,
  value numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'suspended', 'cancelled', 'expired')),
  payment_frequency text CHECK (payment_frequency IN ('monthly', 'quarterly', 'semiannual', 'annual', 'one-time')),
  notes text,
  document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all contracts" ON contracts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TENANTS (MULTI-EMPRESA)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE,
  empresa_id uuid REFERENCES empresas(id),
  active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all tenants" ON tenants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- USUÁRIOS DO SISTEMA
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'user',
  active boolean DEFAULT true,
  empresa_id uuid REFERENCES empresas(id),
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users" ON users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- FORNECEDORES
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  email text,
  phone text,
  address text,
  contact_person text,
  payment_terms text,
  active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all suppliers" ON suppliers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PROJETOS
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  customer_id uuid REFERENCES customers(id),
  start_date date,
  end_date date,
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  budget numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  progress_percentage integer DEFAULT 0,
  manager_id uuid REFERENCES staff(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all projects" ON projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MOVIMENTAÇÕES DE INVENTÁRIO
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type text CHECK (movement_type IN ('purchase', 'sale', 'return', 'adjustment', 'transfer')),
  quantity numeric NOT NULL,
  unit_cost numeric,
  reference_type text,
  reference_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all inventory_movements" ON inventory_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CONTAS WHATSAPP
CREATE TABLE IF NOT EXISTS wpp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  status text DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  qr_code text,
  session_data jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all wpp_accounts" ON wpp_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CONTATOS WHATSAPP
CREATE TABLE IF NOT EXISTS wpp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wpp_account_id uuid REFERENCES wpp_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  customer_id uuid REFERENCES customers(id),
  profile_pic_url text,
  last_message_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(wpp_account_id, phone)
);

ALTER TABLE wpp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all wpp_contacts" ON wpp_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MENSAGENS WHATSAPP
CREATE TABLE IF NOT EXISTS wpp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wpp_account_id uuid REFERENCES wpp_accounts(id) ON DELETE CASCADE,
  wpp_contact_id uuid REFERENCES wpp_contacts(id) ON DELETE CASCADE,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document')),
  content text,
  media_url text,
  direction text CHECK (direction IN ('inbound', 'outbound')),
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all wpp_messages" ON wpp_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CONTINUA...

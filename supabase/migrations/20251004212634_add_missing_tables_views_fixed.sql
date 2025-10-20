/*
  # Adicionar Tabelas e Views Complementares (Corrigido)
  
  Implementação das tabelas e views que faltam no sistema,
  compatível com os enum types existentes.
  
  ## Novas Tabelas
  - `users` - Sistema de usuários
  - `suppliers` - Fornecedores
  - `financial_transactions` - Transações financeiras
  - `bank_accounts` - Contas bancárias
  - `projects` - Projetos
  - `user_invitations` - Convites
  - `user_credentials` - Credenciais
  - `service_order_team` - Equipe das OS
  
  ## Views
  - Views para alias de compatibilidade
  - Views para dashboard executivo
*/

-- ============================================================
-- TABELA: users
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text CHECK (role IN ('admin', 'manager', 'technician', 'external', 'viewer')) DEFAULT 'viewer',
  avatar text,
  status text CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  department_id uuid,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_policy_all" ON users;
CREATE POLICY "users_policy_all" ON users FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- TABELA: suppliers
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  company_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suppliers_policy_all" ON suppliers;
CREATE POLICY "suppliers_policy_all" ON suppliers FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- TABELA: financial_transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  type text CHECK (type IN ('income', 'expense')) NOT NULL,
  status text CHECK (status IN ('paid', 'pending', 'cancelled')) DEFAULT 'pending',
  date date NOT NULL,
  payment_method text,
  category_id uuid,
  client_id uuid,
  supplier_id uuid,
  account_id uuid,
  service_order_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_transactions_policy_all" ON financial_transactions;
CREATE POLICY "financial_transactions_policy_all" ON financial_transactions FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);

-- ============================================================
-- TABELA: bank_accounts
-- ============================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  bank_name text,
  account_number text,
  current_balance numeric(12,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_accounts_policy_all" ON bank_accounts;
CREATE POLICY "bank_accounts_policy_all" ON bank_accounts FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- TABELA: projects
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  client_id uuid,
  status text CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  start_date date,
  end_date date,
  budget numeric(12,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_policy_all" ON projects;
CREATE POLICY "projects_policy_all" ON projects FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============================================================
-- TABELA: user_invitations
-- ============================================================

CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('admin', 'technician', 'external')) NOT NULL,
  invited_by uuid,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_invitations_policy_all" ON user_invitations;
CREATE POLICY "user_invitations_policy_all" ON user_invitations FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);

-- ============================================================
-- TABELA: user_credentials
-- ============================================================

CREATE TABLE IF NOT EXISTS user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  password_hash text NOT NULL,
  last_login timestamptz,
  failed_attempts integer DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_credentials_policy_all" ON user_credentials;
CREATE POLICY "user_credentials_policy_all" ON user_credentials FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);

-- ============================================================
-- TABELA: service_order_team
-- ============================================================

CREATE TABLE IF NOT EXISTS service_order_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  role text CHECK (role IN ('leader', 'technician', 'assistant', 'supervisor')),
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_order_id, employee_id)
);

ALTER TABLE service_order_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_order_team_policy_all" ON service_order_team;
CREATE POLICY "service_order_team_policy_all" ON service_order_team FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_service_order_team_order_id ON service_order_team(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_team_employee_id ON service_order_team(employee_id);

-- ============================================================
-- VIEWS DE ALIAS (Compatibilidade)
-- ============================================================

-- View: clients (Alias para customers)
CREATE OR REPLACE VIEW clients AS
SELECT
  id,
  nome_razao as name,
  nome_razao as company_name,
  tipo as client_type,
  cpf_cnpj as document,
  email,
  telefone as phone,
  obs as notes,
  CASE WHEN id IS NOT NULL THEN true ELSE false END as is_active,
  created_at,
  created_at as updated_at,
  '' as address,
  '' as city,
  '' as state,
  '' as postal_code
FROM customers;

-- View: employees (Alias para staff)
CREATE OR REPLACE VIEW employees AS
SELECT
  id,
  NULL::uuid as user_id,
  nome as full_name,
  '' as email,
  '' as phone,
  cargo as position,
  '' as department,
  NULL::date as hire_date,
  salario as salary,
  ativo as is_active,
  created_at,
  created_at as updated_at
FROM staff;

-- View: service_catalog (Alias para catalog_services)
CREATE OR REPLACE VIEW service_catalog AS
SELECT
  id,
  nome as name,
  descricao as description,
  '' as category,
  preco as base_price,
  0 as estimated_duration,
  ativo as is_active,
  now() as created_at,
  now() as updated_at
FROM catalog_services;

-- View: inventory (Alias para inventory_items)
CREATE OR REPLACE VIEW inventory AS
SELECT
  id,
  nome as name,
  descricao as description,
  sku,
  '' as category,
  estoque_qtd as quantity,
  0::numeric as min_quantity,
  preco_compra as unit_price,
  '' as location,
  ativo as is_active,
  now() as created_at,
  now() as updated_at
FROM inventory_items;

-- View: financial_categories (Alias para finance_categories)
CREATE OR REPLACE VIEW financial_categories AS
SELECT
  id,
  nome as name,
  '' as color,
  CASE 
    WHEN natureza = 'receita' THEN 'income'
    WHEN natureza = 'despesa' THEN 'expense'
    ELSE 'both'
  END as type,
  ativo as is_active,
  now() as created_at,
  now() as updated_at
FROM finance_categories;

-- View: calendar_events (Alias para agenda)
CREATE OR REPLACE VIEW calendar_events AS
SELECT
  id,
  descricao as title,
  descricao as description,
  (data::text || ' ' || COALESCE(hora::text, '00:00'))::timestamptz as start_date,
  (data::text || ' ' || COALESCE(hora::text, '00:00'))::timestamptz as end_date,
  false as all_day,
  '' as location,
  NULL::jsonb as attendees,
  NULL::uuid as created_by,
  created_at,
  created_at as updated_at
FROM agenda;

-- ============================================================
-- VIEWS DE DASHBOARD
-- ============================================================

-- View principal de métricas gerais
CREATE OR REPLACE VIEW v_dashboard_metrics AS
SELECT
  -- ORDENS DE SERVIÇO
  (SELECT COUNT(*) FROM service_orders) as total_service_orders,
  (SELECT COUNT(*) FROM service_orders WHERE status::text LIKE '%ABERTA%') as orders_pending,
  (SELECT COUNT(*) FROM service_orders WHERE status::text LIKE '%EXECUÇÃO%') as orders_in_progress,
  (SELECT COUNT(*) FROM service_orders WHERE status::text LIKE '%CONCLUIDA%') as orders_completed,
  (SELECT COUNT(*) FROM service_orders WHERE status::text LIKE '%CANCELADA%') as orders_cancelled,

  -- CLIENTES
  (SELECT COUNT(*) FROM customers) as total_clients,
  (SELECT COUNT(*) FROM customers WHERE tipo = 'PF') as clients_pf,
  (SELECT COUNT(*) FROM customers WHERE tipo = 'PJ') as clients_pj,
  (SELECT COUNT(*) FROM customers WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_clients_30d,

  -- ESTOQUE
  (SELECT COUNT(*) FROM inventory_items WHERE ativo = true) as total_inventory_items,
  (SELECT COALESCE(SUM(estoque_qtd), 0) FROM inventory_items WHERE ativo = true) as total_inventory_quantity,
  (SELECT COALESCE(SUM(estoque_qtd * preco_compra), 0) FROM inventory_items WHERE ativo = true) as total_inventory_value,
  (SELECT COUNT(*) FROM inventory_items WHERE estoque_qtd < 10 AND ativo = true) as items_low_stock,

  -- FUNCIONÁRIOS
  (SELECT COUNT(*) FROM staff WHERE ativo = true) as total_employees,

  -- FORNECEDORES
  (SELECT COUNT(*) FROM suppliers WHERE is_active = true) as total_suppliers,

  -- PROJETOS
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM projects WHERE status = 'active') as projects_active,
  (SELECT COUNT(*) FROM projects WHERE status = 'completed') as projects_completed,

  -- EVENTOS/AGENDA
  (SELECT COUNT(*) FROM agenda WHERE data >= CURRENT_DATE) as upcoming_events,
  (SELECT COUNT(*) FROM agenda WHERE data = CURRENT_DATE) as events_today,

  -- SERVIÇOS NO CATÁLOGO
  (SELECT COUNT(*) FROM catalog_services WHERE ativo = true) as total_services;

-- View financeira
CREATE OR REPLACE VIEW v_dashboard_financial AS
SELECT
  -- RECEITAS
  (SELECT COALESCE(SUM(valor), 0)
   FROM finance_entries
   WHERE tipo = 'receita' AND status = 'recebido'
  ) as total_income_paid,

  (SELECT COALESCE(SUM(valor), 0)
   FROM finance_entries
   WHERE tipo = 'receita' AND status = 'a_receber'
  ) as total_income_pending,

  (SELECT COALESCE(SUM(valor), 0)
   FROM finance_entries
   WHERE tipo = 'receita' AND status = 'recebido'
   AND data >= DATE_TRUNC('month', CURRENT_DATE)
  ) as income_current_month,

  -- DESPESAS
  (SELECT COALESCE(SUM(valor), 0)
   FROM finance_entries
   WHERE tipo = 'despesa' AND status = 'pago'
  ) as total_expense_paid,

  (SELECT COALESCE(SUM(valor), 0)
   FROM finance_entries
   WHERE tipo = 'despesa' AND status = 'a_pagar'
  ) as total_expense_pending,

  (SELECT COALESCE(SUM(valor), 0)
   FROM finance_entries
   WHERE tipo = 'despesa' AND status = 'pago'
   AND data >= DATE_TRUNC('month', CURRENT_DATE)
  ) as expense_current_month,

  -- CONTAS A RECEBER
  (SELECT COUNT(*)
   FROM finance_entries
   WHERE tipo = 'receita' AND status = 'a_receber'
  ) as accounts_receivable_count,

  (SELECT COALESCE(SUM(valor), 0)
   FROM finance_entries
   WHERE tipo = 'receita' AND status = 'a_receber'
  ) as accounts_receivable_value,

  -- CONTAS A PAGAR
  (SELECT COUNT(*)
   FROM finance_entries
   WHERE tipo = 'despesa' AND status = 'a_pagar'
  ) as accounts_payable_count,

  (SELECT COALESCE(SUM(valor), 0)
   FROM finance_entries
   WHERE tipo = 'despesa' AND status = 'a_pagar'
  ) as accounts_payable_value,

  -- SALDO
  (SELECT COALESCE(SUM(current_balance), 0)
   FROM bank_accounts
   WHERE is_active = true
  ) as total_bank_balance;

-- View de faturamento mensal
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
  TO_CHAR(data, 'YYYY-MM') as month,
  TO_CHAR(data, 'Mon/YYYY') as month_label,
  EXTRACT(YEAR FROM data) as year,
  EXTRACT(MONTH FROM data) as month_number,

  COALESCE(SUM(CASE WHEN tipo = 'receita' AND status = 'recebido' THEN valor ELSE 0 END), 0) as income,
  COALESCE(SUM(CASE WHEN tipo = 'despesa' AND status = 'pago' THEN valor ELSE 0 END), 0) as expense,
  COALESCE(SUM(CASE WHEN tipo = 'receita' AND status = 'recebido' THEN valor ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN tipo = 'despesa' AND status = 'pago' THEN valor ELSE 0 END), 0) as profit

FROM finance_entries
WHERE data >= CURRENT_DATE - INTERVAL '12 months'
  AND status IN ('recebido', 'pago')
GROUP BY TO_CHAR(data, 'YYYY-MM'), TO_CHAR(data, 'Mon/YYYY'), EXTRACT(YEAR FROM data), EXTRACT(MONTH FROM data)
ORDER BY year DESC, month_number DESC;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_invitations_updated_at ON user_invitations;
CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON user_invitations 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_credentials_updated_at ON user_credentials;
CREATE TRIGGER update_user_credentials_updated_at BEFORE UPDATE ON user_credentials 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Inserir usuário admin padrão
INSERT INTO users (id, email, name, role, status)
VALUES (
  'a0000000-0000-0000-0000-000000000000',
  'admin@sistema.com',
  'Administrador',
  'admin',
  'active'
)
ON CONFLICT (email) DO NOTHING;

-- Inserir conta bancária padrão
INSERT INTO bank_accounts (account_name, bank_name, current_balance, is_active)
VALUES ('Conta Principal', 'Banco Padrão', 0, true)
ON CONFLICT DO NOTHING;

/*
  # Sistema Completo GiarTech - Base de Dados e WhatsApp CRM
  
  ## Visão Geral
  Este script cria toda a estrutura do banco de dados para o sistema GiarTech,
  incluindo o novo departamento de WhatsApp CRM para gestão de contatos e contas.
  
  ## Novas Tabelas Criadas
  
  ### 1. Tabelas Base do Sistema
  - `customers` - Clientes (PF/PJ)
  - `staff` - Funcionários
  - `catalog_services` - Catálogo de serviços
  - `inventory_items` - Itens de estoque
  - `service_orders` - Ordens de serviço
  - `finance_categories` - Categorias financeiras
  - `finance_entries` - Lançamentos financeiros
  - `agenda` - Eventos e compromissos
  
  ### 2. WhatsApp CRM (Novo Departamento)
  - `wpp_accounts` - Contas do WhatsApp conectadas
  - `wpp_contacts` - Contatos do WhatsApp
  - `wpp_messages` - Histórico de mensagens
  - `wpp_campaigns` - Campanhas de marketing
  - `wpp_tags` - Tags para organização
  - `wpp_contact_tags` - Relacionamento contatos-tags
  
  ### 3. Tabelas de Suporte
  - `service_order_items` - Múltiplos serviços por OS
  - `service_order_team` - Equipe atribuída à OS
  - `users` - Usuários do sistema
  - `user_profiles` - Perfis de usuário
  
  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas permissivas para desenvolvimento
  - Triggers para atualização automática de timestamps
*/

-- ============================================================
-- TABELA: customers (Clientes)
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_razao text NOT NULL,
  tipo text CHECK (tipo IN ('PF', 'PJ')) NOT NULL,
  cpf_cnpj text UNIQUE,
  email text,
  telefone text,
  endereco text,
  cidade text,
  estado text,
  cep text,
  obs text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_policy_all" ON customers FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_customers_tipo ON customers(tipo);
CREATE INDEX IF NOT EXISTS idx_customers_cpf_cnpj ON customers(cpf_cnpj);

-- ============================================================
-- TABELA: staff (Funcionários)
-- ============================================================

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cargo text,
  salario numeric(12,2),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_policy_all" ON staff FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- TABELA: catalog_services (Catálogo de Serviços)
-- ============================================================

CREATE TABLE IF NOT EXISTS catalog_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  preco numeric(12,2),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE catalog_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog_services_policy_all" ON catalog_services FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- TABELA: inventory_items (Itens de Estoque)
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  sku text UNIQUE,
  estoque_qtd integer DEFAULT 0,
  preco_compra numeric(12,2),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_items_policy_all" ON inventory_items FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);

-- ============================================================
-- TABELA: service_orders (Ordens de Serviço)
-- ============================================================

CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_os text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id),
  data_abertura date DEFAULT CURRENT_DATE,
  data_prevista date,
  data_conclusao date,
  status text DEFAULT 'ABERTA',
  prioridade text DEFAULT 'MEDIA',
  descricao text,
  observacoes text,
  total_value numeric(12,2) DEFAULT 0,
  show_value boolean DEFAULT true,
  total_estimated_duration integer DEFAULT 0,
  generated_contract text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_orders_policy_all" ON service_orders FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_service_orders_numero ON service_orders(numero_os);
CREATE INDEX IF NOT EXISTS idx_service_orders_customer ON service_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);

-- ============================================================
-- TABELA: service_order_items (Itens da OS)
-- ============================================================

CREATE TABLE IF NOT EXISTS service_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  service_catalog_id uuid REFERENCES catalog_services(id),
  quantity decimal(10,2) DEFAULT 1 NOT NULL,
  unit_price numeric(12,2),
  total_price numeric(12,2),
  estimated_duration integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_order_items_policy_all" ON service_order_items FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_service_order_items_order ON service_order_items(service_order_id);

-- ============================================================
-- TABELA: finance_categories (Categorias Financeiras)
-- ============================================================

CREATE TABLE IF NOT EXISTS finance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  natureza text CHECK (natureza IN ('receita', 'despesa')) NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_categories_policy_all" ON finance_categories FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- TABELA: finance_entries (Lançamentos Financeiros)
-- ============================================================

CREATE TABLE IF NOT EXISTS finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL,
  tipo text CHECK (tipo IN ('receita', 'despesa')) NOT NULL,
  status text CHECK (status IN ('recebido', 'pago', 'a_receber', 'a_pagar')) NOT NULL,
  data date NOT NULL,
  categoria_id uuid REFERENCES finance_categories(id),
  customer_id uuid REFERENCES customers(id),
  service_order_id uuid REFERENCES service_orders(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_entries_policy_all" ON finance_entries FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_finance_entries_tipo ON finance_entries(tipo);
CREATE INDEX IF NOT EXISTS idx_finance_entries_data ON finance_entries(data);

-- ============================================================
-- TABELA: agenda (Eventos e Compromissos)
-- ============================================================

CREATE TABLE IF NOT EXISTS agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  data date NOT NULL,
  hora time,
  tipo text DEFAULT 'operacional',
  prioridade text DEFAULT 'medium',
  status text DEFAULT 'a_fazer',
  local text,
  responsavel text,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agenda_policy_all" ON agenda FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_agenda_data ON agenda(data);
CREATE INDEX IF NOT EXISTS idx_agenda_tipo ON agenda(tipo);

-- ============================================================
-- TABELA: users (Usuários do Sistema)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text CHECK (role IN ('admin', 'manager', 'technician', 'external', 'viewer')) DEFAULT 'viewer',
  avatar text,
  status text CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_policy_all" ON users FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Inserir usuário admin padrão
INSERT INTO users (email, name, role, status)
VALUES ('admin@giartech.com', 'Administrador', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- WHATSAPP CRM - DEPARTAMENTO COMPLETO
-- ============================================================

-- TABELA: wpp_accounts (Contas WhatsApp)
CREATE TABLE IF NOT EXISTS wpp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  status text CHECK (status IN ('connected', 'disconnected', 'pending')) DEFAULT 'pending',
  qr_code text,
  last_connection timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wpp_accounts_policy_all" ON wpp_accounts FOR ALL USING (true) WITH CHECK (true);

-- TABELA: wpp_contacts (Contatos WhatsApp)
CREATE TABLE IF NOT EXISTS wpp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES wpp_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  avatar_url text,
  customer_id uuid REFERENCES customers(id),
  is_blocked boolean DEFAULT false,
  notes text,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wpp_contacts_policy_all" ON wpp_contacts FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_wpp_contacts_phone ON wpp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_wpp_contacts_account ON wpp_contacts(account_id);

-- TABELA: wpp_messages (Mensagens)
CREATE TABLE IF NOT EXISTS wpp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES wpp_accounts(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES wpp_contacts(id) ON DELETE CASCADE,
  message_type text CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document')) DEFAULT 'text',
  content text,
  media_url text,
  direction text CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  status text CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wpp_messages_policy_all" ON wpp_messages FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_wpp_messages_contact ON wpp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_wpp_messages_created ON wpp_messages(created_at);

-- TABELA: wpp_campaigns (Campanhas)
CREATE TABLE IF NOT EXISTS wpp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES wpp_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  message text NOT NULL,
  status text CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled')) DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  read_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wpp_campaigns_policy_all" ON wpp_campaigns FOR ALL USING (true) WITH CHECK (true);

-- TABELA: wpp_tags (Tags para Organização)
CREATE TABLE IF NOT EXISTS wpp_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wpp_tags_policy_all" ON wpp_tags FOR ALL USING (true) WITH CHECK (true);

-- TABELA: wpp_contact_tags (Relacionamento Contatos-Tags)
CREATE TABLE IF NOT EXISTS wpp_contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES wpp_contacts(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES wpp_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, tag_id)
);

ALTER TABLE wpp_contact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wpp_contact_tags_policy_all" ON wpp_contact_tags FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_orders_updated_at ON service_orders;
CREATE TRIGGER update_service_orders_updated_at 
  BEFORE UPDATE ON service_orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wpp_accounts_updated_at ON wpp_accounts;
CREATE TRIGGER update_wpp_accounts_updated_at 
  BEFORE UPDATE ON wpp_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wpp_contacts_updated_at ON wpp_contacts;
CREATE TRIGGER update_wpp_contacts_updated_at 
  BEFORE UPDATE ON wpp_contacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wpp_campaigns_updated_at ON wpp_campaigns;
CREATE TRIGGER update_wpp_campaigns_updated_at 
  BEFORE UPDATE ON wpp_campaigns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DADOS DE TESTE PARA WHATSAPP CRM
-- ============================================================

-- Inserir conta WhatsApp de teste
INSERT INTO wpp_accounts (name, phone, status, is_active)
VALUES ('Conta Principal', '11969423646', 'connected', true)
ON CONFLICT DO NOTHING;

-- Inserir tags padrão
INSERT INTO wpp_tags (name, color) VALUES
  ('Cliente', '#22C55E'),
  ('Lead', '#3B82F6'),
  ('VIP', '#F59E0B'),
  ('Suporte', '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- Inserir contatos de teste
INSERT INTO wpp_contacts (account_id, name, phone, email)
SELECT 
  (SELECT id FROM wpp_accounts LIMIT 1),
  'Tatiane Cardoso da Silva Giaquinto',
  '11969423646',
  'gerente.giartechsolucoes@gmail.com'
WHERE NOT EXISTS (SELECT 1 FROM wpp_contacts LIMIT 1);

INSERT INTO wpp_contacts (account_id, name, phone, email)
SELECT 
  (SELECT id FROM wpp_accounts LIMIT 1),
  'Tiago Giaquinto',
  '11966617631',
  'diretor@giartechsolucoes.com.br'
WHERE (SELECT COUNT(*) FROM wpp_contacts) < 2;

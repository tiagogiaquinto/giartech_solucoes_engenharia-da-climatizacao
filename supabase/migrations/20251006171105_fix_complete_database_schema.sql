/*
  # Corrigir Schema Completo do Banco de Dados
  
  1. Tabelas Criadas:
    - customers: Clientes com dados completos (PF e PJ)
    - customer_addresses: Endereços dos clientes
    - customer_contacts: Contatos dos clientes
    - customer_equipment: Equipamentos dos clientes
    - finance_entries: Lançamentos financeiros (receitas e despesas)
    - service_orders: Ordens de serviço
    - service_catalog: Catálogo de serviços
    - materials: Materiais e peças
  
  2. Security:
    - RLS desabilitado temporariamente para testes
    - Políticas serão adicionadas posteriormente
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa text NOT NULL DEFAULT 'fisica' CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  nome_razao text NOT NULL,
  nome_fantasia text,
  cpf text,
  rg text,
  cnpj text,
  inscricao_estadual text,
  inscricao_municipal text,
  data_nascimento date,
  data_fundacao date,
  email text,
  telefone text,
  celular text,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'comercial' CHECK (tipo IN ('comercial', 'residencial', 'filial', 'outro')),
  nome_identificacao text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  principal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cargo text,
  email text,
  telefone text,
  celular text,
  departamento text,
  principal boolean DEFAULT false,
  recebe_notificacoes boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  customer_address_id uuid REFERENCES customer_addresses(id) ON DELETE SET NULL,
  tipo_equipamento text,
  marca text,
  modelo text,
  numero_serie text,
  capacidade text,
  data_instalacao date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric(10, 2) NOT NULL DEFAULT 0,
  tipo text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  status text NOT NULL CHECK (status IN ('recebido', 'pago', 'a_receber', 'a_pagar')),
  data date NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento date,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  categoria text,
  forma_pagamento text CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia')),
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  service_type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to text,
  due_date date,
  estimated_hours numeric(5, 2),
  actual_hours numeric(5, 2),
  total_cost numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  base_price numeric(10, 2) DEFAULT 0,
  estimated_duration numeric(5, 2),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  unit text,
  quantity numeric(10, 2) DEFAULT 0,
  min_quantity numeric(10, 2) DEFAULT 0,
  unit_price numeric(10, 2) DEFAULT 0,
  supplier text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_tipo_pessoa ON customers(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);
CREATE INDEX IF NOT EXISTS idx_customers_cnpj ON customers(cnpj);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_equipment_customer_id ON customer_equipment(customer_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_tipo ON finance_entries(tipo);
CREATE INDEX IF NOT EXISTS idx_finance_entries_status ON finance_entries(status);
CREATE INDEX IF NOT EXISTS idx_finance_entries_data ON finance_entries(data);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_customer_id ON service_orders(customer_id);

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;

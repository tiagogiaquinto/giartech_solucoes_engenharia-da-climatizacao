/*
  # Views e Sistema de Departamentos - LIMPO
  
  Cria todas as views faltantes e sistema de departamentos
*/

-- VIEW: Credit Scoring
CREATE OR REPLACE VIEW v_customer_credit_scoring AS
SELECT 
  c.id as customer_id,
  c.nome_razao as customer_name,
  c.tipo_pessoa as customer_type,
  c.email,
  c.telefone as phone,
  COALESCE(c.credit_score, 500) as credit_score,
  
  CASE 
    WHEN COALESCE(c.credit_score, 500) >= 800 THEN 'Excelente'
    WHEN COALESCE(c.credit_score, 500) >= 700 THEN 'Bom'
    WHEN COALESCE(c.credit_score, 500) >= 600 THEN 'Regular'
    WHEN COALESCE(c.credit_score, 500) >= 500 THEN 'Ruim'
    ELSE 'Muito Ruim'
  END as score_classification,
  
  CASE 
    WHEN COALESCE(c.credit_score, 500) >= 800 THEN '#10b981'
    WHEN COALESCE(c.credit_score, 500) >= 700 THEN '#3b82f6'
    WHEN COALESCE(c.credit_score, 500) >= 600 THEN '#f59e0b'
    WHEN COALESCE(c.credit_score, 500) >= 500 THEN '#ef4444'
    ELSE '#991b1b'
  END as score_color,
  
  COUNT(DISTINCT so.id) as total_orders,
  COUNT(DISTINCT so.id) FILTER (WHERE so.status IN ('completed', 'delivered')) as completed_orders,
  COALESCE(SUM(so.total_value) FILTER (WHERE so.status IN ('completed', 'delivered')), 0) as total_revenue,
  
  COUNT(DISTINCT fe.id) FILTER (WHERE fe.tipo = 'receita') as total_invoices,
  COUNT(DISTINCT fe.id) FILTER (WHERE fe.tipo = 'receita' AND fe.status = 'paid') as paid_invoices,
  COUNT(DISTINCT fe.id) FILTER (WHERE fe.tipo = 'receita' AND fe.status = 'overdue') as overdue_invoices,
  
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.tipo = 'receita' AND fe.status = 'paid'), 0) as total_paid,
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.tipo = 'receita' AND fe.status = 'overdue'), 0) as total_overdue,
  
  CASE 
    WHEN COUNT(DISTINCT fe.id) FILTER (WHERE fe.tipo = 'receita') > 0 
    THEN ROUND(
      COUNT(DISTINCT fe.id) FILTER (WHERE fe.tipo = 'receita' AND fe.status = 'paid')::numeric / 
      COUNT(DISTINCT fe.id) FILTER (WHERE fe.tipo = 'receita')::numeric * 100, 2
    )
    ELSE 0
  END as payment_rate,
  
  CASE 
    WHEN COALESCE(c.credit_score, 500) >= 700 THEN 'Aprovar'
    WHEN COALESCE(c.credit_score, 500) >= 600 THEN 'Aprovar com Garantia'
    WHEN COALESCE(c.credit_score, 500) >= 500 THEN 'Análise Manual'
    ELSE 'Negar'
  END as credit_recommendation,
  
  CASE 
    WHEN COALESCE(c.credit_score, 500) >= 800 THEN 50000
    WHEN COALESCE(c.credit_score, 500) >= 700 THEN 30000
    WHEN COALESCE(c.credit_score, 500) >= 600 THEN 15000
    WHEN COALESCE(c.credit_score, 500) >= 500 THEN 5000
    ELSE 0
  END as suggested_credit_limit,
  
  CASE 
    WHEN COALESCE(c.credit_score, 500) >= 700 THEN 'Baixo'
    WHEN COALESCE(c.credit_score, 500) >= 600 THEN 'Médio'
    WHEN COALESCE(c.credit_score, 500) >= 500 THEN 'Alto'
    ELSE 'Muito Alto'
  END as risk_level,
  
  MAX(so.created_at) as last_order_date,
  c.updated_at as score_updated_at

FROM customers c
LEFT JOIN service_orders so ON so.customer_id = c.id
LEFT JOIN finance_entries fe ON fe.customer_id = c.id
GROUP BY c.id, c.nome_razao, c.tipo_pessoa, c.email, c.telefone, c.credit_score, c.updated_at;

-- VIEW: CFO KPIs
CREATE OR REPLACE VIEW v_cfo_kpis AS
WITH financial_summary AS (
  SELECT 
    SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'paid') as total_income,
    SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'paid') as total_expenses,
    SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'pending') as pending_income,
    SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'overdue') as overdue_income,
    COUNT(*) FILTER (WHERE tipo = 'receita' AND status = 'overdue') as overdue_count
  FROM finance_entries
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
),
orders_summary AS (
  SELECT 
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status IN ('completed', 'delivered')) as completed_orders,
    COUNT(*) FILTER (WHERE status NOT IN ('completed', 'delivered', 'cancelled')) as active_orders,
    SUM(total_value) FILTER (WHERE status IN ('completed', 'delivered')) as completed_orders_value,
    AVG(total_value) FILTER (WHERE status IN ('completed', 'delivered')) as avg_order_value
  FROM service_orders
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
),
inventory_summary AS (
  SELECT 
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE quantity <= min_quantity) as critical_items,
    SUM(quantity * unit_cost) as total_inventory_value
  FROM inventory_items
),
customer_summary AS (
  SELECT 
    COUNT(*) as total_customers,
    COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) as new_customers_year,
    AVG(credit_score) as avg_credit_score
  FROM customers
)
SELECT 
  COALESCE(fs.total_income, 0) as total_income,
  COALESCE(fs.total_expenses, 0) as total_expenses,
  COALESCE(fs.total_income, 0) - COALESCE(fs.total_expenses, 0) as net_profit,
  CASE 
    WHEN COALESCE(fs.total_expenses, 0) > 0 
    THEN ROUND((COALESCE(fs.total_income, 0) - COALESCE(fs.total_expenses, 0)) / fs.total_expenses * 100, 2)
    ELSE 0 
  END as profit_margin,
  COALESCE(fs.pending_income, 0) as accounts_receivable,
  COALESCE(fs.overdue_income, 0) as overdue_amount,
  COALESCE(fs.overdue_count, 0) as overdue_count,
  COALESCE(os.total_orders, 0) as total_orders,
  COALESCE(os.completed_orders, 0) as completed_orders,
  COALESCE(os.active_orders, 0) as active_orders,
  COALESCE(os.completed_orders_value, 0) as completed_orders_value,
  COALESCE(os.avg_order_value, 0) as avg_order_value,
  CASE 
    WHEN COALESCE(os.total_orders, 0) > 0 
    THEN ROUND(os.completed_orders::numeric / os.total_orders::numeric * 100, 2)
    ELSE 0 
  END as order_completion_rate,
  COALESCE(inv.total_items, 0) as total_inventory_items,
  COALESCE(inv.critical_items, 0) as critical_inventory_items,
  COALESCE(inv.total_inventory_value, 0) as total_inventory_value,
  COALESCE(cust.total_customers, 0) as total_customers,
  COALESCE(cust.new_customers_year, 0) as new_customers_this_year,
  COALESCE(cust.avg_credit_score, 500) as avg_customer_credit_score,
  CASE 
    WHEN COALESCE(fs.total_income, 0) > COALESCE(fs.total_expenses, 0) THEN 'Lucrativo'
    WHEN COALESCE(fs.total_income, 0) = COALESCE(fs.total_expenses, 0) THEN 'Empate'
    ELSE 'Prejuízo'
  END as financial_health,
  CURRENT_TIMESTAMP as calculated_at
FROM financial_summary fs
CROSS JOIN orders_summary os
CROSS JOIN inventory_summary inv
CROSS JOIN customer_summary cust;

-- Tabelas de Departamentos
CREATE TABLE IF NOT EXISTS system_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  manager_id uuid REFERENCES employees(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS department_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code text UNIQUE NOT NULL REFERENCES system_departments(code),
  can_access_financial boolean DEFAULT false,
  can_access_service_orders boolean DEFAULT false,
  can_access_inventory boolean DEFAULT false,
  can_access_purchasing boolean DEFAULT false,
  can_access_customers boolean DEFAULT false,
  can_access_employees boolean DEFAULT false,
  can_access_reports boolean DEFAULT false,
  can_access_settings boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_approve boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Inserir departamentos
INSERT INTO system_departments (code, name, description, icon, color) VALUES
('FINANCIAL', 'Financeiro', 'Gestão financeira e contábil', '💰', '#10b981'),
('OPERATIONS', 'Operações', 'Execução de serviços', '⚙️', '#3b82f6'),
('SALES', 'Vendas', 'Vendas e clientes', '📊', '#8b5cf6'),
('PURCHASING', 'Compras', 'Aquisição de materiais', '🛒', '#f59e0b'),
('HR', 'RH', 'Recursos humanos', '👥', '#ec4899'),
('ADMIN', 'Administrativo', 'Gestão administrativa', '🏢', '#6b7280'),
('EXECUTIVE', 'Executivo', 'Alta gestão', '👔', '#7c3aed')
ON CONFLICT (code) DO NOTHING;

-- Inserir permissões
INSERT INTO department_permissions (department_code, can_access_financial, can_access_service_orders, can_access_inventory, can_access_purchasing, can_access_customers, can_access_employees, can_access_reports, can_access_settings, can_create, can_edit, can_delete, can_approve) VALUES
('FINANCIAL', true, true, false, false, true, false, true, false, true, true, false, true),
('OPERATIONS', false, true, true, false, true, false, false, false, true, true, false, false),
('SALES', false, true, false, false, true, false, true, false, true, true, false, false),
('PURCHASING', false, false, true, true, false, false, false, false, true, true, false, true),
('HR', false, false, false, false, false, true, true, false, true, true, true, false),
('ADMIN', true, true, true, true, true, true, true, false, true, true, false, false),
('EXECUTIVE', true, true, true, true, true, true, true, true, true, true, true, true)
ON CONFLICT (department_code) DO UPDATE SET
  can_access_financial = EXCLUDED.can_access_financial,
  can_access_service_orders = EXCLUDED.can_access_service_orders;

-- RLS
ALTER TABLE system_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read departments" ON system_departments;
CREATE POLICY "Allow read departments" ON system_departments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow read permissions" ON department_permissions;
CREATE POLICY "Allow read permissions" ON department_permissions FOR SELECT TO anon, authenticated USING (true);

COMMENT ON VIEW v_customer_credit_scoring IS '✅ ATIVO - Credit scoring completo';
COMMENT ON VIEW v_cfo_kpis IS '✅ ATIVO - KPIs executivos CFO';

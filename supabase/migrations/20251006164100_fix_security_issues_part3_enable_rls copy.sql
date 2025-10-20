/*
  # Correção de Segurança - Parte 3: Habilitar RLS em Todas as Tabelas
  
  ## PROBLEMA CRÍTICO
  30+ tabelas públicas SEM Row Level Security = ACESSO TOTAL IRRESTRITO
  
  ## Solução
  1. Habilitar RLS em todas as tabelas
  2. Criar policies permissivas temporárias (desenvolvimento)
  3. EM PRODUÇÃO: ajustar policies para restringir acesso
  
  ## Segurança
  RLS DEVE estar habilitado em TODAS as tabelas públicas
*/

-- ==============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ==============================================

-- Core Tables
ALTER TABLE service_order_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- POLICIES PERMISSIVAS PARA DESENVOLVIMENTO
-- NOTA: EM PRODUÇÃO, RESTRINGIR POR auth.uid() E ROLES
-- ==============================================

-- SERVICE_ORDER_TEAM
DROP POLICY IF EXISTS "Acesso total service_order_team" ON service_order_team;
CREATE POLICY "Acesso total service_order_team" ON service_order_team USING (true) WITH CHECK (true);

-- SERVICE_ORDERS
DROP POLICY IF EXISTS "Acesso total service_orders" ON service_orders;
CREATE POLICY "Acesso total service_orders" ON service_orders USING (true) WITH CHECK (true);

-- CONTRACT_TYPES
DROP POLICY IF EXISTS "Acesso total contract_types" ON contract_types;
CREATE POLICY "Acesso total contract_types" ON contract_types USING (true) WITH CHECK (true);

-- INVENTORY_MOVEMENTS
DROP POLICY IF EXISTS "Acesso total inventory_movements" ON inventory_movements;
CREATE POLICY "Acesso total inventory_movements" ON inventory_movements USING (true) WITH CHECK (true);

-- COMPANY_SETTINGS
DROP POLICY IF EXISTS "Acesso total company_settings" ON company_settings;
CREATE POLICY "Acesso total company_settings" ON company_settings USING (true) WITH CHECK (true);

-- CATALOG_SERVICES
DROP POLICY IF EXISTS "Acesso total catalog_services" ON catalog_services;
CREATE POLICY "Acesso total catalog_services" ON catalog_services USING (true) WITH CHECK (true);

-- FINANCE_CATEGORIES
DROP POLICY IF EXISTS "Acesso total finance_categories" ON finance_categories;
CREATE POLICY "Acesso total finance_categories" ON finance_categories USING (true) WITH CHECK (true);

-- CUSTOMERS
DROP POLICY IF EXISTS "Acesso total customers" ON customers;
CREATE POLICY "Acesso total customers" ON customers USING (true) WITH CHECK (true);

-- EQUIPMENTS
DROP POLICY IF EXISTS "Acesso total equipments" ON equipments;
CREATE POLICY "Acesso total equipments" ON equipments USING (true) WITH CHECK (true);

-- ORDER_ITEMS
DROP POLICY IF EXISTS "Acesso total order_items" ON order_items;
CREATE POLICY "Acesso total order_items" ON order_items USING (true) WITH CHECK (true);

-- INVENTORY_ITEMS
DROP POLICY IF EXISTS "Acesso total inventory_items" ON inventory_items;
CREATE POLICY "Acesso total inventory_items" ON inventory_items USING (true) WITH CHECK (true);

-- ORDER_STAFF
DROP POLICY IF EXISTS "Acesso total order_staff" ON order_staff;
CREATE POLICY "Acesso total order_staff" ON order_staff USING (true) WITH CHECK (true);

-- CRM_LEADS
DROP POLICY IF EXISTS "Acesso total crm_leads" ON crm_leads;
CREATE POLICY "Acesso total crm_leads" ON crm_leads USING (true) WITH CHECK (true);

-- USER_PROFILES
DROP POLICY IF EXISTS "Acesso total user_profiles" ON user_profiles;
CREATE POLICY "Acesso total user_profiles" ON user_profiles USING (true) WITH CHECK (true);

-- TENANTS
DROP POLICY IF EXISTS "Acesso total tenants" ON tenants;
CREATE POLICY "Acesso total tenants" ON tenants USING (true) WITH CHECK (true);

-- ORDERS
DROP POLICY IF EXISTS "Acesso total orders" ON orders;
CREATE POLICY "Acesso total orders" ON orders USING (true) WITH CHECK (true);

-- AGENDA
DROP POLICY IF EXISTS "Acesso total agenda" ON agenda;
CREATE POLICY "Acesso total agenda" ON agenda USING (true) WITH CHECK (true);

-- MATERIALS
DROP POLICY IF EXISTS "Acesso total materials" ON materials;
CREATE POLICY "Acesso total materials" ON materials USING (true) WITH CHECK (true);

-- STOCK_MOVEMENTS
DROP POLICY IF EXISTS "Acesso total stock_movements" ON stock_movements;
CREATE POLICY "Acesso total stock_movements" ON stock_movements USING (true) WITH CHECK (true);

-- FINANCE_ENTRIES
DROP POLICY IF EXISTS "Acesso total finance_entries" ON finance_entries;
CREATE POLICY "Acesso total finance_entries" ON finance_entries USING (true) WITH CHECK (true);

-- FINANCE_INVOICES
DROP POLICY IF EXISTS "Acesso total finance_invoices" ON finance_invoices;
CREATE POLICY "Acesso total finance_invoices" ON finance_invoices USING (true) WITH CHECK (true);

-- EMPRESAS
DROP POLICY IF EXISTS "Acesso total empresas" ON empresas;
CREATE POLICY "Acesso total empresas" ON empresas USING (true) WITH CHECK (true);

-- CONTRACTS
DROP POLICY IF EXISTS "Acesso total contracts" ON contracts;
CREATE POLICY "Acesso total contracts" ON contracts USING (true) WITH CHECK (true);

-- USERS
DROP POLICY IF EXISTS "Acesso total users" ON users;
CREATE POLICY "Acesso total users" ON users USING (true) WITH CHECK (true);

-- SUPPLIERS
DROP POLICY IF EXISTS "Acesso total suppliers" ON suppliers;
CREATE POLICY "Acesso total suppliers" ON suppliers USING (true) WITH CHECK (true);

-- FINANCIAL_TRANSACTIONS
DROP POLICY IF EXISTS "Acesso total financial_transactions" ON financial_transactions;
CREATE POLICY "Acesso total financial_transactions" ON financial_transactions USING (true) WITH CHECK (true);

-- BANK_ACCOUNTS
DROP POLICY IF EXISTS "Acesso total bank_accounts" ON bank_accounts;
CREATE POLICY "Acesso total bank_accounts" ON bank_accounts USING (true) WITH CHECK (true);

-- PROJECTS
DROP POLICY IF EXISTS "Acesso total projects" ON projects;
CREATE POLICY "Acesso total projects" ON projects USING (true) WITH CHECK (true);

-- USER_INVITATIONS
DROP POLICY IF EXISTS "Acesso total user_invitations" ON user_invitations;
CREATE POLICY "Acesso total user_invitations" ON user_invitations USING (true) WITH CHECK (true);

-- USER_CREDENTIALS
DROP POLICY IF EXISTS "Acesso total user_credentials" ON user_credentials;
CREATE POLICY "Acesso total user_credentials" ON user_credentials USING (true) WITH CHECK (true);

-- STAFF
DROP POLICY IF EXISTS "Acesso total staff" ON staff;
CREATE POLICY "Acesso total staff" ON staff USING (true) WITH CHECK (true);

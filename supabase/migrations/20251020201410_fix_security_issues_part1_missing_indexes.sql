/*
  # Fix Security Issues - Part 1: Missing Foreign Key Indexes

  1. Performance Improvements
    - Add missing indexes on all foreign key columns
    - This significantly improves JOIN performance and query speed
    - Prevents full table scans on foreign key lookups

  2. Tables Affected
    - catalog_service_materials
    - catalog_service_tasks
    - company_settings
    - contracts
    - crm_leads
    - customer_equipment
    - document_versions
    - documents
    - email_accounts
    - email_templates
    - finance_invoices
    - financial_transactions
    - inventory_movements
    - order_staff
    - projects
    - purchase_schedules
    - route_history
    - service_catalog_labor
    - service_catalog_materials
    - service_catalog_steps
    - service_order_history
    - service_order_labor
    - service_order_materials
    - supplier_quotes
    - tenants
    - user_profiles
    - users
    - wpp_campaigns
    - wpp_contact_tags
    - wpp_contacts
    - wpp_messages
*/

-- Catalog Service Materials
CREATE INDEX IF NOT EXISTS idx_catalog_service_materials_catalog_service_id 
  ON public.catalog_service_materials(catalog_service_id);

CREATE INDEX IF NOT EXISTS idx_catalog_service_materials_material_id 
  ON public.catalog_service_materials(material_id);

-- Catalog Service Tasks
CREATE INDEX IF NOT EXISTS idx_catalog_service_tasks_catalog_service_id 
  ON public.catalog_service_tasks(catalog_service_id);

-- Company Settings
CREATE INDEX IF NOT EXISTS idx_company_settings_bank_account_id 
  ON public.company_settings(bank_account_id);

-- Contracts
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type_id 
  ON public.contracts(contract_type_id);

-- CRM Leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to 
  ON public.crm_leads(assigned_to);

-- Customer Equipment
CREATE INDEX IF NOT EXISTS idx_customer_equipment_customer_address_id 
  ON public.customer_equipment(customer_address_id);

-- Document Versions
CREATE INDEX IF NOT EXISTS idx_document_versions_changed_by 
  ON public.document_versions(changed_by);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_approved_by 
  ON public.documents(approved_by);

-- Email Accounts
CREATE INDEX IF NOT EXISTS idx_email_accounts_created_by 
  ON public.email_accounts(created_by);

-- Email Templates
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by 
  ON public.email_templates(created_by);

-- Finance Invoices
CREATE INDEX IF NOT EXISTS idx_finance_invoices_customer_id 
  ON public.finance_invoices(customer_id);

-- Financial Transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_bank_account_id 
  ON public.financial_transactions(bank_account_id);

-- Inventory Movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_item_id 
  ON public.inventory_movements(inventory_item_id);

-- Order Staff
CREATE INDEX IF NOT EXISTS idx_order_staff_order_id 
  ON public.order_staff(order_id);

CREATE INDEX IF NOT EXISTS idx_order_staff_staff_id 
  ON public.order_staff(staff_id);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_customer_id 
  ON public.projects(customer_id);

CREATE INDEX IF NOT EXISTS idx_projects_manager_id 
  ON public.projects(manager_id);

-- Purchase Schedules
CREATE INDEX IF NOT EXISTS idx_purchase_schedules_inventory_id 
  ON public.purchase_schedules(inventory_id);

-- Route History
CREATE INDEX IF NOT EXISTS idx_route_history_employee_id 
  ON public.route_history(employee_id);

-- Service Catalog Labor
CREATE INDEX IF NOT EXISTS idx_service_catalog_labor_service_catalog_id 
  ON public.service_catalog_labor(service_catalog_id);

-- Service Catalog Materials
CREATE INDEX IF NOT EXISTS idx_service_catalog_materials_material_id 
  ON public.service_catalog_materials(material_id);

CREATE INDEX IF NOT EXISTS idx_service_catalog_materials_service_catalog_id 
  ON public.service_catalog_materials(service_catalog_id);

-- Service Catalog Steps
CREATE INDEX IF NOT EXISTS idx_service_catalog_steps_service_catalog_id 
  ON public.service_catalog_steps(service_catalog_id);

-- Service Order History
CREATE INDEX IF NOT EXISTS idx_service_order_history_created_by 
  ON public.service_order_history(created_by);

-- Service Order Labor
CREATE INDEX IF NOT EXISTS idx_service_order_labor_staff_id 
  ON public.service_order_labor(staff_id);

-- Service Order Materials
CREATE INDEX IF NOT EXISTS idx_service_order_materials_material_id 
  ON public.service_order_materials(material_id);

-- Supplier Quotes
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_inventory_id 
  ON public.supplier_quotes(inventory_id);

-- Tenants
CREATE INDEX IF NOT EXISTS idx_tenants_empresa_id 
  ON public.tenants(empresa_id);

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_empresa_id 
  ON public.user_profiles(empresa_id);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_empresa_id 
  ON public.users(empresa_id);

-- WhatsApp Campaigns
CREATE INDEX IF NOT EXISTS idx_wpp_campaigns_wpp_account_id 
  ON public.wpp_campaigns(wpp_account_id);

-- WhatsApp Contact Tags
CREATE INDEX IF NOT EXISTS idx_wpp_contact_tags_wpp_tag_id 
  ON public.wpp_contact_tags(wpp_tag_id);

-- WhatsApp Contacts
CREATE INDEX IF NOT EXISTS idx_wpp_contacts_customer_id 
  ON public.wpp_contacts(customer_id);

-- WhatsApp Messages
CREATE INDEX IF NOT EXISTS idx_wpp_messages_wpp_account_id 
  ON public.wpp_messages(wpp_account_id);

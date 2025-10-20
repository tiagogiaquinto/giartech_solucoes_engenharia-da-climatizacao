/*
  # Fix Security Issues - Part 3: Enable RLS on Tables with Policies

  1. Security Enhancement
    - Enable RLS on all tables that have policies but RLS is disabled
    - This activates the security policies that were defined
    - Critical for data protection and access control

  2. Tables Affected (20 tables)
    - agenda
    - bank_accounts
    - catalog_services
    - contracts
    - customer_addresses
    - customer_contacts
    - customer_equipment
    - customers
    - employees
    - finance_entries
    - financial_categories
    - financial_transactions
    - inventory_items
    - materials
    - projects
    - service_catalog
    - service_order_items
    - service_order_team
    - service_orders
    - user_profiles

  3. Important Notes
    - RLS policies already exist on these tables
    - Enabling RLS activates these policies
    - Tables with anon policies allow public access where configured
*/

-- Enable RLS on tables with existing policies
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email tables (missing from original list)
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

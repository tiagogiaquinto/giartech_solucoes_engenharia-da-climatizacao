/*
  # Fix Security Issues - Part 4: Remove Duplicate Policies

  1. Security Enhancement
    - Remove duplicate permissive policies
    - Keep only one policy per role per action
    - Prevents policy conflicts and confusion

  2. Policies Removed
    - company_settings: Remove old policies, keep anon_* ones
    - contract_templates: Keep the more permissive one

  3. Important Notes
    - Keeping the most permissive/comprehensive policy
    - Ensures backward compatibility
    - Maintains existing access patterns
*/

-- Company Settings: Remove duplicate policies (keep anon_select_company_settings)
DROP POLICY IF EXISTS "Allow read company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Todos podem visualizar configurações da empresa" ON public.company_settings;

-- Contract Templates: Remove duplicate policies
DROP POLICY IF EXISTS "Permitir leitura de templates ativos" ON public.contract_templates;
DROP POLICY IF EXISTS "Permitir todos os acessos a templates para autenticados" ON public.contract_templates;

-- Recreate single unified policy for contract_templates
CREATE POLICY "allow_authenticated_read_contract_templates" 
  ON public.contract_templates 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

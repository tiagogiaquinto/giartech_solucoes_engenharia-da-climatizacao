/*
  # Habilitar Acesso Anônimo para Desenvolvimento
  
  1. Objetivo
    - Permitir acesso completo ao sistema sem autenticação
    - Facilitar desenvolvimento e testes
    - Manter RLS ativo mas com políticas permissivas
  
  2. Mudanças
    - Adiciona políticas permissivas para role 'anon' em todas as tabelas
    - Permite SELECT, INSERT, UPDATE, DELETE sem restrições
  
  3. Segurança
    - Apenas para ambiente de desenvolvimento
    - Em produção, remover estas políticas e implementar auth adequado
*/

-- Políticas para tabelas principais
DO $$ 
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'customers', 'customer_addresses', 'customer_contacts', 'customer_equipment',
    'staff', 'employees', 'agenda', 'service_orders', 'orders',
    'finance_entries', 'finance_categories', 'financial_categories', 'bank_accounts',
    'materials', 'suppliers', 'equipments', 'inventory', 'catalog_services',
    'service_catalog', 'contracts', 'contract_types', 'projects',
    'wpp_accounts', 'wpp_contacts', 'wpp_messages', 'crm_leads',
    'finance_invoices', 'order_items', 'order_staff',
    'service_order_items', 'service_order_team',
    'catalog_service_materials', 'catalog_service_tasks',
    'service_catalog_materials', 'service_catalog_labor', 'service_catalog_steps',
    'service_order_materials', 'service_order_labor',
    'inventory_movements', 'stock_movements',
    'company_settings', 'user_profiles', 'user_menu_order',
    'audit_logs', 'empresas'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Verificar se tabela existe
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      
      -- Drop políticas existentes para anon se existirem
      BEGIN
        EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON %I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%s" ON %I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "anon_update_%s" ON %I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%s" ON %I', tbl, tbl);
      EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignora erros se políticas não existirem
      END;
      
      -- Criar políticas permissivas para anon
      BEGIN
        EXECUTE format('CREATE POLICY "anon_select_%s" ON %I FOR SELECT TO anon USING (true)', tbl, tbl);
        EXECUTE format('CREATE POLICY "anon_insert_%s" ON %I FOR INSERT TO anon WITH CHECK (true)', tbl, tbl);
        EXECUTE format('CREATE POLICY "anon_update_%s" ON %I FOR UPDATE TO anon USING (true) WITH CHECK (true)', tbl, tbl);
        EXECUTE format('CREATE POLICY "anon_delete_%s" ON %I FOR DELETE TO anon USING (true)', tbl, tbl);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar políticas para %: %', tbl, SQLERRM;
      END;
      
    END IF;
  END LOOP;
END $$;

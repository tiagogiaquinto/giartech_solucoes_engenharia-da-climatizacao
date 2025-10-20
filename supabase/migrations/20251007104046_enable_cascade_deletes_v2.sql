/*
  # Habilitar Exclusão em Cascata - Versão 2
  
  Atualiza as foreign keys para permitir exclusão de registros relacionados automaticamente.
  
  ## Mudanças:
  - Altera ON DELETE RESTRICT para ON DELETE CASCADE em tabelas relacionadas a customers
  - Permite exclusão de clientes sem erros de FK
*/

-- Customers foreign keys - Permitir exclusão em cascata
DO $$
BEGIN
  -- agenda
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'agenda_customer_id_fkey') THEN
    ALTER TABLE agenda DROP CONSTRAINT agenda_customer_id_fkey;
    ALTER TABLE agenda ADD CONSTRAINT agenda_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;

  -- contracts
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'contracts_customer_id_fkey') THEN
    ALTER TABLE contracts DROP CONSTRAINT contracts_customer_id_fkey;
    ALTER TABLE contracts ADD CONSTRAINT contracts_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;

  -- customer_addresses
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'customer_addresses_customer_id_fkey') THEN
    ALTER TABLE customer_addresses DROP CONSTRAINT customer_addresses_customer_id_fkey;
    ALTER TABLE customer_addresses ADD CONSTRAINT customer_addresses_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;

  -- customer_contacts
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'customer_contacts_customer_id_fkey') THEN
    ALTER TABLE customer_contacts DROP CONSTRAINT customer_contacts_customer_id_fkey;
    ALTER TABLE customer_contacts ADD CONSTRAINT customer_contacts_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;

  -- customer_equipment
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'customer_equipment_customer_id_fkey') THEN
    ALTER TABLE customer_equipment DROP CONSTRAINT customer_equipment_customer_id_fkey;
    ALTER TABLE customer_equipment ADD CONSTRAINT customer_equipment_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;

  -- finance_entries (SET NULL pois o lançamento pode existir sem cliente)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'finance_entries_customer_id_fkey') THEN
    ALTER TABLE finance_entries DROP CONSTRAINT finance_entries_customer_id_fkey;
    ALTER TABLE finance_entries ADD CONSTRAINT finance_entries_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;

  -- finance_invoices
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'finance_invoices_customer_id_fkey') THEN
    ALTER TABLE finance_invoices DROP CONSTRAINT finance_invoices_customer_id_fkey;
    ALTER TABLE finance_invoices ADD CONSTRAINT finance_invoices_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;

  -- orders
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'orders_customer_id_fkey') THEN
    ALTER TABLE orders DROP CONSTRAINT orders_customer_id_fkey;
    ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;

  -- projects
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'projects_customer_id_fkey') THEN
    ALTER TABLE projects DROP CONSTRAINT projects_customer_id_fkey;
    ALTER TABLE projects ADD CONSTRAINT projects_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;

  -- service_orders (SET NULL pois a OS pode existir sem cliente)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'service_orders_customer_id_fkey') THEN
    ALTER TABLE service_orders DROP CONSTRAINT service_orders_customer_id_fkey;
    ALTER TABLE service_orders ADD CONSTRAINT service_orders_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;

  -- wpp_contacts
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'wpp_contacts_customer_id_fkey') THEN
    ALTER TABLE wpp_contacts DROP CONSTRAINT wpp_contacts_customer_id_fkey;
    ALTER TABLE wpp_contacts ADD CONSTRAINT wpp_contacts_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;
END $$;

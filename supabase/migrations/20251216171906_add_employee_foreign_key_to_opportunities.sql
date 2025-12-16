/*
  # Adicionar chave estrangeira de employees para crm_opportunities
  
  1. Changes
    - Adiciona foreign key constraint de owner_id para employees(id)
    - Permite que crm_opportunities referencie funcionários da empresa
  
  2. Notes
    - Owner_id agora aponta para employees ao invés de user_profiles
    - Constraint com ON DELETE SET NULL para não quebrar ao excluir funcionário
*/

DO $$ 
BEGIN
  -- Remove constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'crm_opportunities_owner_id_fkey' 
    AND table_name = 'crm_opportunities'
  ) THEN
    ALTER TABLE crm_opportunities DROP CONSTRAINT crm_opportunities_owner_id_fkey;
  END IF;

  -- Adiciona nova constraint para employees
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'crm_opportunities_owner_id_employees_fkey' 
    AND table_name = 'crm_opportunities'
  ) THEN
    ALTER TABLE crm_opportunities 
    ADD CONSTRAINT crm_opportunities_owner_id_employees_fkey 
    FOREIGN KEY (owner_id) 
    REFERENCES employees(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

/*
  # Vincular funcionários a contas de sistema

  ## Objetivo
  Permite associar um registro de funcionário (employees) a uma conta de acesso ao sistema (auth_accounts),
  possibilitando atribuição manual ou automática pelo email.

  ## Alterações
  - `employees`: nova coluna `auth_account_id` (uuid, nullable, FK para auth_accounts)
  - Índice para busca eficiente por auth_account_id
  - Preenchimento automático do vínculo para funcionários cujo email já coincide com uma conta existente
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'auth_account_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN auth_account_id uuid REFERENCES auth_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employees_auth_account_id ON employees(auth_account_id);

UPDATE employees e
SET auth_account_id = aa.id
FROM auth_accounts aa
WHERE lower(trim(e.email)) = lower(trim(aa.email))
  AND e.auth_account_id IS NULL
  AND e.email IS NOT NULL
  AND e.email <> '';

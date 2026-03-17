/*
  # Tabela de contas de acesso para autenticação

  Cria a tabela `auth_accounts` que vincula auth.users ao sistema de permissões,
  compatível com a estrutura existente do banco (user_profiles usa user_id como FK).

  ## Nova Tabela
  - `auth_accounts`
    - `id` (uuid, PK, FK → auth.users)
    - `email` (text, unique)
    - `full_name` (text)
    - `role` (text) — super_admin, admin, manager, technician, sales, financial, viewer
    - `is_active` (boolean)
    - `created_at`, `updated_at`

  O `module_permissions.user_id` já existe e referencia este campo.
*/

CREATE TABLE IF NOT EXISTS auth_accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('super_admin','admin','manager','technician','sales','financial','viewer')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS auth_accounts_email_idx ON auth_accounts(email);
CREATE INDEX IF NOT EXISTS auth_accounts_role_idx ON auth_accounts(role);

ALTER TABLE auth_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own account"
  ON auth_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admin reads all accounts"
  ON auth_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth_accounts a WHERE a.id = auth.uid() AND a.role = 'super_admin')
  );

CREATE POLICY "Super admin inserts accounts"
  ON auth_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth_accounts a WHERE a.id = auth.uid() AND a.role = 'super_admin')
  );

CREATE POLICY "Super admin updates accounts"
  ON auth_accounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth_accounts a WHERE a.id = auth.uid() AND a.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth_accounts a WHERE a.id = auth.uid() AND a.role = 'super_admin')
  );

DROP TRIGGER IF EXISTS set_auth_accounts_updated_at ON auth_accounts;
CREATE TRIGGER set_auth_accounts_updated_at
  BEFORE UPDATE ON auth_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix module_permissions foreign key to reference auth_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'module_permissions'
    AND constraint_name = 'module_permissions_user_id_auth_accounts_fkey'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE module_permissions
      ADD CONSTRAINT module_permissions_user_id_auth_accounts_fkey
      FOREIGN KEY (user_id) REFERENCES auth_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Trigger: criar auth_account automaticamente ao criar usuário no Auth
CREATE OR REPLACE FUNCTION handle_new_auth_user_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF NEW.email = 'diretor.giartechsolucoes@gmail.com' THEN
    v_role := 'super_admin';
  ELSE
    v_role := 'viewer';
  END IF;

  INSERT INTO public.auth_accounts (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_account ON auth.users;
CREATE TRIGGER on_auth_user_created_account
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user_account();

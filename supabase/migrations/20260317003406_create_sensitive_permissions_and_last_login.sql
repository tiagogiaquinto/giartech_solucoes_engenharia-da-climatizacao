/*
  # Permissões Sensíveis e Rastreamento de Último Acesso

  ## Novas Tabelas
  - `sensitive_permissions`
    - `user_id` (uuid, FK → auth_accounts)
    - `can_view_profit` (boolean) — Financeiro: Lucro Real e Impostos
    - `can_apply_discount` (boolean) — OS: Aplicar descontos
    - `can_adjust_stock` (boolean) — Estoque: Ajustar saldo
    - timestamps

  ## Alterações
  - `auth_accounts`: adiciona coluna `last_login` (timestamptz)

  ## Segurança
  - RLS em sensitive_permissions: apenas super_admin gerencia, usuário lê o próprio
*/

ALTER TABLE auth_accounts ADD COLUMN IF NOT EXISTS last_login timestamptz;

CREATE TABLE IF NOT EXISTS sensitive_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
  can_view_profit boolean NOT NULL DEFAULT false,
  can_apply_discount boolean NOT NULL DEFAULT false,
  can_adjust_stock boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sensitive_permissions_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS sensitive_permissions_user_id_idx ON sensitive_permissions(user_id);

ALTER TABLE sensitive_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sensitive permissions"
  ON sensitive_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admin reads all sensitive permissions"
  ON sensitive_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth_accounts a WHERE a.id = auth.uid() AND a.role = 'super_admin')
  );

CREATE POLICY "Super admin inserts sensitive permissions"
  ON sensitive_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth_accounts a WHERE a.id = auth.uid() AND a.role = 'super_admin')
  );

CREATE POLICY "Super admin updates sensitive permissions"
  ON sensitive_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth_accounts a WHERE a.id = auth.uid() AND a.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth_accounts a WHERE a.id = auth.uid() AND a.role = 'super_admin')
  );

DROP TRIGGER IF EXISTS set_sensitive_permissions_updated_at ON sensitive_permissions;
CREATE TRIGGER set_sensitive_permissions_updated_at
  BEFORE UPDATE ON sensitive_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant anon/authenticated access for the read pattern used by the app
GRANT SELECT, INSERT, UPDATE ON sensitive_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sensitive_permissions TO anon;
GRANT SELECT, INSERT, UPDATE ON auth_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON auth_accounts TO anon;
GRANT SELECT, INSERT, UPDATE ON module_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON module_permissions TO anon;

-- Function to update last_login on auth_accounts
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth_accounts SET last_login = now() WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

/*
  # Corrigir recursão infinita nas políticas de auth_accounts

  As políticas "Super admin" faziam SELECT na própria tabela auth_accounts,
  causando recursão infinita (código 42P17).

  Solução: substituir a verificação por uma subquery em user_profiles,
  que não possui essa dependência circular.
*/

DROP POLICY IF EXISTS "Super admin inserts accounts" ON auth_accounts;
DROP POLICY IF EXISTS "Super admin reads all accounts" ON auth_accounts;
DROP POLICY IF EXISTS "Super admin updates accounts" ON auth_accounts;

CREATE POLICY "Super admin reads all accounts"
  ON auth_accounts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin inserts accounts"
  ON auth_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin updates accounts"
  ON auth_accounts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'super_admin'
    )
  );

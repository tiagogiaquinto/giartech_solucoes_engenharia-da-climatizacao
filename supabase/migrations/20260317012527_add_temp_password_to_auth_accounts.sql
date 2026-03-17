/*
  # Adicionar suporte a senha temporária em auth_accounts

  Novos campos:
  - temp_password: armazena a senha temporária em texto para exibição pelo admin
  - must_change_password: indica se o usuário deve trocar a senha no próximo login
  - password_changed_at: data/hora da última troca de senha
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_accounts' AND column_name = 'temp_password'
  ) THEN
    ALTER TABLE auth_accounts ADD COLUMN temp_password text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_accounts' AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE auth_accounts ADD COLUMN must_change_password boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_accounts' AND column_name = 'password_changed_at'
  ) THEN
    ALTER TABLE auth_accounts ADD COLUMN password_changed_at timestamptz DEFAULT NULL;
  END IF;
END $$;

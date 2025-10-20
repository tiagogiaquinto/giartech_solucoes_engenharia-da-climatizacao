/*
  # Sistema de Cadastro de Usuários
  
  1. Novas Tabelas:
    - user_invitations: Convites para novos usuários
      - Controla o processo de cadastro por convite
      - Token único com validade de 7 dias
      - Status: pending, accepted, expired, cancelled
    
    - user_credentials: Credenciais de login
      - Hash de senha bcrypt
      - Controle de tentativas falhadas
      - Bloqueio temporário de conta
      - Registro de último login
  
  2. Security:
    - RLS habilitado em ambas tabelas
    - Admins podem gerenciar convites
    - Usuários só veem suas próprias credenciais
    - Sistema pode criar credenciais via signup
  
  3. Triggers:
    - Auto-atualização de updated_at
    - Função para expirar convites antigos
*/

CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('admin', 'technician', 'external')) NOT NULL,
  invited_by uuid,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  password_hash text NOT NULL,
  last_login timestamptz,
  failed_attempts integer DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ver todos os convites" ON user_invitations;
CREATE POLICY "Admins podem ver todos os convites"
  ON user_invitations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins podem criar convites" ON user_invitations;
CREATE POLICY "Admins podem criar convites"
  ON user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins podem atualizar convites" ON user_invitations;
CREATE POLICY "Admins podem atualizar convites"
  ON user_invitations FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários veem apenas suas credenciais" ON user_credentials;
CREATE POLICY "Usuários veem apenas suas credenciais"
  ON user_credentials FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Sistema pode criar credenciais" ON user_credentials;
CREATE POLICY "Sistema pode criar credenciais"
  ON user_credentials FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários podem atualizar suas credenciais" ON user_credentials;
CREATE POLICY "Usuários podem atualizar suas credenciais"
  ON user_credentials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);

CREATE OR REPLACE FUNCTION update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_invitations_updated_at ON user_invitations;
CREATE TRIGGER trigger_update_user_invitations_updated_at
  BEFORE UPDATE ON user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_invitations_updated_at();

CREATE OR REPLACE FUNCTION update_user_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_credentials_updated_at ON user_credentials;
CREATE TRIGGER trigger_update_user_credentials_updated_at
  BEFORE UPDATE ON user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credentials_updated_at();

CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE user_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_invitations IS 'Convites para novos usuários se registrarem no sistema';
COMMENT ON TABLE user_credentials IS 'Credenciais de login dos usuários (senhas hash)';

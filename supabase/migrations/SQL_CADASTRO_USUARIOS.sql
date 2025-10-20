-- ============================================================
-- SQL: Sistema de Cadastro de Usuários
-- Data: 2025-10-02
-- Descrição: Permite admins criarem convites e usuários se registrarem
-- ============================================================

-- Criar tabela de convites
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('admin', 'technician', 'external')) NOT NULL,
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de credenciais
CREATE TABLE IF NOT EXISTS user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  password_hash text NOT NULL,
  last_login timestamptz,
  failed_attempts integer DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas para user_invitations
CREATE POLICY "Admins podem ver todos os convites"
  ON user_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins podem criar convites"
  ON user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar convites"
  ON user_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Políticas para user_credentials
CREATE POLICY "Usuários veem apenas suas credenciais"
  ON user_credentials FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Sistema pode criar credenciais"
  ON user_credentials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas credenciais"
  ON user_credentials FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);

-- Trigger para updated_at em user_invitations
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

-- Trigger para updated_at em user_credentials
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

-- Função para expirar convites automaticamente
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE user_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE user_invitations IS 'Convites para novos usuários se registrarem no sistema';
COMMENT ON TABLE user_credentials IS 'Credenciais de login dos usuários (senhas hash)';
COMMENT ON COLUMN user_invitations.token IS 'Token único para aceitar o convite (hash)';
COMMENT ON COLUMN user_invitations.expires_at IS 'Data de expiração do convite (padrão: 7 dias)';
COMMENT ON COLUMN user_credentials.password_hash IS 'Hash bcrypt da senha do usuário';
COMMENT ON COLUMN user_credentials.failed_attempts IS 'Contador de tentativas de login falhadas';
COMMENT ON COLUMN user_credentials.locked_until IS 'Data até quando a conta está bloqueada (após muitas tentativas)';

-- Verificação
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('user_invitations', 'user_credentials');

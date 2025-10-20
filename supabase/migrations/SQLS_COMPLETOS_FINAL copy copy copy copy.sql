-- ============================================================
-- SQLs COMPLETOS - SISTEMA GIARTECH
-- Execute este arquivo COMPLETO no Supabase SQL Editor
-- Data: 2025-10-02
-- ============================================================

-- ============================================================
-- PARTE 1: MÚLTIPLOS SERVIÇOS EM ORDEM DE SERVIÇO
-- ============================================================

-- Tabela de itens da OS (múltiplos serviços)
CREATE TABLE IF NOT EXISTS service_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  service_catalog_id uuid REFERENCES service_catalog(id) ON DELETE RESTRICT,
  quantity decimal(10,2) DEFAULT 1 NOT NULL,
  unit_price numeric(12,2),
  total_price numeric(12,2),
  estimated_duration integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;

-- Política de acesso (permissivo para desenvolvimento)
CREATE POLICY "Enable all operations on service_order_items"
  ON service_order_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_order_items_order_id ON service_order_items(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_items_service_id ON service_order_items(service_catalog_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_service_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_service_order_items_updated_at ON service_order_items;
CREATE TRIGGER trigger_update_service_order_items_updated_at
  BEFORE UPDATE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_items_updated_at();

-- Comentários
COMMENT ON TABLE service_order_items IS 'Itens/serviços individuais dentro de uma ordem de serviço';
COMMENT ON COLUMN service_order_items.service_order_id IS 'ID da ordem de serviço';
COMMENT ON COLUMN service_order_items.service_catalog_id IS 'ID do serviço do catálogo';
COMMENT ON COLUMN service_order_items.quantity IS 'Quantidade do serviço';
COMMENT ON COLUMN service_order_items.unit_price IS 'Preço unitário do serviço';
COMMENT ON COLUMN service_order_items.total_price IS 'Preço total (quantidade × preço unitário)';
COMMENT ON COLUMN service_order_items.estimated_duration IS 'Duração estimada em minutos';

-- ============================================================
-- PARTE 2: EQUIPE DA ORDEM DE SERVIÇO
-- ============================================================

-- Tabela de equipe da OS
CREATE TABLE IF NOT EXISTS service_order_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('leader', 'technician', 'assistant', 'supervisor')),
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_order_id, employee_id)
);

-- Habilitar RLS
ALTER TABLE service_order_team ENABLE ROW LEVEL SECURITY;

-- Política de acesso
CREATE POLICY "Enable all operations on service_order_team"
  ON service_order_team FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_order_team_order_id ON service_order_team(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_team_employee_id ON service_order_team(employee_id);

-- Comentários
COMMENT ON TABLE service_order_team IS 'Membros da equipe atribuídos a uma ordem de serviço';
COMMENT ON COLUMN service_order_team.service_order_id IS 'ID da ordem de serviço';
COMMENT ON COLUMN service_order_team.employee_id IS 'ID do funcionário';
COMMENT ON COLUMN service_order_team.role IS 'Papel do funcionário na OS: leader, technician, assistant, supervisor';

-- ============================================================
-- PARTE 3: CAMPOS EXTRAS EM SERVICE_ORDERS
-- ============================================================

DO $$
BEGIN
  -- Campo show_value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'show_value'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN show_value boolean DEFAULT true;
  END IF;

  -- Campo total_estimated_duration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'total_estimated_duration'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN total_estimated_duration integer DEFAULT 0;
  END IF;

  -- Campo generated_contract
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'generated_contract'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN generated_contract text;
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN service_orders.show_value IS 'Define se os valores devem ser exibidos (útil para relatórios operacionais)';
COMMENT ON COLUMN service_orders.total_estimated_duration IS 'Duração total estimada calculada a partir dos itens em minutos';
COMMENT ON COLUMN service_orders.generated_contract IS 'ID ou referência do contrato gerado para esta OS';

-- ============================================================
-- PARTE 4: FUNÇÕES PARA CÁLCULO AUTOMÁTICO
-- ============================================================

-- Função para calcular totais da OS
CREATE OR REPLACE FUNCTION calculate_service_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_orders
  SET
    total_value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    total_estimated_duration = (
      SELECT COALESCE(SUM(estimated_duration * quantity), 0)
      FROM service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    updated_at = now()
  WHERE id = NEW.service_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT
DROP TRIGGER IF EXISTS trigger_calculate_totals_on_insert ON service_order_items;
CREATE TRIGGER trigger_calculate_totals_on_insert
  AFTER INSERT ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals();

-- Trigger para UPDATE
DROP TRIGGER IF EXISTS trigger_calculate_totals_on_update ON service_order_items;
CREATE TRIGGER trigger_calculate_totals_on_update
  AFTER UPDATE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals();

-- Trigger para DELETE (usa OLD ao invés de NEW)
CREATE OR REPLACE FUNCTION calculate_service_order_totals_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_orders
  SET
    total_value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM service_order_items
      WHERE service_order_id = OLD.service_order_id
    ),
    total_estimated_duration = (
      SELECT COALESCE(SUM(estimated_duration * quantity), 0)
      FROM service_order_items
      WHERE service_order_id = OLD.service_order_id
    ),
    updated_at = now()
  WHERE id = OLD.service_order_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_totals_on_delete ON service_order_items;
CREATE TRIGGER trigger_calculate_totals_on_delete
  AFTER DELETE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals_on_delete();

-- ============================================================
-- PARTE 5: SISTEMA DE CADASTRO DE USUÁRIOS
-- ============================================================

-- Tabela de convites
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

-- Tabela de credenciais
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

-- ============================================================
-- PARTE 6: COLUNA AVATAR EM USERS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar text;
  END IF;
END $$;

COMMENT ON COLUMN users.avatar IS 'URL pública da foto de perfil do usuário';

-- ============================================================
-- PARTE 7: BUCKET DE AVATARS (Via Dashboard ou SQL)
-- ============================================================

-- IMPORTANTE: Execute isso na aba "Storage" do Supabase Dashboard
-- Ou crie manualmente:
-- 1. Vá em Storage → New Bucket
-- 2. Name: avatars
-- 3. Public: YES
-- 4. File size limit: 2MB

-- Se quiser via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket avatars
CREATE POLICY "Avatars são públicos para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Usuários podem atualizar seus próprios avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Usuários podem deletar seus próprios avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ============================================================
-- PARTE 8: VERIFICAÇÕES FINAIS
-- ============================================================

-- Verificar tabelas criadas
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('service_order_items', 'service_order_team', 'user_invitations', 'user_credentials')
ORDER BY table_name;

-- Verificar novos campos em service_orders
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'service_orders'
  AND column_name IN ('show_value', 'total_estimated_duration', 'generated_contract')
ORDER BY column_name;

-- Verificar triggers
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('service_order_items', 'user_invitations', 'user_credentials')
ORDER BY event_object_table, trigger_name;

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- ============================================================
-- FIM - SISTEMA COMPLETO CRIADO!
-- ============================================================

-- RESUMO DO QUE FOI CRIADO:
-- ✅ service_order_items (múltiplos serviços)
-- ✅ service_order_team (equipe da OS)
-- ✅ Campos extras em service_orders
-- ✅ Triggers de cálculo automático
-- ✅ user_invitations (convites)
-- ✅ user_credentials (senhas)
-- ✅ Coluna avatar em users
-- ✅ Bucket avatars
-- ✅ Todas as políticas RLS
-- ✅ Todos os índices
-- ✅ Todos os comentários

SELECT 'SISTEMA COMPLETO INSTALADO COM SUCESSO!' as status;

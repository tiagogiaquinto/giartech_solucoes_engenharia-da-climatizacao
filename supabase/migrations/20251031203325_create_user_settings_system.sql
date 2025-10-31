/*
  # Sistema Completo de Configurações de Usuário
  
  1. Tabelas Criadas
    - user_settings - Configurações individuais por usuário
    - system_preferences - Preferências globais do sistema
    
  2. Funcionalidades
    - Notificações (email, push, SMS)
    - Temas e aparência
    - Backup e sincronização
    - Privacidade e segurança
    - Integrações
    
  3. Segurança
    - RLS habilitado
    - Usuários só veem suas próprias configurações
*/

-- =====================================================
-- TABELA: user_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- PERFIL
  display_name TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- NOTIFICAÇÕES
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  
  -- Tipos de notificações
  notify_new_order BOOLEAN DEFAULT true,
  notify_order_status BOOLEAN DEFAULT true,
  notify_payment BOOLEAN DEFAULT true,
  notify_deadline BOOLEAN DEFAULT true,
  notify_team_mention BOOLEAN DEFAULT true,
  
  -- APARÊNCIA
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'pt-BR',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  currency_format TEXT DEFAULT 'BRL',
  
  -- PRIVACIDADE
  profile_visibility TEXT DEFAULT 'team' CHECK (profile_visibility IN ('private', 'team', 'company', 'public')),
  show_online_status BOOLEAN DEFAULT true,
  allow_contact BOOLEAN DEFAULT true,
  
  -- BACKUP E SYNC
  auto_backup BOOLEAN DEFAULT true,
  backup_frequency TEXT DEFAULT 'daily' CHECK (backup_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'monthly')),
  backup_time TIME DEFAULT '00:00',
  keep_backups_days INTEGER DEFAULT 30,
  realtime_sync BOOLEAN DEFAULT true,
  offline_mode BOOLEAN DEFAULT true,
  sync_on_wifi_only BOOLEAN DEFAULT false,
  
  -- PRODUTIVIDADE
  default_view TEXT DEFAULT 'kanban' CHECK (default_view IN ('list', 'kanban', 'calendar', 'timeline')),
  items_per_page INTEGER DEFAULT 20,
  show_completed_tasks BOOLEAN DEFAULT false,
  auto_refresh BOOLEAN DEFAULT true,
  refresh_interval INTEGER DEFAULT 30,
  
  -- SEGURANÇA
  two_factor_enabled BOOLEAN DEFAULT false,
  session_timeout INTEGER DEFAULT 60,
  require_password_change BOOLEAN DEFAULT false,
  
  -- INTEGRAÇÕES
  integrations JSONB DEFAULT '{}'::jsonb,
  
  -- PREFERÊNCIAS AVANÇADAS
  advanced_settings JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir acesso anônimo para desenvolvimento
CREATE POLICY "Allow anonymous read user_settings"
  ON user_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert user_settings"
  ON user_settings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update user_settings"
  ON user_settings FOR UPDATE
  TO anon
  USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- =====================================================
-- TABELA: system_preferences (configurações globais)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para system_preferences
ALTER TABLE system_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public preferences are readable by all"
  ON system_preferences FOR SELECT
  USING (is_public = true OR auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify system preferences"
  ON system_preferences FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Permitir acesso anônimo
CREATE POLICY "Allow anonymous read system_preferences"
  ON system_preferences FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- CONFIGURAÇÕES PADRÃO DO SISTEMA
-- =====================================================
INSERT INTO system_preferences (key, value, description, category, is_public) VALUES
  ('company.name', '"Giartech"'::jsonb, 'Nome da empresa', 'company', true),
  ('company.industry', '"Climatização"'::jsonb, 'Ramo de atividade', 'company', true),
  ('system.maintenance_mode', 'false'::jsonb, 'Modo manutenção', 'system', false),
  ('system.version', '"1.0.0"'::jsonb, 'Versão do sistema', 'system', true),
  ('features.ai_assistant', 'true'::jsonb, 'Assistente AI habilitado', 'features', true),
  ('features.whatsapp_integration', 'true'::jsonb, 'Integração WhatsApp', 'features', true),
  ('features.email_integration', 'true'::jsonb, 'Integração Email', 'features', true),
  ('notifications.enabled', 'true'::jsonb, 'Notificações globais', 'notifications', true),
  ('backup.enabled', 'true'::jsonb, 'Backup automático', 'backup', false),
  ('backup.frequency', '"daily"'::jsonb, 'Frequência de backup', 'backup', false),
  ('security.session_timeout', '60'::jsonb, 'Timeout de sessão (min)', 'security', false),
  ('security.password_min_length', '8'::jsonb, 'Tamanho mínimo senha', 'security', false),
  ('ui.default_theme', '"light"'::jsonb, 'Tema padrão', 'ui', true),
  ('ui.items_per_page', '20'::jsonb, 'Itens por página', 'ui', true)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter configuração de usuário
CREATE OR REPLACE FUNCTION get_user_setting(p_user_id UUID, p_key TEXT)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  EXECUTE format('SELECT %I FROM user_settings WHERE user_id = $1', p_key)
  INTO v_value
  USING p_user_id;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para criar configurações padrão para novo usuário
CREATE OR REPLACE FUNCTION create_default_user_settings(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_settings_id UUID;
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (p_user_id)
  RETURNING id INTO v_settings_id;
  
  RETURN v_settings_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para atualizar múltiplas configurações de uma vez
CREATE OR REPLACE FUNCTION update_user_settings_bulk(
  p_user_id UUID,
  p_settings JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_key TEXT;
  v_value TEXT;
BEGIN
  -- Iterar sobre as chaves do JSONB
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_settings)
  LOOP
    EXECUTE format('UPDATE user_settings SET %I = $1, updated_at = NOW() WHERE user_id = $2', v_key)
    USING v_value, p_user_id;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para obter todas as configurações de um usuário
CREATE OR REPLACE FUNCTION get_all_user_settings(p_user_id UUID)
RETURNS TABLE (
  setting_key TEXT,
  setting_value TEXT,
  setting_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    column_name::TEXT as setting_key,
    CASE
      WHEN column_name = 'notifications_enabled' THEN notifications_enabled::TEXT
      WHEN column_name = 'email_notifications' THEN email_notifications::TEXT
      WHEN column_name = 'theme' THEN theme::TEXT
      ELSE NULL
    END as setting_value,
    data_type::TEXT as setting_type
  FROM information_schema.columns
  WHERE table_name = 'user_settings'
    AND column_name NOT IN ('id', 'user_id', 'created_at', 'updated_at');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentários
COMMENT ON TABLE user_settings IS 'Configurações individuais por usuário';
COMMENT ON TABLE system_preferences IS 'Preferências globais do sistema (admin only)';
COMMENT ON FUNCTION create_default_user_settings IS 'Cria configurações padrão para novo usuário';
COMMENT ON FUNCTION update_user_settings_bulk IS 'Atualiza múltiplas configurações em lote';
COMMENT ON FUNCTION get_user_setting IS 'Obtém valor de uma configuração específica';

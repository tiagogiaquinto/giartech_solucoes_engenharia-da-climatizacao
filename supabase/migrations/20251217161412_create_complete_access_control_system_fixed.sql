/*
  # Sistema Completo de Controle de Acesso e Auditoria

  1. Novas Tabelas
    - `system_modules`: Define todos os módulos/áreas do sistema
    - `user_module_permissions`: Permissões específicas por usuário/módulo
    - `user_usage_metrics`: Métricas de utilização por usuário
    - `user_activity_log`: Log detalhado de atividades

  2. Views
    - `v_user_permissions_summary`: Resumo de todas as permissões
    - `v_user_activity_metrics`: Métricas agregadas de atividade
    - `v_user_login_history`: Histórico de logins

  3. Functions RPC
    - `get_user_permissions(user_id)`: Retorna todas as permissões
    - `validate_user_access()`: Valida acesso a módulo
    - `log_user_activity()`: Registra atividade
    - `get_user_activity_report()`: Relatório de atividade

  4. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas restritivas por padrão
*/

-- =====================================================
-- 1. TABELA DE MÓDULOS DO SISTEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS system_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code text UNIQUE NOT NULL,
  module_name text NOT NULL,
  module_description text,
  parent_module_code text,
  icon text,
  route_path text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  requires_special_permission boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir módulos principais
INSERT INTO system_modules (module_code, module_name, module_description, icon, route_path, display_order) VALUES
  ('dashboard', 'Dashboard', 'Painel principal', 'LayoutDashboard', '/', 1),
  ('clients', 'Clientes', 'Gestão de clientes', 'Users', '/clientes', 2),
  ('service_orders', 'Ordens de Serviço', 'Gestão de OS', 'ClipboardList', '/ordens-servico', 3),
  ('calendar', 'Agenda', 'Calendário', 'Calendar', '/agenda', 4),
  ('financial', 'Financeiro', 'Gestão financeira', 'DollarSign', '/financeiro', 5),
  ('inventory', 'Estoque', 'Gestão de estoque', 'Package', '/estoque', 6),
  ('employees', 'Funcionários', 'Gestão de equipe', 'UserCog', '/funcionarios', 7),
  ('suppliers', 'Fornecedores', 'Gestão de fornecedores', 'Truck', '/fornecedores', 8),
  ('contracts', 'Contratos', 'Gestão de contratos', 'FileText', '/contratos', 9),
  ('reports', 'Relatórios', 'Relatórios e análises', 'BarChart', '/relatorios', 10),
  ('crm', 'CRM', 'Gestão de relacionamento', 'MessageSquare', '/crm', 11),
  ('settings', 'Configurações', 'Configurações', 'Settings', '/configuracoes', 12),
  ('users', 'Usuários', 'Gestão de usuários', 'Shield', '/usuarios', 13)
ON CONFLICT (module_code) DO NOTHING;

-- =====================================================
-- 2. PERMISSÕES POR USUÁRIO E MÓDULO
-- =====================================================

CREATE TABLE IF NOT EXISTS user_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  module_code text NOT NULL REFERENCES system_modules(module_code),
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_approve boolean DEFAULT false,
  can_export boolean DEFAULT false,
  custom_permissions jsonb DEFAULT '{}',
  granted_by uuid REFERENCES user_accounts(id),
  granted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_code)
);

CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user ON user_module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_module ON user_module_permissions(module_code);

-- =====================================================
-- 3. MÉTRICAS DE UTILIZAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS user_usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  total_logins integer DEFAULT 0,
  total_actions integer DEFAULT 0,
  total_time_minutes integer DEFAULT 0,
  modules_accessed jsonb DEFAULT '[]',
  actions_by_module jsonb DEFAULT '{}',
  last_activity_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_date ON user_usage_metrics(user_id, metric_date DESC);

-- =====================================================
-- 4. LOG DETALHADO DE ATIVIDADES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_accounts(id) ON DELETE SET NULL,
  user_email text,
  activity_type text NOT NULL,
  module_code text,
  resource_type text,
  resource_id text,
  action_description text,
  ip_address text,
  user_agent text,
  session_id text,
  duration_seconds integer,
  metadata jsonb DEFAULT '{}',
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_module ON user_activity_log(module_code);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON user_activity_log(created_at DESC);

-- =====================================================
-- 5. VIEWS PARA RELATÓRIOS
-- =====================================================

CREATE OR REPLACE VIEW v_user_permissions_summary AS
SELECT 
  ua.id as user_id,
  ua.email,
  ua.full_name,
  ua.access_level,
  ua.is_active,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'module_code', ump.module_code,
        'module_name', sm.module_name,
        'can_view', ump.can_view,
        'can_create', ump.can_create,
        'can_edit', ump.can_edit,
        'can_delete', ump.can_delete,
        'can_approve', ump.can_approve,
        'can_export', ump.can_export
      ) ORDER BY sm.display_order
    ) FILTER (WHERE ump.id IS NOT NULL),
    '[]'::jsonb
  ) as module_permissions,
  ua.last_login_at,
  ua.created_at
FROM user_accounts ua
LEFT JOIN user_module_permissions ump ON ua.id = ump.user_id
LEFT JOIN system_modules sm ON ump.module_code = sm.module_code
WHERE ua.deleted_at IS NULL
GROUP BY ua.id;

CREATE OR REPLACE VIEW v_user_login_history AS
SELECT 
  ual.user_id,
  ua.email,
  ua.full_name,
  ual.created_at as login_at,
  ual.ip_address,
  ual.user_agent,
  ual.success,
  ual.error_message
FROM user_activity_log ual
JOIN user_accounts ua ON ual.user_id = ua.id
WHERE ual.activity_type = 'login'
  AND ua.deleted_at IS NULL
ORDER BY ual.created_at DESC;

-- =====================================================
-- 6. FUNÇÕES RPC
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', ua.id,
    'email', ua.email,
    'full_name', ua.full_name,
    'access_level', ua.access_level,
    'is_active', ua.is_active,
    'legacy_permissions', jsonb_build_object(
      'can_invite_users', ua.can_invite_users,
      'can_manage_permissions', ua.can_manage_permissions,
      'can_view_financial', ua.can_view_financial,
      'can_edit_financial', ua.can_edit_financial,
      'can_approve_financial', ua.can_approve_financial,
      'can_manage_employees', ua.can_manage_employees,
      'can_manage_customers', ua.can_manage_customers,
      'can_manage_service_orders', ua.can_manage_service_orders,
      'can_manage_inventory', ua.can_manage_inventory,
      'can_view_reports', ua.can_view_reports,
      'can_export_data', ua.can_export_data
    ),
    'module_permissions', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'module_code', ump.module_code,
            'module_name', sm.module_name,
            'can_view', ump.can_view,
            'can_create', ump.can_create,
            'can_edit', ump.can_edit,
            'can_delete', ump.can_delete,
            'can_approve', ump.can_approve,
            'can_export', ump.can_export
          )
        )
        FROM user_module_permissions ump
        JOIN system_modules sm ON ump.module_code = sm.module_code
        WHERE ump.user_id = p_user_id
        AND sm.is_active = true
      ),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM user_accounts ua
  WHERE ua.id = p_user_id
  AND ua.deleted_at IS NULL;
  
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION validate_user_access(
  p_user_id uuid,
  p_module_code text,
  p_action text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access boolean := false;
  v_access_level text;
  v_is_active boolean;
BEGIN
  SELECT access_level, is_active INTO v_access_level, v_is_active
  FROM user_accounts
  WHERE id = p_user_id AND deleted_at IS NULL;
  
  IF NOT v_is_active THEN
    RETURN false;
  END IF;
  
  IF v_access_level = 'admin' THEN
    RETURN true;
  END IF;
  
  CASE p_action
    WHEN 'view' THEN
      SELECT can_view INTO v_has_access
      FROM user_module_permissions
      WHERE user_id = p_user_id AND module_code = p_module_code;
    WHEN 'create' THEN
      SELECT can_create INTO v_has_access
      FROM user_module_permissions
      WHERE user_id = p_user_id AND module_code = p_module_code;
    WHEN 'edit' THEN
      SELECT can_edit INTO v_has_access
      FROM user_module_permissions
      WHERE user_id = p_user_id AND module_code = p_module_code;
    WHEN 'delete' THEN
      SELECT can_delete INTO v_has_access
      FROM user_module_permissions
      WHERE user_id = p_user_id AND module_code = p_module_code;
    WHEN 'approve' THEN
      SELECT can_approve INTO v_has_access
      FROM user_module_permissions
      WHERE user_id = p_user_id AND module_code = p_module_code;
    WHEN 'export' THEN
      SELECT can_export INTO v_has_access
      FROM user_module_permissions
      WHERE user_id = p_user_id AND module_code = p_module_code;
  END CASE;
  
  RETURN COALESCE(v_has_access, false);
END;
$$;

CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id uuid,
  p_activity_type text,
  p_module_code text DEFAULT NULL,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_user_email text;
BEGIN
  SELECT email INTO v_user_email FROM user_accounts WHERE id = p_user_id;
  
  INSERT INTO user_activity_log (
    user_id,
    user_email,
    activity_type,
    module_code,
    resource_type,
    resource_id,
    action_description,
    metadata
  ) VALUES (
    p_user_id,
    v_user_email,
    p_activity_type,
    p_module_code,
    p_resource_type,
    p_resource_id,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  INSERT INTO user_usage_metrics (user_id, metric_date, total_actions, last_activity_at)
  VALUES (p_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, metric_date)
  DO UPDATE SET
    total_actions = user_usage_metrics.total_actions + 1,
    last_activity_at = now(),
    updated_at = now();
  
  RETURN v_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_activity_report(
  p_start_date timestamptz DEFAULT now() - interval '30 days',
  p_end_date timestamptz DEFAULT now(),
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  user_email text,
  user_name text,
  total_activities bigint,
  total_logins bigint,
  modules_accessed jsonb,
  last_activity timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ual.user_id,
    ua.email,
    ua.full_name,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN ual.activity_type = 'login' THEN 1 END) as total_logins,
    jsonb_agg(DISTINCT ual.module_code) FILTER (WHERE ual.module_code IS NOT NULL) as modules_accessed,
    MAX(ual.created_at) as last_activity
  FROM user_activity_log ual
  JOIN user_accounts ua ON ual.user_id = ua.id
  WHERE ual.created_at BETWEEN p_start_date AND p_end_date
    AND (p_user_id IS NULL OR ual.user_id = p_user_id)
    AND ua.deleted_at IS NULL
  GROUP BY ual.user_id, ua.email, ua.full_name
  ORDER BY total_activities DESC;
END;
$$;

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem visualizar módulos ativos" ON system_modules;
CREATE POLICY "Todos podem visualizar módulos ativos"
  ON system_modules FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Usuários podem ver suas permissões" ON user_module_permissions;
CREATE POLICY "Usuários podem ver suas permissões"
  ON user_module_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins gerenciam permissões" ON user_module_permissions;
CREATE POLICY "Admins gerenciam permissões"
  ON user_module_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE id = auth.uid()
      AND access_level = 'admin'
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Usuários veem suas métricas" ON user_usage_metrics;
CREATE POLICY "Usuários veem suas métricas"
  ON user_usage_metrics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins veem todas métricas" ON user_usage_metrics;
CREATE POLICY "Admins veem todas métricas"
  ON user_usage_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE id = auth.uid()
      AND access_level = 'admin'
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Usuários veem seus logs" ON user_activity_log;
CREATE POLICY "Usuários veem seus logs"
  ON user_activity_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins veem todos logs" ON user_activity_log;
CREATE POLICY "Admins veem todos logs"
  ON user_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE id = auth.uid()
      AND access_level = 'admin'
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Sistema insere logs" ON user_activity_log;
CREATE POLICY "Sistema insere logs"
  ON user_activity_log FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- =====================================================
-- 8. GRANTS
-- =====================================================

GRANT SELECT ON system_modules TO authenticated, anon;
GRANT SELECT ON user_module_permissions TO authenticated;
GRANT SELECT ON user_usage_metrics TO authenticated;
GRANT SELECT, INSERT ON user_activity_log TO authenticated, anon;
GRANT ALL ON user_module_permissions TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_permissions TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_user_access TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_activity_report TO authenticated;

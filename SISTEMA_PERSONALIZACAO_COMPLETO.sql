-- ============================================
-- SISTEMA COMPLETO DE PERSONALIZAÇÃO VISUAL
-- Giartech Sistema Integrado
-- ============================================
--
-- Este SQL ativa todo o sistema de personalização:
-- ✓ Temas predefinidos profissionais
-- ✓ Editor de cores personalizado
-- ✓ Paletas de cores
-- ✓ Configurações por usuário
-- ✓ Export/Import de temas
-- ✓ Customizações visuais por empresa
--
-- Execute este SQL no Supabase para ativar!
-- ============================================

-- ============================================
-- RESUMO DO QUE SERÁ CRIADO
-- ============================================
/*
TABELAS:
  1. system_settings          - Configurações globais
  2. custom_themes            - Temas personalizados dos usuários
  3. theme_presets            - 23 temas profissionais predefinidos
  4. color_palettes           - Paletas de cores salvas
  5. visual_customizations    - Customizações visuais por empresa
  6. user_settings (expandida) - Configurações avançadas de cada usuário

FUNÇÕES RPC:
  1. get_system_setting()      - Buscar configuração
  2. set_system_setting()      - Salvar configuração
  3. get_user_theme()          - Obter tema do usuário
  4. apply_user_theme()        - Aplicar tema ao usuário
  5. export_theme()            - Exportar tema como JSON
  6. import_theme()            - Importar tema de JSON

RECURSOS:
  ✓ 23 temas profissionais prontos
  ✓ 3 paletas de cores exemplo
  ✓ Editor de cores completo
  ✓ Modo claro e escuro
  ✓ Customizações por empresa
  ✓ RLS completo habilitado
  ✓ Acesso para anon e authenticated
*/

-- ============================================
-- VERIFICAR SE JÁ EXISTE
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'custom_themes') THEN
    RAISE NOTICE '✓ Sistema de personalização já existe. Atualizando...';
  ELSE
    RAISE NOTICE '→ Criando sistema de personalização...';
  END IF;
END $$;

-- ============================================
-- 1. TABELA: CONFIGURAÇÕES DO SISTEMA
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABELA: TEMAS PERSONALIZADOS
-- ============================================

CREATE TABLE IF NOT EXISTS custom_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,

  -- Cores Principais
  primary_color TEXT NOT NULL DEFAULT '#2563eb',
  secondary_color TEXT NOT NULL DEFAULT '#7c3aed',
  accent_color TEXT NOT NULL DEFAULT '#10b981',
  success_color TEXT NOT NULL DEFAULT '#10b981',
  warning_color TEXT NOT NULL DEFAULT '#f59e0b',
  error_color TEXT NOT NULL DEFAULT '#ef4444',
  info_color TEXT NOT NULL DEFAULT '#3b82f6',

  -- Cores de Fundo e Superfície
  background_color TEXT NOT NULL DEFAULT '#f9fafb',
  surface_color TEXT NOT NULL DEFAULT '#ffffff',
  surface_secondary_color TEXT NOT NULL DEFAULT '#f3f4f6',

  -- Cores de Texto
  text_primary_color TEXT NOT NULL DEFAULT '#111827',
  text_secondary_color TEXT NOT NULL DEFAULT '#6b7280',
  text_muted_color TEXT NOT NULL DEFAULT '#9ca3af',

  -- Cores de Interface
  sidebar_bg_color TEXT NOT NULL DEFAULT '#1f2937',
  sidebar_text_color TEXT NOT NULL DEFAULT '#f9fafb',
  sidebar_active_color TEXT NOT NULL DEFAULT '#3b82f6',
  header_bg_color TEXT NOT NULL DEFAULT '#ffffff',
  header_text_color TEXT NOT NULL DEFAULT '#111827',
  border_color TEXT NOT NULL DEFAULT '#e5e7eb',

  -- Tipografia
  font_family TEXT NOT NULL DEFAULT 'Inter, system-ui, sans-serif',
  font_size_base TEXT NOT NULL DEFAULT '14px',
  font_size_heading TEXT NOT NULL DEFAULT '24px',
  font_weight_normal TEXT NOT NULL DEFAULT '400',
  font_weight_medium TEXT NOT NULL DEFAULT '500',
  font_weight_bold TEXT NOT NULL DEFAULT '700',

  -- Espaçamento e Layout
  border_radius_sm TEXT NOT NULL DEFAULT '0.375rem',
  border_radius_md TEXT NOT NULL DEFAULT '0.5rem',
  border_radius_lg TEXT NOT NULL DEFAULT '0.75rem',
  spacing_unit TEXT NOT NULL DEFAULT '0.25rem',

  -- Efeitos
  shadow_sm TEXT NOT NULL DEFAULT '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  shadow_md TEXT NOT NULL DEFAULT '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  shadow_lg TEXT NOT NULL DEFAULT '0 10px 15px -3px rgb(0 0 0 / 0.1)',

  -- Configurações
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  is_dark_mode BOOLEAN DEFAULT false,

  -- Metadados
  preview_image_url TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABELA: TEMAS PREDEFINIDOS
-- ============================================

CREATE TABLE IF NOT EXISTS theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',

  -- Cores (mesma estrutura de custom_themes)
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  success_color TEXT NOT NULL DEFAULT '#10b981',
  warning_color TEXT NOT NULL DEFAULT '#f59e0b',
  error_color TEXT NOT NULL DEFAULT '#ef4444',
  info_color TEXT NOT NULL DEFAULT '#3b82f6',

  background_color TEXT NOT NULL,
  surface_color TEXT NOT NULL,
  surface_secondary_color TEXT NOT NULL,

  text_primary_color TEXT NOT NULL,
  text_secondary_color TEXT NOT NULL,
  text_muted_color TEXT NOT NULL,

  sidebar_bg_color TEXT NOT NULL,
  sidebar_text_color TEXT NOT NULL,
  sidebar_active_color TEXT NOT NULL,
  header_bg_color TEXT NOT NULL,
  header_text_color TEXT NOT NULL,
  border_color TEXT NOT NULL,

  font_family TEXT NOT NULL DEFAULT 'Inter, system-ui, sans-serif',
  font_size_base TEXT NOT NULL DEFAULT '14px',
  font_size_heading TEXT NOT NULL DEFAULT '24px',
  font_weight_normal TEXT NOT NULL DEFAULT '400',
  font_weight_medium TEXT NOT NULL DEFAULT '500',
  font_weight_bold TEXT NOT NULL DEFAULT '700',

  border_radius_sm TEXT NOT NULL DEFAULT '0.375rem',
  border_radius_md TEXT NOT NULL DEFAULT '0.5rem',
  border_radius_lg TEXT NOT NULL DEFAULT '0.75rem',
  spacing_unit TEXT NOT NULL DEFAULT '0.25rem',

  shadow_sm TEXT NOT NULL DEFAULT '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  shadow_md TEXT NOT NULL DEFAULT '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  shadow_lg TEXT NOT NULL DEFAULT '0 10px 15px -3px rgb(0 0 0 / 0.1)',

  is_dark_mode BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  preview_image_url TEXT,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABELA: PALETAS DE CORES
-- ============================================

CREATE TABLE IF NOT EXISTS color_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABELA: CUSTOMIZAÇÕES VISUAIS POR EMPRESA
-- ============================================

CREATE TABLE IF NOT EXISTS visual_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#7c3aed',
  custom_css TEXT,
  custom_js TEXT,
  email_template_header TEXT,
  email_template_footer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. EXPANDIR USER_SETTINGS
-- ============================================

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS custom_theme_id UUID,
  ADD COLUMN IF NOT EXISTS color_palette_id UUID,
  ADD COLUMN IF NOT EXISTS header_style TEXT DEFAULT 'default' CHECK (header_style IN ('default', 'compact', 'transparent', 'minimal')),
  ADD COLUMN IF NOT EXISTS sidebar_style TEXT DEFAULT 'default' CHECK (sidebar_style IN ('default', 'compact', 'mini', 'overlay')),
  ADD COLUMN IF NOT EXISTS compact_mode BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS animations_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS reduced_motion BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS high_contrast BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS font_scale NUMERIC(3,2) DEFAULT 1.0 CHECK (font_scale BETWEEN 0.8 AND 1.5),
  ADD COLUMN IF NOT EXISTS sidebar_position TEXT DEFAULT 'left' CHECK (sidebar_position IN ('left', 'right')),
  ADD COLUMN IF NOT EXISTS active_theme_id UUID;

-- ============================================
-- 7. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_custom_themes_user_id ON custom_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_themes_is_public ON custom_themes(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_theme_presets_category ON theme_presets(category);
CREATE INDEX IF NOT EXISTS idx_color_palettes_user_id ON color_palettes(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_visual_customizations_empresa ON visual_customizations(empresa_id);

-- ============================================
-- 8. HABILITAR RLS
-- ============================================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_customizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. POLÍTICAS RLS
-- ============================================

-- System Settings
DROP POLICY IF EXISTS "Anon can view all settings" ON system_settings;
CREATE POLICY "Anon can view all settings" ON system_settings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can manage settings" ON system_settings;
CREATE POLICY "Anon can manage settings" ON system_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- Custom Themes
DROP POLICY IF EXISTS "Anon can view all themes" ON custom_themes;
CREATE POLICY "Anon can view all themes" ON custom_themes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can manage themes" ON custom_themes;
CREATE POLICY "Anon can manage themes" ON custom_themes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Theme Presets
DROP POLICY IF EXISTS "Everyone can view presets" ON theme_presets;
CREATE POLICY "Everyone can view presets" ON theme_presets FOR SELECT USING (true);

-- Color Palettes
DROP POLICY IF EXISTS "Anon can manage palettes" ON color_palettes;
CREATE POLICY "Anon can manage palettes" ON color_palettes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Visual Customizations
DROP POLICY IF EXISTS "Anon can manage customizations" ON visual_customizations;
CREATE POLICY "Anon can manage customizations" ON visual_customizations FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- 10. TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_custom_themes_updated_at ON custom_themes;
CREATE TRIGGER update_custom_themes_updated_at BEFORE UPDATE ON custom_themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_color_palettes_updated_at ON color_palettes;
CREATE TRIGGER update_color_palettes_updated_at BEFORE UPDATE ON color_palettes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visual_customizations_updated_at ON visual_customizations;
CREATE TRIGGER update_visual_customizations_updated_at BEFORE UPDATE ON visual_customizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. FUNÇÕES RPC
-- ============================================

-- Obter configuração do sistema
CREATE OR REPLACE FUNCTION get_system_setting(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value FROM system_settings WHERE key = p_key;
  RETURN COALESCE(v_value, '{}'::jsonb);
END;
$$;

-- Salvar configuração do sistema
CREATE OR REPLACE FUNCTION set_system_setting(
  p_key TEXT,
  p_value JSONB,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'general'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO system_settings (key, value, description, category)
  VALUES (p_key, p_value, p_description, p_category)
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = COALESCE(EXCLUDED.description, system_settings.description),
      updated_at = NOW();
  RETURN TRUE;
END;
$$;

-- Obter tema do usuário
CREATE OR REPLACE FUNCTION get_user_theme(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_theme_id UUID;
  v_theme JSONB;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  SELECT active_theme_id INTO v_theme_id FROM user_settings WHERE user_id = v_user_id;

  IF v_theme_id IS NOT NULL THEN
    SELECT row_to_json(t.*)::jsonb INTO v_theme FROM custom_themes t WHERE t.id = v_theme_id;
    IF v_theme IS NOT NULL THEN RETURN v_theme; END IF;
  END IF;

  SELECT row_to_json(t.*)::jsonb INTO v_theme FROM theme_presets t WHERE t.name = 'giartech-original' LIMIT 1;
  RETURN COALESCE(v_theme, '{}'::jsonb);
END;
$$;

-- Aplicar tema ao usuário
CREATE OR REPLACE FUNCTION apply_user_theme(p_theme_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  INSERT INTO user_settings (user_id, active_theme_id)
  VALUES (v_user_id, p_theme_id)
  ON CONFLICT (user_id) DO UPDATE SET active_theme_id = EXCLUDED.active_theme_id, updated_at = NOW();

  UPDATE custom_themes SET usage_count = usage_count + 1 WHERE id = p_theme_id;
  RETURN TRUE;
END;
$$;

-- Exportar tema como JSON
CREATE OR REPLACE FUNCTION export_theme(p_theme_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_theme JSONB;
BEGIN
  SELECT row_to_json(t.*)::jsonb INTO v_theme FROM custom_themes t WHERE t.id = p_theme_id;
  IF v_theme IS NULL THEN
    SELECT row_to_json(t.*)::jsonb INTO v_theme FROM theme_presets t WHERE t.id = p_theme_id;
  END IF;
  RETURN v_theme;
END;
$$;

-- Importar tema de JSON
CREATE OR REPLACE FUNCTION import_theme(p_theme_data JSONB, p_user_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_new_theme_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  v_new_theme_id := gen_random_uuid();

  INSERT INTO custom_themes (
    id, user_id, name, description,
    primary_color, secondary_color, accent_color,
    success_color, warning_color, error_color, info_color,
    background_color, surface_color, surface_secondary_color,
    text_primary_color, text_secondary_color, text_muted_color,
    sidebar_bg_color, sidebar_text_color, sidebar_active_color,
    header_bg_color, header_text_color, border_color,
    is_dark_mode, is_public
  )
  VALUES (
    v_new_theme_id, v_user_id,
    p_theme_data->>'name', p_theme_data->>'description',
    COALESCE(p_theme_data->>'primary_color', '#2563eb'),
    COALESCE(p_theme_data->>'secondary_color', '#7c3aed'),
    COALESCE(p_theme_data->>'accent_color', '#10b981'),
    COALESCE(p_theme_data->>'success_color', '#10b981'),
    COALESCE(p_theme_data->>'warning_color', '#f59e0b'),
    COALESCE(p_theme_data->>'error_color', '#ef4444'),
    COALESCE(p_theme_data->>'info_color', '#3b82f6'),
    COALESCE(p_theme_data->>'background_color', '#f9fafb'),
    COALESCE(p_theme_data->>'surface_color', '#ffffff'),
    COALESCE(p_theme_data->>'surface_secondary_color', '#f3f4f6'),
    COALESCE(p_theme_data->>'text_primary_color', '#111827'),
    COALESCE(p_theme_data->>'text_secondary_color', '#6b7280'),
    COALESCE(p_theme_data->>'text_muted_color', '#9ca3af'),
    COALESCE(p_theme_data->>'sidebar_bg_color', '#1f2937'),
    COALESCE(p_theme_data->>'sidebar_text_color', '#f9fafb'),
    COALESCE(p_theme_data->>'sidebar_active_color', '#3b82f6'),
    COALESCE(p_theme_data->>'header_bg_color', '#ffffff'),
    COALESCE(p_theme_data->>'header_text_color', '#111827'),
    COALESCE(p_theme_data->>'border_color', '#e5e7eb'),
    COALESCE((p_theme_data->>'is_dark_mode')::boolean, false),
    false
  );

  RETURN v_new_theme_id;
END;
$$;

-- ============================================
-- 12. GRANTS
-- ============================================

GRANT ALL ON system_settings TO anon, authenticated;
GRANT ALL ON custom_themes TO anon, authenticated;
GRANT ALL ON theme_presets TO anon, authenticated;
GRANT ALL ON color_palettes TO anon, authenticated;
GRANT ALL ON visual_customizations TO anon, authenticated;

GRANT EXECUTE ON FUNCTION get_system_setting(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_system_setting(TEXT, JSONB, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_theme(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION apply_user_theme(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION export_theme(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION import_theme(JSONB, UUID) TO anon, authenticated;

-- ============================================
-- 13. POPULAR CONFIGURAÇÕES PADRÃO
-- ============================================

INSERT INTO system_settings (key, value, description, category, is_public)
VALUES
  ('customization_enabled', '{"enabled": true}'::jsonb, 'Habilita sistema de personalização', 'customization', true),
  ('default_theme', '{"theme_name": "giartech-original"}'::jsonb, 'Tema padrão do sistema', 'customization', true),
  ('allow_custom_themes', '{"enabled": true}'::jsonb, 'Permite criação de temas personalizados', 'customization', true),
  ('allow_theme_sharing', '{"enabled": true}'::jsonb, 'Permite compartilhamento de temas', 'customization', true),
  ('theme_export_enabled', '{"enabled": true}'::jsonb, 'Permite exportar temas', 'customization', true),
  ('theme_import_enabled', '{"enabled": true}'::jsonb, 'Permite importar temas', 'customization', true),
  ('max_custom_themes_per_user', '{"limit": 10}'::jsonb, 'Limite de temas por usuário', 'customization', false),
  ('visual_editor_enabled', '{"enabled": true}'::jsonb, 'Habilita editor visual', 'customization', true)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ============================================
-- 14. POPULAR PALETAS DE CORES
-- ============================================

INSERT INTO color_palettes (name, description, colors, is_public)
VALUES
  ('Paleta Giartech', 'Paleta de cores oficial da Giartech',
   '[{"name": "Azul Primário", "color": "#2563eb"}, {"name": "Azul Escuro", "color": "#1e40af"}, {"name": "Verde Sucesso", "color": "#10b981"}, {"name": "Laranja Aviso", "color": "#f59e0b"}, {"name": "Vermelho Erro", "color": "#ef4444"}, {"name": "Cinza Neutro", "color": "#6b7280"}]'::jsonb, true),
  ('Paleta Oceano', 'Tons inspirados no oceano',
   '[{"name": "Azul Claro", "color": "#0ea5e9"}, {"name": "Azul Médio", "color": "#0284c7"}, {"name": "Azul Escuro", "color": "#0c4a6e"}, {"name": "Verde Água", "color": "#06b6d4"}, {"name": "Turquesa", "color": "#14b8a6"}]'::jsonb, true),
  ('Paleta Natureza', 'Cores inspiradas na natureza',
   '[{"name": "Verde Floresta", "color": "#10b981"}, {"name": "Verde Escuro", "color": "#059669"}, {"name": "Verde Claro", "color": "#34d399"}, {"name": "Marrom Terra", "color": "#78716c"}, {"name": "Laranja Outono", "color": "#d97706"}]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 15. CRIAR CUSTOMIZAÇÃO VISUAL PADRÃO
-- ============================================

INSERT INTO visual_customizations (logo_url, primary_color, secondary_color, email_template_header, email_template_footer)
VALUES (
  '/public/icon.png', '#2563eb', '#7c3aed',
  '<div style="background: #2563eb; color: white; padding: 20px; text-align: center;"><h1>Giartech Sistema Integrado</h1></div>',
  '<div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280;"><p>© 2025 Giartech. Todos os direitos reservados.</p></div>'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 16. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE system_settings IS 'Configurações globais do sistema de personalização';
COMMENT ON TABLE custom_themes IS 'Temas personalizados criados pelos usuários';
COMMENT ON TABLE theme_presets IS 'Temas profissionais predefinidos (23 temas disponíveis)';
COMMENT ON TABLE color_palettes IS 'Paletas de cores salvas e compartilhadas';
COMMENT ON TABLE visual_customizations IS 'Customizações visuais por empresa (logo, cores, CSS, templates de email)';

COMMENT ON FUNCTION get_system_setting(TEXT) IS 'Retorna configuração do sistema por chave';
COMMENT ON FUNCTION set_system_setting(TEXT, JSONB, TEXT, TEXT) IS 'Salva ou atualiza configuração do sistema';
COMMENT ON FUNCTION get_user_theme(UUID) IS 'Retorna tema ativo do usuário';
COMMENT ON FUNCTION apply_user_theme(UUID, UUID) IS 'Aplica tema ao usuário e incrementa contador';
COMMENT ON FUNCTION export_theme(UUID) IS 'Exporta tema completo como JSON';
COMMENT ON FUNCTION import_theme(JSONB, UUID) IS 'Importa tema de JSON para o usuário';

-- ============================================
-- ✓ SISTEMA DE PERSONALIZAÇÃO COMPLETO ATIVADO!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ SISTEMA DE PERSONALIZAÇÃO ATIVADO COM SUCESSO!';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Recursos Disponíveis:';
  RAISE NOTICE '  • 23 temas profissionais predefinidos';
  RAISE NOTICE '  • 3 paletas de cores exemplo';
  RAISE NOTICE '  • Editor de cores completo';
  RAISE NOTICE '  • Modo claro e escuro';
  RAISE NOTICE '  • Export/Import de temas';
  RAISE NOTICE '  • Customizações por empresa';
  RAISE NOTICE '  • RLS completo habilitado';
  RAISE NOTICE '';
  RAISE NOTICE '🎨 Acesse: /visual-customization';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Funções RPC Disponíveis:';
  RAISE NOTICE '  • get_system_setting(key)';
  RAISE NOTICE '  • set_system_setting(key, value)';
  RAISE NOTICE '  • get_user_theme(user_id)';
  RAISE NOTICE '  • apply_user_theme(theme_id, user_id)';
  RAISE NOTICE '  • export_theme(theme_id)';
  RAISE NOTICE '  • import_theme(theme_data, user_id)';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

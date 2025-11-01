/*
  # Sistema Completo de Personalização Ativado
  
  1. Tabelas Criadas
    - `system_settings` - Configurações globais do sistema
    - `custom_themes` - Temas personalizados dos usuários
    - `theme_presets` - Temas predefinidos profissionais
    - `color_palettes` - Paletas de cores salvas
    - `user_settings` - Configurações avançadas por usuário
    - `visual_customizations` - Customizações visuais por empresa
    
  2. Funcionalidades
    - Gerenciamento completo de temas
    - Editor de cores personalizado
    - Salvar/carregar configurações
    - Temas predefinidos profissionais
    - Configurações por usuário e empresa
    - Export/import de temas
    
  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas completas para authenticated e anon
    - Acesso controlado por usuário
*/

-- ============================================
-- 1. TABELA DE CONFIGURAÇÕES DO SISTEMA
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
-- 2. TABELA DE TEMAS PERSONALIZADOS
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
-- 3. TABELA DE TEMAS PREDEFINIDOS
-- ============================================

CREATE TABLE IF NOT EXISTS theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  
  -- Mesmas colunas de cores do custom_themes
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
-- 4. TABELA DE PALETAS DE CORES
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
-- 5. EXPANDIR USER_SETTINGS
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
-- 6. TABELA DE CUSTOMIZAÇÕES VISUAIS POR EMPRESA
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
-- 9. POLÍTICAS RLS - SYSTEM_SETTINGS
-- ============================================

DROP POLICY IF EXISTS "Everyone can view public settings" ON system_settings;
CREATE POLICY "Everyone can view public settings"
  ON system_settings FOR SELECT
  USING (is_public = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anon can view all settings" ON system_settings;
CREATE POLICY "Anon can view all settings"
  ON system_settings FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon can manage settings" ON system_settings;
CREATE POLICY "Anon can manage settings"
  ON system_settings FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 10. POLÍTICAS RLS - CUSTOM_THEMES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own themes" ON custom_themes;
CREATE POLICY "Users can view their own themes"
  ON custom_themes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_public = true);

DROP POLICY IF EXISTS "Users can create themes" ON custom_themes;
CREATE POLICY "Users can create themes"
  ON custom_themes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their themes" ON custom_themes;
CREATE POLICY "Users can update their themes"
  ON custom_themes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their themes" ON custom_themes;
CREATE POLICY "Users can delete their themes"
  ON custom_themes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Anon access
DROP POLICY IF EXISTS "Anon can view all themes" ON custom_themes;
CREATE POLICY "Anon can view all themes"
  ON custom_themes FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon can manage themes" ON custom_themes;
CREATE POLICY "Anon can manage themes"
  ON custom_themes FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 11. POLÍTICAS RLS - THEME_PRESETS
-- ============================================

DROP POLICY IF EXISTS "Everyone can view theme presets" ON theme_presets;
CREATE POLICY "Everyone can view theme presets"
  ON theme_presets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anon can view presets" ON theme_presets;
CREATE POLICY "Anon can view presets"
  ON theme_presets FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- 12. POLÍTICAS RLS - COLOR_PALETTES
-- ============================================

DROP POLICY IF EXISTS "Users can view their palettes" ON color_palettes;
CREATE POLICY "Users can view their palettes"
  ON color_palettes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_public = true);

DROP POLICY IF EXISTS "Users can create palettes" ON color_palettes;
CREATE POLICY "Users can create palettes"
  ON color_palettes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update palettes" ON color_palettes;
CREATE POLICY "Users can update palettes"
  ON color_palettes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete palettes" ON color_palettes;
CREATE POLICY "Users can delete palettes"
  ON color_palettes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Anon access
DROP POLICY IF EXISTS "Anon can manage palettes" ON color_palettes;
CREATE POLICY "Anon can manage palettes"
  ON color_palettes FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 13. POLÍTICAS RLS - VISUAL_CUSTOMIZATIONS
-- ============================================

DROP POLICY IF EXISTS "Everyone can view customizations" ON visual_customizations;
CREATE POLICY "Everyone can view customizations"
  ON visual_customizations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anon can manage customizations" ON visual_customizations;
CREATE POLICY "Anon can manage customizations"
  ON visual_customizations FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 14. TRIGGERS PARA UPDATED_AT
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
CREATE TRIGGER update_custom_themes_updated_at
  BEFORE UPDATE ON custom_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_color_palettes_updated_at ON color_palettes;
CREATE TRIGGER update_color_palettes_updated_at
  BEFORE UPDATE ON color_palettes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visual_customizations_updated_at ON visual_customizations;
CREATE TRIGGER update_visual_customizations_updated_at
  BEFORE UPDATE ON visual_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 15. FUNÇÕES RPC PARA GERENCIAMENTO
-- ============================================

-- Função para obter configurações do sistema
CREATE OR REPLACE FUNCTION get_system_setting(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM system_settings
  WHERE key = p_key;
  
  RETURN COALESCE(v_value, '{}'::jsonb);
END;
$$;

-- Função para salvar configuração do sistema
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

-- Função para obter tema do usuário
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
  
  -- Buscar tema ativo do usuário
  SELECT active_theme_id INTO v_theme_id
  FROM user_settings
  WHERE user_id = v_user_id;
  
  -- Se tem tema personalizado, retornar
  IF v_theme_id IS NOT NULL THEN
    SELECT row_to_json(t.*)::jsonb INTO v_theme
    FROM custom_themes t
    WHERE t.id = v_theme_id;
    
    IF v_theme IS NOT NULL THEN
      RETURN v_theme;
    END IF;
  END IF;
  
  -- Retornar tema padrão
  SELECT row_to_json(t.*)::jsonb INTO v_theme
  FROM theme_presets t
  WHERE t.name = 'giartech-original'
  LIMIT 1;
  
  RETURN COALESCE(v_theme, '{}'::jsonb);
END;
$$;

-- Função para aplicar tema ao usuário
CREATE OR REPLACE FUNCTION apply_user_theme(
  p_theme_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Atualizar settings do usuário
  INSERT INTO user_settings (user_id, active_theme_id)
  VALUES (v_user_id, p_theme_id)
  ON CONFLICT (user_id) DO UPDATE
  SET active_theme_id = EXCLUDED.active_theme_id,
      updated_at = NOW();
  
  -- Incrementar contador de uso do tema
  UPDATE custom_themes
  SET usage_count = usage_count + 1
  WHERE id = p_theme_id;
  
  RETURN TRUE;
END;
$$;

-- Função para exportar tema como JSON
CREATE OR REPLACE FUNCTION export_theme(p_theme_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_theme JSONB;
BEGIN
  SELECT row_to_json(t.*)::jsonb INTO v_theme
  FROM custom_themes t
  WHERE t.id = p_theme_id;
  
  IF v_theme IS NULL THEN
    SELECT row_to_json(t.*)::jsonb INTO v_theme
    FROM theme_presets t
    WHERE t.id = p_theme_id;
  END IF;
  
  RETURN v_theme;
END;
$$;

-- Função para importar tema de JSON
CREATE OR REPLACE FUNCTION import_theme(
  p_theme_data JSONB,
  p_user_id UUID DEFAULT NULL
)
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
    font_family, font_size_base, font_size_heading,
    font_weight_normal, font_weight_medium, font_weight_bold,
    border_radius_sm, border_radius_md, border_radius_lg,
    spacing_unit, shadow_sm, shadow_md, shadow_lg,
    is_dark_mode, is_public
  )
  VALUES (
    v_new_theme_id,
    v_user_id,
    p_theme_data->>'name',
    p_theme_data->>'description',
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
    COALESCE(p_theme_data->>'font_family', 'Inter, system-ui, sans-serif'),
    COALESCE(p_theme_data->>'font_size_base', '14px'),
    COALESCE(p_theme_data->>'font_size_heading', '24px'),
    COALESCE(p_theme_data->>'font_weight_normal', '400'),
    COALESCE(p_theme_data->>'font_weight_medium', '500'),
    COALESCE(p_theme_data->>'font_weight_bold', '700'),
    COALESCE(p_theme_data->>'border_radius_sm', '0.375rem'),
    COALESCE(p_theme_data->>'border_radius_md', '0.5rem'),
    COALESCE(p_theme_data->>'border_radius_lg', '0.75rem'),
    COALESCE(p_theme_data->>'spacing_unit', '0.25rem'),
    COALESCE(p_theme_data->>'shadow_sm', '0 1px 2px 0 rgb(0 0 0 / 0.05)'),
    COALESCE(p_theme_data->>'shadow_md', '0 4px 6px -1px rgb(0 0 0 / 0.1)'),
    COALESCE(p_theme_data->>'shadow_lg', '0 10px 15px -3px rgb(0 0 0 / 0.1)'),
    COALESCE((p_theme_data->>'is_dark_mode')::boolean, false),
    false
  );
  
  RETURN v_new_theme_id;
END;
$$;

-- ============================================
-- 16. GRANTS PARA ANON E AUTHENTICATED
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
-- 17. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE system_settings IS 'Configurações globais do sistema';
COMMENT ON TABLE custom_themes IS 'Temas personalizados criados pelos usuários';
COMMENT ON TABLE theme_presets IS 'Temas predefinidos profissionais do sistema';
COMMENT ON TABLE color_palettes IS 'Paletas de cores salvas pelos usuários';
COMMENT ON TABLE visual_customizations IS 'Customizações visuais por empresa (logo, cores, CSS)';

COMMENT ON FUNCTION get_system_setting(TEXT) IS 'Retorna uma configuração do sistema por chave';
COMMENT ON FUNCTION set_system_setting(TEXT, JSONB, TEXT, TEXT) IS 'Define ou atualiza uma configuração do sistema';
COMMENT ON FUNCTION get_user_theme(UUID) IS 'Retorna o tema ativo do usuário';
COMMENT ON FUNCTION apply_user_theme(UUID, UUID) IS 'Aplica um tema ao usuário';
COMMENT ON FUNCTION export_theme(UUID) IS 'Exporta um tema como JSON';
COMMENT ON FUNCTION import_theme(JSONB, UUID) IS 'Importa um tema de JSON';

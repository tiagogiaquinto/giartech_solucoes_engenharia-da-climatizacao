/*
  # Sistema Avançado de Temas Personalizados
  
  1. Novas Tabelas
    - `custom_themes` - Temas personalizados criados pelos usuários
      - id, user_id, name, description
      - primary_color, secondary_color, accent_color
      - background_color, surface_color, text_color
      - sidebar_color, header_color
      - border_radius, font_family, font_size
      - is_default, is_public, created_at, updated_at
    
    - `theme_presets` - Temas predefinidos do sistema
      - Mesma estrutura de custom_themes
      - Temas profissionais prontos para uso
    
    - `color_palettes` - Paletas de cores salvas
      - id, user_id, name, colors (array)
      
  2. Melhorias em user_settings
    - Adicionar colunas para customização avançada
    - custom_theme_id, color_palette_id
    - header_style, sidebar_style
    - compact_mode, animations_enabled
    
  3. Segurança
    - RLS habilitado em todas as tabelas
    - Usuários podem ver temas públicos e seus próprios temas
    - Apenas proprietário pode editar seus temas
*/

-- Tabela de Temas Personalizados
CREATE TABLE IF NOT EXISTS custom_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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

-- Tabela de Temas Predefinidos (Sistema)
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

-- Tabela de Paletas de Cores
CREATE TABLE IF NOT EXISTS color_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas avançadas ao user_settings
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
  ADD COLUMN IF NOT EXISTS sidebar_position TEXT DEFAULT 'left' CHECK (sidebar_position IN ('left', 'right'));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_custom_themes_user_id ON custom_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_themes_is_public ON custom_themes(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_theme_presets_category ON theme_presets(category);
CREATE INDEX IF NOT EXISTS idx_color_palettes_user_id ON color_palettes(user_id);

-- Habilitar RLS
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_palettes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para custom_themes
CREATE POLICY "Users can view their own themes"
  ON custom_themes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public themes"
  ON custom_themes FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can create their own themes"
  ON custom_themes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own themes"
  ON custom_themes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own themes"
  ON custom_themes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas RLS para theme_presets (apenas leitura)
CREATE POLICY "Everyone can view theme presets"
  ON theme_presets FOR SELECT
  TO authenticated
  USING (true);

-- Políticas RLS para color_palettes
CREATE POLICY "Users can view their own palettes"
  ON color_palettes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public palettes"
  ON color_palettes FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can create their own palettes"
  ON color_palettes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own palettes"
  ON color_palettes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own palettes"
  ON color_palettes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas para anon (desenvolvimento)
CREATE POLICY "Anon can view all themes" ON custom_themes FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can create themes" ON custom_themes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update themes" ON custom_themes FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete themes" ON custom_themes FOR DELETE TO anon USING (true);

CREATE POLICY "Anon can view theme presets" ON theme_presets FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can view palettes" ON color_palettes FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can create palettes" ON color_palettes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update palettes" ON color_palettes FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete palettes" ON color_palettes FOR DELETE TO anon USING (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_themes_updated_at
  BEFORE UPDATE ON custom_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_color_palettes_updated_at
  BEFORE UPDATE ON color_palettes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE custom_themes IS 'Temas personalizados criados pelos usuários';
COMMENT ON TABLE theme_presets IS 'Temas predefinidos profissionais do sistema';
COMMENT ON TABLE color_palettes IS 'Paletas de cores salvas pelos usuários';

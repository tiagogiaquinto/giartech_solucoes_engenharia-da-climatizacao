/*
  # Sistema de Editor Visual Estilo Canva
  
  1. Novas Tabelas
    - document_canvas_designs: Designs visuais dos documentos
    - document_elements: Elementos do canvas (textos, imagens, shapes)
    - design_templates: Templates visuais pré-configurados
    - design_assets: Biblioteca de assets (imagens, ícones, fontes)
    
  2. Recursos
    - Backgrounds customizáveis (cor, gradiente, imagem)
    - Elementos drag-and-drop
    - Redimensionamento e posicionamento livre
    - Camadas e z-index
    - Estilos de texto avançados
    - Biblioteca de elementos
*/

-- Tabela de designs visuais
CREATE TABLE IF NOT EXISTS document_canvas_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES generated_documents(id) ON DELETE CASCADE,
  template_id UUID REFERENCES document_templates(id),
  canvas_width INTEGER DEFAULT 794,
  canvas_height INTEGER DEFAULT 1123,
  background_type TEXT DEFAULT 'solid' CHECK (background_type IN ('solid', 'gradient', 'image', 'pattern')),
  background_color TEXT DEFAULT '#ffffff',
  background_gradient JSONB,
  background_image TEXT,
  background_pattern TEXT,
  grid_enabled BOOLEAN DEFAULT false,
  grid_size INTEGER DEFAULT 10,
  snap_to_grid BOOLEAN DEFAULT true,
  margin_top INTEGER DEFAULT 60,
  margin_bottom INTEGER DEFAULT 60,
  margin_left INTEGER DEFAULT 60,
  margin_right INTEGER DEFAULT 60,
  page_orientation TEXT DEFAULT 'portrait' CHECK (page_orientation IN ('portrait', 'landscape')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_designs_document ON document_canvas_designs(document_id);
CREATE INDEX IF NOT EXISTS idx_canvas_designs_template ON document_canvas_designs(template_id);

-- Tabela de elementos do canvas
CREATE TABLE IF NOT EXISTS document_canvas_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID REFERENCES document_canvas_designs(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL CHECK (element_type IN ('text', 'image', 'shape', 'icon', 'line', 'signature', 'table', 'qrcode', 'barcode')),
  content TEXT,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 200,
  height INTEGER NOT NULL DEFAULT 100,
  rotation DECIMAL(5,2) DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  locked BOOLEAN DEFAULT false,
  visible BOOLEAN DEFAULT true,
  opacity DECIMAL(3,2) DEFAULT 1.0,
  
  font_family TEXT DEFAULT 'Inter',
  font_size INTEGER DEFAULT 14,
  font_weight TEXT DEFAULT 'normal',
  font_style TEXT DEFAULT 'normal',
  text_align TEXT DEFAULT 'left',
  text_decoration TEXT,
  line_height DECIMAL(3,2) DEFAULT 1.5,
  letter_spacing DECIMAL(4,2) DEFAULT 0,
  
  fill_color TEXT,
  fill_gradient JSONB,
  stroke_color TEXT,
  stroke_width INTEGER DEFAULT 0,
  stroke_style TEXT DEFAULT 'solid',
  
  border_radius INTEGER DEFAULT 0,
  border_color TEXT,
  border_width INTEGER DEFAULT 0,
  border_style TEXT DEFAULT 'solid',
  
  shadow_enabled BOOLEAN DEFAULT false,
  shadow_x INTEGER DEFAULT 0,
  shadow_y INTEGER DEFAULT 4,
  shadow_blur INTEGER DEFAULT 8,
  shadow_color TEXT DEFAULT 'rgba(0,0,0,0.1)',
  
  image_url TEXT,
  image_fit TEXT DEFAULT 'cover' CHECK (image_fit IN ('cover', 'contain', 'fill', 'none')),
  
  shape_type TEXT,
  
  variables JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_elements_design ON document_canvas_elements(design_id);
CREATE INDEX IF NOT EXISTS idx_canvas_elements_zindex ON document_canvas_elements(z_index);

-- Tabela de templates visuais
CREATE TABLE IF NOT EXISTS design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  thumbnail TEXT,
  canvas_design JSONB NOT NULL,
  elements JSONB NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_templates_category ON design_templates(category);
CREATE INDEX IF NOT EXISTS idx_design_templates_tags ON design_templates USING gin(tags);

-- Tabela de assets
CREATE TABLE IF NOT EXISTS design_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'icon', 'illustration', 'shape', 'pattern', 'font')),
  category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_assets_type ON design_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_design_assets_category ON design_assets(category);
CREATE INDEX IF NOT EXISTS idx_design_assets_tags ON design_assets USING gin(tags);

-- Tabela de fontes
CREATE TABLE IF NOT EXISTS design_fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  font_family TEXT NOT NULL,
  font_url TEXT,
  preview_url TEXT,
  category TEXT DEFAULT 'sans-serif',
  weights TEXT[] DEFAULT ARRAY['400', '700'],
  is_system_font BOOLEAN DEFAULT false,
  is_google_font BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_fonts_category ON design_fonts(category);

-- Tabela de histórico de ações (Undo/Redo)
CREATE TABLE IF NOT EXISTS design_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID REFERENCES document_canvas_designs(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_history_design ON design_history(design_id);
CREATE INDEX IF NOT EXISTS idx_design_history_date ON design_history(created_at DESC);

-- RLS Policies
ALTER TABLE document_canvas_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_canvas_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to document_canvas_designs" ON document_canvas_designs;
CREATE POLICY "Allow full access to document_canvas_designs"
  ON document_canvas_designs FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to document_canvas_elements" ON document_canvas_elements;
CREATE POLICY "Allow full access to document_canvas_elements"
  ON document_canvas_elements FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to design_templates" ON design_templates;
CREATE POLICY "Allow full access to design_templates"
  ON design_templates FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to design_assets" ON design_assets;
CREATE POLICY "Allow full access to design_assets"
  ON design_assets FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to design_fonts" ON design_fonts;
CREATE POLICY "Allow full access to design_fonts"
  ON design_fonts FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to design_history" ON design_history;
CREATE POLICY "Allow full access to design_history"
  ON design_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Inserir fontes padrão
INSERT INTO design_fonts (name, font_family, category, weights, is_system_font, is_active)
VALUES
  ('Inter', 'Inter, sans-serif', 'sans-serif', ARRAY['300', '400', '500', '600', '700', '800'], true, true),
  ('Roboto', 'Roboto, sans-serif', 'sans-serif', ARRAY['300', '400', '500', '700', '900'], true, true),
  ('Open Sans', 'Open Sans, sans-serif', 'sans-serif', ARRAY['300', '400', '600', '700', '800'], true, true),
  ('Montserrat', 'Montserrat, sans-serif', 'sans-serif', ARRAY['300', '400', '500', '600', '700', '800'], true, true),
  ('Poppins', 'Poppins, sans-serif', 'sans-serif', ARRAY['300', '400', '500', '600', '700', '800'], true, true),
  ('Lato', 'Lato, sans-serif', 'sans-serif', ARRAY['300', '400', '700', '900'], true, true),
  ('Playfair Display', 'Playfair Display, serif', 'serif', ARRAY['400', '500', '600', '700', '800'], true, true),
  ('Merriweather', 'Merriweather, serif', 'serif', ARRAY['300', '400', '700', '900'], true, true),
  ('Bebas Neue', 'Bebas Neue, cursive', 'display', ARRAY['400'], true, true),
  ('Raleway', 'Raleway, sans-serif', 'sans-serif', ARRAY['300', '400', '500', '600', '700', '800'], true, true)
ON CONFLICT (name) DO NOTHING;

-- Inserir templates visuais iniciais
INSERT INTO design_templates (name, description, category, canvas_design, elements, is_active)
VALUES
(
  'Contrato Moderno',
  'Template moderno para contratos com design limpo',
  'Contrato',
  '{
    "canvas_width": 794,
    "canvas_height": 1123,
    "background_type": "gradient",
    "background_gradient": {
      "type": "linear",
      "angle": 135,
      "stops": [
        {"color": "#ffffff", "position": 0},
        {"color": "#f8f9fa", "position": 100}
      ]
    },
    "margin_top": 60,
    "margin_bottom": 60,
    "margin_left": 60,
    "margin_right": 60
  }'::jsonb,
  '[
    {
      "type": "shape",
      "x": 0,
      "y": 0,
      "width": 794,
      "height": 120,
      "fill_gradient": {
        "type": "linear",
        "angle": 90,
        "stops": [
          {"color": "#2563eb", "position": 0},
          {"color": "#1e40af", "position": 100}
        ]
      }
    },
    {
      "type": "text",
      "content": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS",
      "x": 60,
      "y": 40,
      "width": 674,
      "height": 40,
      "font_family": "Montserrat",
      "font_size": 28,
      "font_weight": "bold",
      "fill_color": "#ffffff",
      "text_align": "center"
    }
  ]'::jsonb,
  true
),
(
  'PMOC Profissional',
  'Template profissional para PMOC',
  'PMOC',
  '{
    "canvas_width": 794,
    "canvas_height": 1123,
    "background_type": "solid",
    "background_color": "#ffffff",
    "margin_top": 80,
    "margin_bottom": 80,
    "margin_left": 80,
    "margin_right": 80
  }'::jsonb,
  '[
    {
      "type": "shape",
      "x": 60,
      "y": 40,
      "width": 674,
      "height": 4,
      "fill_color": "#10b981",
      "border_radius": 2
    },
    {
      "type": "text",
      "content": "PLANO DE MANUTENÇÃO, OPERAÇÃO E CONTROLE",
      "x": 60,
      "y": 60,
      "width": 674,
      "height": 50,
      "font_family": "Poppins",
      "font_size": 24,
      "font_weight": "bold",
      "fill_color": "#1f2937"
    }
  ]'::jsonb,
  true
),
(
  'Orçamento Elegante',
  'Template elegante para orçamentos',
  'Orçamento',
  '{
    "canvas_width": 794,
    "canvas_height": 1123,
    "background_type": "solid",
    "background_color": "#f9fafb",
    "margin_top": 60,
    "margin_bottom": 60,
    "margin_left": 60,
    "margin_right": 60
  }'::jsonb,
  '[
    {
      "type": "shape",
      "x": 40,
      "y": 40,
      "width": 714,
      "height": 100,
      "fill_color": "#ffffff",
      "border_radius": 12,
      "shadow_enabled": true,
      "shadow_x": 0,
      "shadow_y": 4,
      "shadow_blur": 20,
      "shadow_color": "rgba(0,0,0,0.08)"
    },
    {
      "type": "text",
      "content": "ORÇAMENTO",
      "x": 80,
      "y": 70,
      "width": 634,
      "height": 40,
      "font_family": "Raleway",
      "font_size": 32,
      "font_weight": "bold",
      "fill_color": "#6366f1"
    }
  ]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;

-- Grants
GRANT ALL ON document_canvas_designs TO anon, authenticated;
GRANT ALL ON document_canvas_elements TO anon, authenticated;
GRANT ALL ON design_templates TO anon, authenticated;
GRANT ALL ON design_assets TO anon, authenticated;
GRANT ALL ON design_fonts TO anon, authenticated;
GRANT ALL ON design_history TO anon, authenticated;

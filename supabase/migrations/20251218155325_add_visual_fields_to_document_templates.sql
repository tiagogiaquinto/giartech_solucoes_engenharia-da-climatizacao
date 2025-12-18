/*
  # Adicionar Campos Visuais aos Templates de Documentos
  
  1. Novos Campos
    - `logo_url` - URL do logo da empresa
    - `header_text` - Texto do cabeçalho do documento
    - `footer_text` - Texto do rodapé do documento
    - `contract_text` - Texto alternativo de contrato (compatibilidade)
    - `layout_config` - Configurações de layout (margens, cores, fontes)
    - `show_header` - Flag para exibir cabeçalho
    - `show_footer` - Flag para exibir rodapé
    - `show_logo` - Flag para exibir logo
    
  2. Propósito
    - Permitir edição visual completa dos templates
    - Separar cabeçalho, conteúdo e rodapé para controle independente
    - Armazenar configurações visuais (cores, fontes, espaçamento)
*/

-- Adicionar campos visuais
ALTER TABLE document_templates
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS header_text TEXT,
ADD COLUMN IF NOT EXISTS footer_text TEXT,
ADD COLUMN IF NOT EXISTS contract_text TEXT,
ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT '{
  "pageWidth": 794,
  "pageHeight": 1123,
  "marginTop": 60,
  "marginBottom": 60,
  "marginLeft": 60,
  "marginRight": 60,
  "backgroundColor": "#ffffff",
  "primaryColor": "#2563eb",
  "secondaryColor": "#1e40af",
  "fontFamily": "Inter",
  "fontSize": 14,
  "lineHeight": 1.6
}'::jsonb,
ADD COLUMN IF NOT EXISTS show_header BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_footer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_logo BOOLEAN DEFAULT true;

-- Atualizar templates existentes para ter header e footer padrão
UPDATE document_templates
SET 
  header_text = COALESCE(header_text, name),
  footer_text = COALESCE(footer_text, 'Documento gerado pelo sistema Giartech - Página {page} de {total_pages}'),
  show_header = COALESCE(show_header, true),
  show_footer = COALESCE(show_footer, true),
  show_logo = COALESCE(show_logo, true)
WHERE header_text IS NULL OR footer_text IS NULL;

-- Comentário sobre uso
COMMENT ON COLUMN document_templates.logo_url IS 'URL do logo para exibir no documento';
COMMENT ON COLUMN document_templates.header_text IS 'Texto do cabeçalho (pode incluir variáveis {{empresa_nome}})';
COMMENT ON COLUMN document_templates.footer_text IS 'Texto do rodapé (pode incluir {page}, {total_pages})';
COMMENT ON COLUMN document_templates.layout_config IS 'Configurações de layout e estilo visual do documento';

/*
  # Correcao de Seguranca - Parte 7: Policies publicas em tabelas de documentos e design

  ## Tabelas corrigidas
  custom_themes, design_assets, design_fonts, design_history, design_templates,
  document_blocks, document_canvas_designs, document_canvas_elements,
  document_comments, document_edit_history, document_shares, document_signatures,
  document_template_versions, generated_documents, template_variables,
  template_version_comparisons, theme_presets, visual_customizations
*/

-- =============================================
-- CUSTOM_THEMES
-- =============================================
DROP POLICY IF EXISTS "Users can delete own custom themes" ON custom_themes;
DROP POLICY IF EXISTS "Users can create custom themes" ON custom_themes;
DROP POLICY IF EXISTS "Users can view own custom themes" ON custom_themes;
DROP POLICY IF EXISTS "Users can update own custom themes" ON custom_themes;

CREATE POLICY "custom_themes_select" ON custom_themes FOR SELECT TO authenticated USING (true);
CREATE POLICY "custom_themes_insert" ON custom_themes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "custom_themes_update" ON custom_themes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "custom_themes_delete" ON custom_themes FOR DELETE TO authenticated USING (true);

-- =============================================
-- DESIGN_ASSETS, FONTS, HISTORY, TEMPLATES
-- =============================================
DROP POLICY IF EXISTS "Allow full access to design_assets" ON design_assets;
CREATE POLICY "design_assets_authenticated" ON design_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to design_fonts" ON design_fonts;
CREATE POLICY "design_fonts_authenticated" ON design_fonts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to design_history" ON design_history;
CREATE POLICY "design_history_authenticated" ON design_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to design_templates" ON design_templates;
CREATE POLICY "design_templates_authenticated" ON design_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- DOCUMENT_BLOCKS, CANVAS_DESIGNS, CANVAS_ELEMENTS
-- =============================================
DROP POLICY IF EXISTS "Allow full access to document_blocks" ON document_blocks;
CREATE POLICY "document_blocks_authenticated" ON document_blocks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to document_canvas_designs" ON document_canvas_designs;
CREATE POLICY "document_canvas_designs_authenticated" ON document_canvas_designs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to document_canvas_elements" ON document_canvas_elements;
CREATE POLICY "document_canvas_elements_authenticated" ON document_canvas_elements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- DOCUMENT_COMMENTS, EDIT_HISTORY, SHARES, SIGNATURES
-- =============================================
DROP POLICY IF EXISTS "Allow full access to document_comments" ON document_comments;
CREATE POLICY "document_comments_authenticated" ON document_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to document_edit_history" ON document_edit_history;
CREATE POLICY "document_edit_history_authenticated" ON document_edit_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to document_shares" ON document_shares;
CREATE POLICY "document_shares_authenticated" ON document_shares FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to document_signatures" ON document_signatures;
CREATE POLICY "document_signatures_authenticated" ON document_signatures FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- DOCUMENT_TEMPLATE_VERSIONS
-- =============================================
DROP POLICY IF EXISTS "Users can view template versions" ON document_template_versions;
CREATE POLICY "document_template_versions_select" ON document_template_versions FOR SELECT TO authenticated USING (true);

-- =============================================
-- GENERATED_DOCUMENTS
-- =============================================
DROP POLICY IF EXISTS "Allow full access to generated_documents" ON generated_documents;
CREATE POLICY "generated_documents_authenticated" ON generated_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- TEMPLATE_VARIABLES
-- =============================================
DROP POLICY IF EXISTS "Anyone can view template variables" ON template_variables;
CREATE POLICY "template_variables_select" ON template_variables FOR SELECT TO authenticated USING (true);

-- =============================================
-- TEMPLATE_VERSION_COMPARISONS
-- =============================================
DROP POLICY IF EXISTS "Users can view comparisons" ON template_version_comparisons;
CREATE POLICY "template_version_comparisons_select" ON template_version_comparisons FOR SELECT TO authenticated USING (true);

-- =============================================
-- THEME_PRESETS
-- =============================================
DROP POLICY IF EXISTS "Everyone can view presets" ON theme_presets;
DROP POLICY IF EXISTS "Everyone can view theme presets" ON theme_presets;
DROP POLICY IF EXISTS "Theme presets are viewable by everyone" ON theme_presets;
CREATE POLICY "theme_presets_select" ON theme_presets FOR SELECT TO authenticated USING (true);

-- =============================================
-- VISUAL_CUSTOMIZATIONS
-- =============================================
DROP POLICY IF EXISTS "Everyone can view customizations" ON visual_customizations;
CREATE POLICY "visual_customizations_select" ON visual_customizations FOR SELECT TO authenticated USING (true);

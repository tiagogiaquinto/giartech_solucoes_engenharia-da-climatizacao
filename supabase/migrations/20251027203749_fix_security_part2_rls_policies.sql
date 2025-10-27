/*
  # Correção de Segurança Parte 2 - Otimização de Políticas RLS

  1. **Problema**: Políticas RLS re-avaliam auth.uid() para cada linha
  2. **Solução**: Usar (SELECT auth.uid()) para avaliar uma vez
  3. **Impacto**: Melhoria de performance em queries com muitos registros
*/

-- =====================================================
-- service_order_drafts - Políticas Otimizadas
-- =====================================================

DROP POLICY IF EXISTS "Users can view own drafts" ON service_order_drafts;
DROP POLICY IF EXISTS "Users can create own drafts" ON service_order_drafts;
DROP POLICY IF EXISTS "Users can update own drafts" ON service_order_drafts;
DROP POLICY IF EXISTS "Users can delete own drafts" ON service_order_drafts;

CREATE POLICY "Users can view own drafts"
  ON service_order_drafts FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own drafts"
  ON service_order_drafts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own drafts"
  ON service_order_drafts FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own drafts"
  ON service_order_drafts FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- service_order_templates - Políticas Otimizadas
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view public templates" ON service_order_templates;
DROP POLICY IF EXISTS "Users can create templates" ON service_order_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON service_order_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON service_order_templates;

CREATE POLICY "Anyone can view public templates"
  ON service_order_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = (SELECT auth.uid()));

CREATE POLICY "Users can create templates"
  ON service_order_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can update own templates"
  ON service_order_templates FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can delete own templates"
  ON service_order_templates FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));
/*
  # Correcao de Seguranca - Parte 8: Service orders, gamificacao e Thomaz AI

  ## Tabelas corrigidas
  service_order_audit_log, service_order_costs, service_order_items,
  service_order_labor, service_order_materials, service_order_team,
  service_orders (policies DELETE publicas duplicadas),
  thomaz_alerts, thomaz_conversation_memory, thomaz_financial_analysis,
  thomaz_interactions, thomaz_learned_patterns, thomaz_predictions
*/

-- =============================================
-- SERVICE_ORDER_* (remover DELETE publico duplicado)
-- =============================================
DROP POLICY IF EXISTS "Allow delete service_order_audit_log" ON service_order_audit_log;
DROP POLICY IF EXISTS "allow_all_delete" ON service_order_audit_log;
CREATE POLICY "service_order_audit_log_delete" ON service_order_audit_log FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow delete service_order_costs" ON service_order_costs;
DROP POLICY IF EXISTS "allow_all_delete" ON service_order_costs;
CREATE POLICY "service_order_costs_delete" ON service_order_costs FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow delete service_order_items" ON service_order_items;
DROP POLICY IF EXISTS "allow_all_delete" ON service_order_items;
CREATE POLICY "service_order_items_delete" ON service_order_items FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow delete service_order_labor" ON service_order_labor;
DROP POLICY IF EXISTS "allow_all_delete" ON service_order_labor;
CREATE POLICY "service_order_labor_delete" ON service_order_labor FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow delete service_order_materials" ON service_order_materials;
DROP POLICY IF EXISTS "allow_all_delete" ON service_order_materials;
CREATE POLICY "service_order_materials_delete" ON service_order_materials FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow delete service_order_team" ON service_order_team;
DROP POLICY IF EXISTS "allow_all_delete" ON service_order_team;
CREATE POLICY "service_order_team_delete" ON service_order_team FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow delete service_orders" ON service_orders;
DROP POLICY IF EXISTS "allow_all_delete" ON service_orders;
CREATE POLICY "service_orders_delete" ON service_orders FOR DELETE TO authenticated USING (true);

-- =============================================
-- THOMAZ_ALERTS
-- =============================================
DROP POLICY IF EXISTS "Acesso público a alertas" ON thomaz_alerts;
CREATE POLICY "thomaz_alerts_authenticated" ON thomaz_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- THOMAZ_CONVERSATION_MEMORY
-- =============================================
DROP POLICY IF EXISTS "Allow all for thomaz_conversation_memory" ON thomaz_conversation_memory;
CREATE POLICY "thomaz_conversation_memory_authenticated" ON thomaz_conversation_memory FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- THOMAZ_FINANCIAL_ANALYSIS (remover INSERT publico)
-- =============================================
DROP POLICY IF EXISTS "thomaz_write_analysis" ON thomaz_financial_analysis;
CREATE POLICY "thomaz_financial_analysis_insert" ON thomaz_financial_analysis FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- THOMAZ_INTERACTIONS
-- =============================================
DROP POLICY IF EXISTS "Acesso público a interações" ON thomaz_interactions;
CREATE POLICY "thomaz_interactions_authenticated" ON thomaz_interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- THOMAZ_LEARNED_PATTERNS
-- =============================================
DROP POLICY IF EXISTS "Allow all for thomaz_learned_patterns" ON thomaz_learned_patterns;
CREATE POLICY "thomaz_learned_patterns_authenticated" ON thomaz_learned_patterns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- THOMAZ_PREDICTIONS
-- =============================================
DROP POLICY IF EXISTS "Acesso público a previsões" ON thomaz_predictions;
CREATE POLICY "thomaz_predictions_authenticated" ON thomaz_predictions FOR ALL TO authenticated USING (true) WITH CHECK (true);

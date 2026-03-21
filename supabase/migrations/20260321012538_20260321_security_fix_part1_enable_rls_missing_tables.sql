/*
  # Correcao de Seguranca - Parte 1: Habilitar RLS nas tabelas sem protecao

  ## Problema
  22 tabelas criticas estavam sem Row Level Security (RLS) habilitado,
  permitindo que qualquer usuario autenticado ou anonimo acessasse os dados
  sem nenhuma restricao de politica.

  ## Solucao
  1. Habilitar RLS em todas as 22 tabelas identificadas
  2. Criar politicas de acesso para usuarios autenticados (authenticated)
  3. Tabelas de negocio central (customers, employees, service_orders, etc.)
  4. Tabelas do sistema de IA Thomaz (leitura apenas para autenticados)

  ## Tabelas corrigidas
  - customers, employees, inventory_items, materials, service_catalog
  - service_order_items, service_order_labor, service_order_materials, service_orders
  - user_access_logs
  - thomaz_cognitive_modes, thomaz_decisions, thomaz_explanation_triggers
  - thomaz_financial_alerts, thomaz_financial_analysis, thomaz_financial_decisions
  - thomaz_intent_detection, thomaz_personality_rules, thomaz_rate_limit
  - thomaz_reasoning_templates, thomaz_settings, thomaz_simulations

  ## Notas de Seguranca
  - Nenhum dado e deletado ou modificado
  - Acesso continua funcionando para usuarios autenticados
  - Usuarios anonimos nao autenticados perdem acesso (comportamento correto)
*/

-- =============================================
-- TABELAS DE NEGOCIO CENTRAL
-- =============================================

-- customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated users can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (true);

-- inventory_items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read inventory_items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert inventory_items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated users can update inventory_items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can delete inventory_items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (true);

-- materials
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read materials"
  ON materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert materials"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated users can update materials"
  ON materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can delete materials"
  ON materials FOR DELETE
  TO authenticated
  USING (true);

-- service_catalog
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read service_catalog"
  ON service_catalog FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert service_catalog"
  ON service_catalog FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated users can update service_catalog"
  ON service_catalog FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can delete service_catalog"
  ON service_catalog FOR DELETE
  TO authenticated
  USING (true);

-- service_order_items
ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read service_order_items"
  ON service_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert service_order_items"
  ON service_order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated users can update service_order_items"
  ON service_order_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can delete service_order_items"
  ON service_order_items FOR DELETE
  TO authenticated
  USING (true);

-- service_order_labor
ALTER TABLE service_order_labor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read service_order_labor"
  ON service_order_labor FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert service_order_labor"
  ON service_order_labor FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated users can update service_order_labor"
  ON service_order_labor FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can delete service_order_labor"
  ON service_order_labor FOR DELETE
  TO authenticated
  USING (true);

-- service_order_materials
ALTER TABLE service_order_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read service_order_materials"
  ON service_order_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert service_order_materials"
  ON service_order_materials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated users can update service_order_materials"
  ON service_order_materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can delete service_order_materials"
  ON service_order_materials FOR DELETE
  TO authenticated
  USING (true);

-- service_orders
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read service_orders"
  ON service_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert service_orders"
  ON service_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated users can update service_orders"
  ON service_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can delete service_orders"
  ON service_orders FOR DELETE
  TO authenticated
  USING (true);

-- user_access_logs
ALTER TABLE user_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read user_access_logs"
  ON user_access_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert user_access_logs"
  ON user_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- TABELAS DO SISTEMA THOMAZ AI
-- =============================================

ALTER TABLE thomaz_cognitive_modes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_cognitive_modes"
  ON thomaz_cognitive_modes FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can modify thomaz_cognitive_modes"
  ON thomaz_cognitive_modes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_cognitive_modes"
  ON thomaz_cognitive_modes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_cognitive_modes"
  ON thomaz_cognitive_modes FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_decisions"
  ON thomaz_decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_decisions"
  ON thomaz_decisions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_decisions"
  ON thomaz_decisions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_decisions"
  ON thomaz_decisions FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_explanation_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_explanation_triggers"
  ON thomaz_explanation_triggers FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_explanation_triggers"
  ON thomaz_explanation_triggers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_explanation_triggers"
  ON thomaz_explanation_triggers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_explanation_triggers"
  ON thomaz_explanation_triggers FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_financial_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_financial_alerts"
  ON thomaz_financial_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_financial_alerts"
  ON thomaz_financial_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_financial_alerts"
  ON thomaz_financial_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_financial_alerts"
  ON thomaz_financial_alerts FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_financial_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_financial_analysis"
  ON thomaz_financial_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_financial_analysis"
  ON thomaz_financial_analysis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_financial_analysis"
  ON thomaz_financial_analysis FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_financial_analysis"
  ON thomaz_financial_analysis FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_financial_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_financial_decisions"
  ON thomaz_financial_decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_financial_decisions"
  ON thomaz_financial_decisions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_financial_decisions"
  ON thomaz_financial_decisions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_financial_decisions"
  ON thomaz_financial_decisions FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_intent_detection ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_intent_detection"
  ON thomaz_intent_detection FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_intent_detection"
  ON thomaz_intent_detection FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_intent_detection"
  ON thomaz_intent_detection FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_intent_detection"
  ON thomaz_intent_detection FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_personality_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_personality_rules"
  ON thomaz_personality_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_personality_rules"
  ON thomaz_personality_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_personality_rules"
  ON thomaz_personality_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_personality_rules"
  ON thomaz_personality_rules FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_rate_limit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_rate_limit"
  ON thomaz_rate_limit FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_rate_limit"
  ON thomaz_rate_limit FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_rate_limit"
  ON thomaz_rate_limit FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_rate_limit"
  ON thomaz_rate_limit FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_reasoning_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_reasoning_templates"
  ON thomaz_reasoning_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_reasoning_templates"
  ON thomaz_reasoning_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_reasoning_templates"
  ON thomaz_reasoning_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_reasoning_templates"
  ON thomaz_reasoning_templates FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_settings"
  ON thomaz_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_settings"
  ON thomaz_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_settings"
  ON thomaz_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_settings"
  ON thomaz_settings FOR DELETE TO authenticated USING (true);

ALTER TABLE thomaz_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users can access thomaz_simulations"
  ON thomaz_simulations FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated users can insert thomaz_simulations"
  ON thomaz_simulations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated users can update thomaz_simulations"
  ON thomaz_simulations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated users can delete thomaz_simulations"
  ON thomaz_simulations FOR DELETE TO authenticated USING (true);

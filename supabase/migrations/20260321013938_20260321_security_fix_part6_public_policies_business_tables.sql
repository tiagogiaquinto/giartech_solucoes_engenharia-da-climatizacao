/*
  # Correcao de Seguranca - Parte 6: Policies publicas em tabelas de negocio

  ## Problema
  Diversas tabelas tinham policies com role {public} (equivale a qualquer pessoa,
  mesmo sem autenticacao), permitindo acesso irrestrito a dados sensíveis.

  ## Solucao
  Substituir todas as policies {public} por policies restritas a {authenticated},
  mantendo o funcionamento correto do sistema para usuarios logados.

  ## Tabelas corrigidas nesta migracao
  agenda_events, automation_actions, automation_conditions, automation_logs,
  automation_rules, bank_accounts, company_document_config, company_goals,
  cost_centers, crm_message_templates, crm_opportunity_stage_history,
  employee_achievements, employee_commissions, employee_goals,
  finance_entries (leitura publica), finance_recurrence_history,
  financial_transactions (leitura publica), google_ads_sync_log,
  purchase_order_items, purchase_orders, purchase_schedules,
  ranking_history, rankings_config, rental_schedules, supplier_quotes
*/

-- =============================================
-- AGENDA_EVENTS
-- =============================================
DROP POLICY IF EXISTS "Allow public delete from agenda_events" ON agenda_events;
DROP POLICY IF EXISTS "Allow public insert to agenda_events" ON agenda_events;
DROP POLICY IF EXISTS "Allow public read access to agenda_events" ON agenda_events;
DROP POLICY IF EXISTS "Allow public update to agenda_events" ON agenda_events;

CREATE POLICY "agenda_events_select" ON agenda_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "agenda_events_insert" ON agenda_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "agenda_events_update" ON agenda_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agenda_events_delete" ON agenda_events FOR DELETE TO authenticated USING (true);

-- =============================================
-- AUTOMATION_ACTIONS, CONDITIONS, LOGS, RULES
-- =============================================
DROP POLICY IF EXISTS "Allow all automation_actions" ON automation_actions;
CREATE POLICY "automation_actions_authenticated" ON automation_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all automation_conditions" ON automation_conditions;
CREATE POLICY "automation_conditions_authenticated" ON automation_conditions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all automation_logs" ON automation_logs;
CREATE POLICY "automation_logs_authenticated" ON automation_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all automation_rules" ON automation_rules;
CREATE POLICY "automation_rules_authenticated" ON automation_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- BANK_ACCOUNTS (remover leitura publica)
-- =============================================
DROP POLICY IF EXISTS "bank_accounts_read" ON bank_accounts;
-- A policy "Allow all bank_accounts" para authenticated ja existe

-- =============================================
-- COMPANY_DOCUMENT_CONFIG
-- =============================================
DROP POLICY IF EXISTS "Allow full access to company_document_config" ON company_document_config;
CREATE POLICY "company_document_config_authenticated" ON company_document_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- COMPANY_GOALS
-- =============================================
DROP POLICY IF EXISTS "Anon pode gerenciar metas empresa" ON company_goals;
DROP POLICY IF EXISTS "Todos podem visualizar metas da empresa" ON company_goals;

CREATE POLICY "company_goals_select" ON company_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "company_goals_insert" ON company_goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "company_goals_update" ON company_goals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "company_goals_delete" ON company_goals FOR DELETE TO authenticated USING (true);

-- =============================================
-- COST_CENTERS
-- =============================================
DROP POLICY IF EXISTS "Allow all insert cost_centers" ON cost_centers;
DROP POLICY IF EXISTS "Allow all read cost_centers" ON cost_centers;
DROP POLICY IF EXISTS "Allow all update cost_centers" ON cost_centers;

CREATE POLICY "cost_centers_select" ON cost_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "cost_centers_insert" ON cost_centers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cost_centers_update" ON cost_centers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cost_centers_delete" ON cost_centers FOR DELETE TO authenticated USING (true);

-- =============================================
-- CRM_MESSAGE_TEMPLATES
-- =============================================
DROP POLICY IF EXISTS "Permitir leitura para todos" ON crm_message_templates;
CREATE POLICY "crm_message_templates_select" ON crm_message_templates FOR SELECT TO authenticated USING (true);

-- =============================================
-- CRM_OPPORTUNITY_STAGE_HISTORY
-- =============================================
DROP POLICY IF EXISTS "Permitir inserção histórico movimentação" ON crm_opportunity_stage_history;
DROP POLICY IF EXISTS "Permitir leitura histórico movimentação" ON crm_opportunity_stage_history;

CREATE POLICY "crm_opp_stage_history_select" ON crm_opportunity_stage_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_opp_stage_history_insert" ON crm_opportunity_stage_history FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- EMPLOYEE_ACHIEVEMENTS
-- =============================================
DROP POLICY IF EXISTS "Anon pode gerenciar conquistas" ON employee_achievements;
DROP POLICY IF EXISTS "Todos podem visualizar conquistas" ON employee_achievements;

CREATE POLICY "employee_achievements_select" ON employee_achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "employee_achievements_insert" ON employee_achievements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employee_achievements_update" ON employee_achievements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employee_achievements_delete" ON employee_achievements FOR DELETE TO authenticated USING (true);

-- =============================================
-- EMPLOYEE_COMMISSIONS
-- =============================================
DROP POLICY IF EXISTS "Acesso público escrita employee_commissions" ON employee_commissions;
DROP POLICY IF EXISTS "Acesso público leitura employee_commissions" ON employee_commissions;

CREATE POLICY "employee_commissions_select" ON employee_commissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "employee_commissions_insert" ON employee_commissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employee_commissions_update" ON employee_commissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employee_commissions_delete" ON employee_commissions FOR DELETE TO authenticated USING (true);

-- =============================================
-- EMPLOYEE_GOALS
-- =============================================
DROP POLICY IF EXISTS "Anon pode gerenciar metas individuais" ON employee_goals;
DROP POLICY IF EXISTS "Todos podem visualizar metas individuais" ON employee_goals;

CREATE POLICY "employee_goals_select" ON employee_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "employee_goals_insert" ON employee_goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employee_goals_update" ON employee_goals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employee_goals_delete" ON employee_goals FOR DELETE TO authenticated USING (true);

-- =============================================
-- FINANCE_ENTRIES (remover leitura publica)
-- =============================================
DROP POLICY IF EXISTS "finance_read_all" ON finance_entries;
-- Policies authenticated ja existem

-- =============================================
-- FINANCE_RECURRENCE_HISTORY
-- =============================================
DROP POLICY IF EXISTS "Acesso público finance_recurrence_history" ON finance_recurrence_history;
CREATE POLICY "finance_recurrence_history_authenticated" ON finance_recurrence_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- FINANCIAL_TRANSACTIONS (remover leitura publica)
-- =============================================
DROP POLICY IF EXISTS "thomaz_read_financial" ON financial_transactions;

-- =============================================
-- GOOGLE_ADS_SYNC_LOG
-- =============================================
DROP POLICY IF EXISTS "Allow all on google_ads_sync_log" ON google_ads_sync_log;
CREATE POLICY "google_ads_sync_log_authenticated" ON google_ads_sync_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- PURCHASE_ORDER_ITEMS, PURCHASE_ORDERS, PURCHASE_SCHEDULES
-- =============================================
DROP POLICY IF EXISTS "Allow all operations on purchase_order_items" ON purchase_order_items;
CREATE POLICY "purchase_order_items_authenticated" ON purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on purchase_orders" ON purchase_orders;
CREATE POLICY "purchase_orders_authenticated" ON purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on purchase_schedules" ON purchase_schedules;
CREATE POLICY "purchase_schedules_authenticated" ON purchase_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- RANKING_HISTORY, RANKINGS_CONFIG
-- =============================================
DROP POLICY IF EXISTS "Anon pode gerenciar histórico" ON ranking_history;
DROP POLICY IF EXISTS "Todos podem visualizar histórico" ON ranking_history;

CREATE POLICY "ranking_history_select" ON ranking_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "ranking_history_insert" ON ranking_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ranking_history_update" ON ranking_history FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ranking_history_delete" ON ranking_history FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Anon pode gerenciar rankings" ON rankings_config;
DROP POLICY IF EXISTS "Todos podem visualizar rankings" ON rankings_config;

CREATE POLICY "rankings_config_select" ON rankings_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "rankings_config_insert" ON rankings_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "rankings_config_update" ON rankings_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rankings_config_delete" ON rankings_config FOR DELETE TO authenticated USING (true);

-- =============================================
-- RENTAL_SCHEDULES
-- =============================================
DROP POLICY IF EXISTS "Allow all operations on rental_schedules" ON rental_schedules;
CREATE POLICY "rental_schedules_authenticated" ON rental_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- SUPPLIER_QUOTES
-- =============================================
DROP POLICY IF EXISTS "Allow all operations on supplier_quotes" ON supplier_quotes;
CREATE POLICY "supplier_quotes_authenticated" ON supplier_quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

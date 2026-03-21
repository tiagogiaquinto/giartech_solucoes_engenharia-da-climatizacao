/*
  # Correcao de Seguranca - Parte 9: Usuario, notificacoes e settings

  ## Tabelas corrigidas
  notifications, user_menu_order, user_settings
*/

-- =============================================
-- NOTIFICATIONS (acesso publico total)
-- =============================================
DROP POLICY IF EXISTS "Public access to notifications" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated USING (true);

-- =============================================
-- USER_MENU_ORDER
-- =============================================
DROP POLICY IF EXISTS "Users can insert own menu order" ON user_menu_order;
DROP POLICY IF EXISTS "Users can select own menu order" ON user_menu_order;
DROP POLICY IF EXISTS "Users can update own menu order" ON user_menu_order;

CREATE POLICY "user_menu_order_select" ON user_menu_order FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_menu_order_insert" ON user_menu_order FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_menu_order_update" ON user_menu_order FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- USER_SETTINGS
-- =============================================
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "user_settings_select" ON user_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_settings_insert" ON user_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_settings_update" ON user_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

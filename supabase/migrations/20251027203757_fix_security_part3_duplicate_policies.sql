/*
  # Correção de Segurança Parte 3 - Remoção de Políticas Duplicadas

  1. **Problema**: Múltiplas políticas permissivas conflitantes
  2. **Solução**: Manter apenas a política mais permissiva
  3. **Impacto**: Elimina conflitos e melhora clareza do código
*/

-- contract_templates - remover política duplicada
DROP POLICY IF EXISTS "allow_authenticated_read_contract_templates" ON contract_templates;

-- giartech_conversations - manter apenas a mais permissiva
DROP POLICY IF EXISTS "Allow all access to giartech_conversations" ON giartech_conversations;

-- service_order_checklist_items
DROP POLICY IF EXISTS "Anyone can view checklist items - anon" ON service_order_checklist_items;

-- service_order_checklists
DROP POLICY IF EXISTS "Anyone can view checklists - anon" ON service_order_checklists;

-- service_order_validation_alerts
DROP POLICY IF EXISTS "Anyone can view alerts - anon" ON service_order_validation_alerts;

-- thomaz_personality_config
DROP POLICY IF EXISTS "Anyone can view personality config - anon" ON thomaz_personality_config;

-- user_menu_order
DROP POLICY IF EXISTS "anon_select_user_menu_order" ON user_menu_order;
DROP POLICY IF EXISTS "anon_insert_user_menu_order" ON user_menu_order;
DROP POLICY IF EXISTS "anon_update_user_menu_order" ON user_menu_order;

-- validation_rules
DROP POLICY IF EXISTS "Anyone can view rules - anon" ON validation_rules;

-- whatsapp_message_templates
DROP POLICY IF EXISTS "Anyone can view templates - anon" ON whatsapp_message_templates;
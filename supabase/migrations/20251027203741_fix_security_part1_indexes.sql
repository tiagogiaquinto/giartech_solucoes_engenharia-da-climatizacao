/*
  # Correção de Segurança Parte 1 - Índices em Foreign Keys

  1. **Problema**: 12 foreign keys sem índices
  2. **Solução**: Adicionar índices para melhorar performance de JOINs
  3. **Impacto**: Melhoria significativa em queries com relacionamentos
*/

-- Índices faltantes em foreign keys
CREATE INDEX IF NOT EXISTS idx_ai_learning_feedback_message_id 
  ON ai_learning_feedback(message_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_search_history_article_clicked 
  ON knowledge_search_history(article_clicked);

CREATE INDEX IF NOT EXISTS idx_service_order_attachments_uploaded_by 
  ON service_order_attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_service_order_checklist_items_completed_by 
  ON service_order_checklist_items(completed_by);

CREATE INDEX IF NOT EXISTS idx_service_order_status_history_changed_by 
  ON service_order_status_history(changed_by);

CREATE INDEX IF NOT EXISTS idx_service_order_templates_created_by 
  ON service_order_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_service_order_validation_alerts_resolved_by 
  ON service_order_validation_alerts(resolved_by);

CREATE INDEX IF NOT EXISTS idx_service_order_versions_created_by 
  ON service_order_versions(created_by);

CREATE INDEX IF NOT EXISTS idx_thomaz_learning_queue_verified_by 
  ON thomaz_learning_queue(verified_by);

CREATE INDEX IF NOT EXISTS idx_thomaz_web_knowledge_source_id 
  ON thomaz_web_knowledge(source_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_template_id 
  ON whatsapp_message_log(template_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_replied_to_id 
  ON whatsapp_messages(replied_to_id);
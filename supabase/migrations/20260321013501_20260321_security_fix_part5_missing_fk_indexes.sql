/*
  # Correcao de Seguranca - Parte 5: Indexes para Foreign Keys

  ## Problema
  93 colunas de foreign key sem index causam:
  - Performance degradada em JOINs e queries relacionais
  - Full table scans ao deletar registros pai (cascades lentos)
  - Risco de timeout em operacoes de escrita com volume alto de dados

  ## Solucao
  Criar um index B-tree para cada foreign key sem cobertura.
  Todos os indexes usam IF NOT EXISTS para seguranca na re-execucao.

  ## Tabelas contempladas
  automation_rules, captured_leads, corp_chat_messages, cost_centers,
  crm_activities, crm_automation_log, crm_automation_logs, crm_documents,
  crm_email_tracking, crm_interactions, crm_lead_score_history, crm_notes,
  crm_opportunities, crm_opportunity_stage_history, crm_sequence_enrollments,
  crm_sequence_steps, crm_stage_history, crm_stages, customer_credit_transactions,
  customer_credits, customer_points_history, customer_referrals, document_comments,
  document_template_versions, employee_commissions, employee_goals,
  finance_recurrence_history, financial_transactions, invoice_items,
  invoice_payments, invoices, lead_capture_campaigns, margin_alerts,
  margin_override_log, os_checklist_items, os_stock_requisitions,
  partner_commission_rules, portal_service_requests, price_update_proposals,
  purchase_order_items, purchase_requests, salary_advance_payments,
  service_order_assignments, service_order_checklist, service_order_costs,
  service_order_photos, service_order_time_tracking, service_order_validation,
  service_orders, system_departments, template_blocks, template_version_comparisons,
  thomaz_decisions, thomaz_financial_alerts, thomaz_financial_analysis,
  thomaz_financial_decisions, thomaz_logs, thomaz_simulations, user_module_permissions
*/

-- automation_rules
CREATE INDEX IF NOT EXISTS idx_automation_rules_created_by ON automation_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_automation_rules_template_id ON automation_rules(template_id);

-- captured_leads
CREATE INDEX IF NOT EXISTS idx_captured_leads_converted_to_customer_id ON captured_leads(converted_to_customer_id);

-- corp_chat_messages
CREATE INDEX IF NOT EXISTS idx_corp_chat_messages_reply_to_id ON corp_chat_messages(reply_to_id);

-- cost_centers
CREATE INDEX IF NOT EXISTS idx_cost_centers_manager_id ON cost_centers(manager_id);

-- crm_activities
CREATE INDEX IF NOT EXISTS idx_crm_activities_criado_por_id ON crm_activities(criado_por_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_customer_id ON crm_activities(customer_id);

-- crm_automation_log
CREATE INDEX IF NOT EXISTS idx_crm_automation_log_automation_rule_id ON crm_automation_log(automation_rule_id);
CREATE INDEX IF NOT EXISTS idx_crm_automation_log_opportunity_id ON crm_automation_log(opportunity_id);

-- crm_automation_logs
CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_rule_id ON crm_automation_logs(rule_id);

-- crm_documents
CREATE INDEX IF NOT EXISTS idx_crm_documents_customer_id ON crm_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_documents_opportunity_id ON crm_documents(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_documents_usuario_id ON crm_documents(usuario_id);

-- crm_email_tracking
CREATE INDEX IF NOT EXISTS idx_crm_email_tracking_activity_id ON crm_email_tracking(activity_id);

-- crm_interactions
CREATE INDEX IF NOT EXISTS idx_crm_interactions_usuario_id ON crm_interactions(usuario_id);

-- crm_lead_score_history
CREATE INDEX IF NOT EXISTS idx_crm_lead_score_history_opportunity_id ON crm_lead_score_history(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_score_history_regra_id ON crm_lead_score_history(regra_id);

-- crm_notes
CREATE INDEX IF NOT EXISTS idx_crm_notes_customer_id ON crm_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_opportunity_id ON crm_notes(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_usuario_id ON crm_notes(usuario_id);

-- crm_opportunities
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_proximo_contato_agendado_por ON crm_opportunities(proximo_contato_agendado_por);

-- crm_opportunity_stage_history
CREATE INDEX IF NOT EXISTS idx_crm_opp_stage_hist_from_stage ON crm_opportunity_stage_history(from_stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_opp_stage_hist_moved_by ON crm_opportunity_stage_history(moved_by);
CREATE INDEX IF NOT EXISTS idx_crm_opp_stage_hist_to_stage ON crm_opportunity_stage_history(to_stage_id);

-- crm_sequence_enrollments
CREATE INDEX IF NOT EXISTS idx_crm_seq_enrollments_opportunity_id ON crm_sequence_enrollments(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_seq_enrollments_sequence_id ON crm_sequence_enrollments(sequence_id);

-- crm_sequence_steps
CREATE INDEX IF NOT EXISTS idx_crm_sequence_steps_sequence_id ON crm_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_crm_sequence_steps_template_id ON crm_sequence_steps(template_id);

-- crm_stage_history
CREATE INDEX IF NOT EXISTS idx_crm_stage_history_opportunity_id ON crm_stage_history(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_stage_history_stage_anterior_id ON crm_stage_history(stage_anterior_id);
CREATE INDEX IF NOT EXISTS idx_crm_stage_history_stage_novo_id ON crm_stage_history(stage_novo_id);
CREATE INDEX IF NOT EXISTS idx_crm_stage_history_usuario_id ON crm_stage_history(usuario_id);

-- crm_stages
CREATE INDEX IF NOT EXISTS idx_crm_stages_pipeline_id ON crm_stages(pipeline_id);

-- customer_credit_transactions
CREATE INDEX IF NOT EXISTS idx_customer_credit_txn_service_order_id ON customer_credit_transactions(service_order_id);

-- customer_credits
CREATE INDEX IF NOT EXISTS idx_customer_credits_referral_id ON customer_credits(referral_id);

-- customer_points_history
CREATE INDEX IF NOT EXISTS idx_customer_points_hist_referral_id ON customer_points_history(referral_id);
CREATE INDEX IF NOT EXISTS idx_customer_points_hist_service_order_id ON customer_points_history(service_order_id);

-- customer_referrals
CREATE INDEX IF NOT EXISTS idx_customer_referrals_service_order_id ON customer_referrals(service_order_id);

-- document_comments
CREATE INDEX IF NOT EXISTS idx_document_comments_parent_id ON document_comments(parent_id);

-- document_template_versions
CREATE INDEX IF NOT EXISTS idx_doc_template_versions_approved_by ON document_template_versions(approved_by);
CREATE INDEX IF NOT EXISTS idx_doc_template_versions_created_by ON document_template_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_doc_template_versions_published_by ON document_template_versions(published_by);

-- employee_commissions
CREATE INDEX IF NOT EXISTS idx_employee_commissions_approved_by ON employee_commissions(approved_by);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_paid_by ON employee_commissions(paid_by);

-- employee_goals
CREATE INDEX IF NOT EXISTS idx_employee_goals_company_goal_id ON employee_goals(company_goal_id);

-- finance_recurrence_history
CREATE INDEX IF NOT EXISTS idx_finance_recurrence_history_created_by ON finance_recurrence_history(created_by);

-- financial_transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_customer_id ON financial_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_service_order_id ON financial_transactions(service_order_id);

-- invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_material_id ON invoice_items(material_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_service_id ON invoice_items(service_id);

-- invoice_payments
CREATE INDEX IF NOT EXISTS idx_invoice_payments_bank_account_id ON invoice_payments(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_finance_entry_id ON invoice_payments(finance_entry_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_recorded_by ON invoice_payments(recorded_by);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_bank_account_id ON invoices(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cancelled_by ON invoices(cancelled_by);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);

-- lead_capture_campaigns
CREATE INDEX IF NOT EXISTS idx_lead_capture_campaigns_created_by ON lead_capture_campaigns(created_by);

-- margin_alerts
CREATE INDEX IF NOT EXISTS idx_margin_alerts_material_id ON margin_alerts(material_id);
CREATE INDEX IF NOT EXISTS idx_margin_alerts_price_update_proposal_id ON margin_alerts(price_update_proposal_id);

-- margin_override_log
CREATE INDEX IF NOT EXISTS idx_margin_override_log_service_order_id ON margin_override_log(service_order_id);

-- os_checklist_items
CREATE INDEX IF NOT EXISTS idx_os_checklist_items_equipment_id ON os_checklist_items(equipment_id);

-- os_stock_requisitions
CREATE INDEX IF NOT EXISTS idx_os_stock_requisitions_material_id ON os_stock_requisitions(material_id);

-- partner_commission_rules
CREATE INDEX IF NOT EXISTS idx_partner_commission_rules_partner_account_id ON partner_commission_rules(partner_account_id);

-- portal_service_requests
CREATE INDEX IF NOT EXISTS idx_portal_service_requests_customer_id ON portal_service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_portal_service_requests_generated_os_id ON portal_service_requests(generated_os_id);

-- price_update_proposals
CREATE INDEX IF NOT EXISTS idx_price_update_proposals_extracted_item_id ON price_update_proposals(extracted_item_id);
CREATE INDEX IF NOT EXISTS idx_price_update_proposals_inventory_item_id ON price_update_proposals(inventory_item_id);

-- purchase_order_items
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_inventory_item_id ON purchase_order_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_service_order_id ON purchase_order_items(service_order_id);

-- purchase_requests
CREATE INDEX IF NOT EXISTS idx_purchase_requests_purchase_order_id ON purchase_requests(purchase_order_id);

-- salary_advance_payments
CREATE INDEX IF NOT EXISTS idx_salary_advance_payments_finance_entry_id ON salary_advance_payments(finance_entry_id);

-- service_order_assignments
CREATE INDEX IF NOT EXISTS idx_service_order_assignments_assigned_by ON service_order_assignments(assigned_by);

-- service_order_checklist
CREATE INDEX IF NOT EXISTS idx_service_order_checklist_completed_by ON service_order_checklist(completed_by);
CREATE INDEX IF NOT EXISTS idx_service_order_checklist_service_order_id ON service_order_checklist(service_order_id);

-- service_order_costs
CREATE INDEX IF NOT EXISTS idx_service_order_costs_cost_center_id ON service_order_costs(cost_center_id);

-- service_order_photos
CREATE INDEX IF NOT EXISTS idx_service_order_photos_uploaded_by ON service_order_photos(uploaded_by);

-- service_order_time_tracking
CREATE INDEX IF NOT EXISTS idx_service_order_time_tracking_employee_id ON service_order_time_tracking(employee_id);

-- service_order_validation
CREATE INDEX IF NOT EXISTS idx_service_order_validation_validated_by ON service_order_validation(validated_by);

-- service_orders
CREATE INDEX IF NOT EXISTS idx_service_orders_asset_id ON service_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_cost_center_id ON service_orders(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_by_employee_id ON service_orders(created_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_salesperson_id ON service_orders(salesperson_id);

-- system_departments
CREATE INDEX IF NOT EXISTS idx_system_departments_manager_id ON system_departments(manager_id);

-- template_blocks
CREATE INDEX IF NOT EXISTS idx_template_blocks_created_by ON template_blocks(created_by);

-- template_version_comparisons
CREATE INDEX IF NOT EXISTS idx_template_version_comparisons_compared_by ON template_version_comparisons(compared_by);

-- thomaz_decisions
CREATE INDEX IF NOT EXISTS idx_thomaz_decisions_user_id ON thomaz_decisions(user_id);

-- thomaz_financial_alerts
CREATE INDEX IF NOT EXISTS idx_thomaz_financial_alerts_analysis_id ON thomaz_financial_alerts(analysis_id);

-- thomaz_financial_analysis
CREATE INDEX IF NOT EXISTS idx_thomaz_financial_analysis_tenant_id ON thomaz_financial_analysis(tenant_id);

-- thomaz_financial_decisions
CREATE INDEX IF NOT EXISTS idx_thomaz_financial_decisions_analysis_id ON thomaz_financial_decisions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_thomaz_financial_decisions_decided_by ON thomaz_financial_decisions(decided_by);

-- thomaz_logs
CREATE INDEX IF NOT EXISTS idx_thomaz_logs_user_id ON thomaz_logs(user_id);

-- thomaz_simulations
CREATE INDEX IF NOT EXISTS idx_thomaz_simulations_user_id ON thomaz_simulations(user_id);

-- user_module_permissions
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_granted_by ON user_module_permissions(granted_by);

-- ================================================================
-- GIARTECH SOLUÇÕES — CORREÇÃO COMPLETA DO BANCO DE DADOS
-- ================================================================

BEGIN;

-- ================================================================
-- BLOCO 1: SINCRONIZAR user_profiles COM auth.users
-- ================================================================

ALTER TABLE budgets                       DROP CONSTRAINT IF EXISTS budgets_created_by_fkey;
ALTER TABLE crm_activities                DROP CONSTRAINT IF EXISTS crm_activities_criado_por_id_fkey;
ALTER TABLE crm_activities                DROP CONSTRAINT IF EXISTS crm_activities_responsavel_id_fkey;
ALTER TABLE crm_documents                 DROP CONSTRAINT IF EXISTS crm_documents_usuario_id_fkey;
ALTER TABLE crm_forecast                  DROP CONSTRAINT IF EXISTS crm_forecast_usuario_id_fkey;
ALTER TABLE crm_interactions              DROP CONSTRAINT IF EXISTS crm_interactions_usuario_id_fkey;
ALTER TABLE crm_notes                     DROP CONSTRAINT IF EXISTS crm_notes_usuario_id_fkey;
ALTER TABLE crm_stage_history             DROP CONSTRAINT IF EXISTS crm_stage_history_usuario_id_fkey;
ALTER TABLE document_template_versions    DROP CONSTRAINT IF EXISTS document_template_versions_created_by_fkey;
ALTER TABLE document_template_versions    DROP CONSTRAINT IF EXISTS document_template_versions_approved_by_fkey;
ALTER TABLE document_template_versions    DROP CONSTRAINT IF EXISTS document_template_versions_published_by_fkey;
ALTER TABLE lead_capture_campaigns        DROP CONSTRAINT IF EXISTS lead_capture_campaigns_created_by_fkey;
ALTER TABLE service_order_attachments     DROP CONSTRAINT IF EXISTS service_order_attachments_uploaded_by_fkey;
ALTER TABLE service_order_audit_log       DROP CONSTRAINT IF EXISTS service_order_audit_log_user_id_fkey;
ALTER TABLE service_order_checklist_items DROP CONSTRAINT IF EXISTS service_order_checklist_items_completed_by_fkey;
ALTER TABLE service_order_drafts          DROP CONSTRAINT IF EXISTS service_order_drafts_user_id_fkey;
ALTER TABLE service_order_status_history  DROP CONSTRAINT IF EXISTS service_order_status_history_changed_by_fkey;
ALTER TABLE service_order_templates       DROP CONSTRAINT IF EXISTS service_order_templates_created_by_fkey;
ALTER TABLE service_order_validation_alerts DROP CONSTRAINT IF EXISTS service_order_validation_alerts_resolved_by_fkey;
ALTER TABLE service_order_versions        DROP CONSTRAINT IF EXISTS service_order_versions_created_by_fkey;
ALTER TABLE template_blocks               DROP CONSTRAINT IF EXISTS template_blocks_created_by_fkey;
ALTER TABLE template_version_comparisons  DROP CONSTRAINT IF EXISTS template_version_comparisons_compared_by_fkey;
ALTER TABLE thomaz_conversation_context   DROP CONSTRAINT IF EXISTS thomaz_conversation_context_user_id_fkey;
ALTER TABLE thomaz_conversation_summary   DROP CONSTRAINT IF EXISTS thomaz_conversation_summary_user_id_fkey;
ALTER TABLE thomaz_learning_queue         DROP CONSTRAINT IF EXISTS thomaz_learning_queue_verified_by_fkey;
ALTER TABLE thomaz_user_preferences       DROP CONSTRAINT IF EXISTS thomaz_user_preferences_user_id_fkey;
ALTER TABLE user_profiles                 DROP CONSTRAINT IF EXISTS user_profiles_user_id_unique;

-- 1b. Atualizar o ID dos perfis para coincidir com auth.users.id
UPDATE public.user_profiles up
SET id = au.id
FROM auth.users au
WHERE up.user_id = au.id
  AND up.id != au.id;

-- 1c. Criar perfil para diretor@giartechsolucoes.com.br que não tinha
INSERT INTO public.user_profiles (id, user_id, email, full_name, role, user_type, created_at, updated_at)
SELECT 
  au.id,
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Diretor Giartech'),
  'admin',
  'tecnico',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'diretor@giartechsolucoes.com.br'
  AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = au.id)
ON CONFLICT (id) DO NOTHING;

-- 1d. Preencher emails nulos nos perfis
UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.user_id = au.id
  AND up.email IS NULL;

-- 1e. Garantir que user_id = id em todos os perfis
UPDATE public.user_profiles
SET user_id = id
WHERE user_id != id OR user_id IS NULL;

-- ================================================================
-- BLOCO 2: RECRIAR TODAS AS FKs CORRETAMENTE
-- ================================================================

ALTER TABLE budgets 
  ADD CONSTRAINT budgets_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE crm_activities 
  ADD CONSTRAINT crm_activities_criado_por_id_fkey 
  FOREIGN KEY (criado_por_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE crm_activities 
  ADD CONSTRAINT crm_activities_responsavel_id_fkey 
  FOREIGN KEY (responsavel_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE crm_documents 
  ADD CONSTRAINT crm_documents_usuario_id_fkey 
  FOREIGN KEY (usuario_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE crm_forecast 
  ADD CONSTRAINT crm_forecast_usuario_id_fkey 
  FOREIGN KEY (usuario_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE crm_interactions 
  ADD CONSTRAINT crm_interactions_usuario_id_fkey 
  FOREIGN KEY (usuario_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE crm_notes 
  ADD CONSTRAINT crm_notes_usuario_id_fkey 
  FOREIGN KEY (usuario_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE crm_stage_history 
  ADD CONSTRAINT crm_stage_history_usuario_id_fkey 
  FOREIGN KEY (usuario_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE document_template_versions 
  ADD CONSTRAINT document_template_versions_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE document_template_versions 
  ADD CONSTRAINT document_template_versions_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE document_template_versions 
  ADD CONSTRAINT document_template_versions_published_by_fkey 
  FOREIGN KEY (published_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE lead_capture_campaigns 
  ADD CONSTRAINT lead_capture_campaigns_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE service_order_attachments 
  ADD CONSTRAINT service_order_attachments_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE service_order_audit_log 
  ADD CONSTRAINT service_order_audit_log_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE service_order_checklist_items 
  ADD CONSTRAINT service_order_checklist_items_completed_by_fkey 
  FOREIGN KEY (completed_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE service_order_drafts 
  ADD CONSTRAINT service_order_drafts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE service_order_status_history 
  ADD CONSTRAINT service_order_status_history_changed_by_fkey 
  FOREIGN KEY (changed_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE service_order_templates 
  ADD CONSTRAINT service_order_templates_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE service_order_validation_alerts 
  ADD CONSTRAINT service_order_validation_alerts_resolved_by_fkey 
  FOREIGN KEY (resolved_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE service_order_versions 
  ADD CONSTRAINT service_order_versions_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE template_blocks 
  ADD CONSTRAINT template_blocks_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE template_version_comparisons 
  ADD CONSTRAINT template_version_comparisons_compared_by_fkey 
  FOREIGN KEY (compared_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE thomaz_conversation_context 
  ADD CONSTRAINT thomaz_conversation_context_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE thomaz_conversation_summary 
  ADD CONSTRAINT thomaz_conversation_summary_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE thomaz_learning_queue 
  ADD CONSTRAINT thomaz_learning_queue_verified_by_fkey 
  FOREIGN KEY (verified_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE thomaz_user_preferences 
  ADD CONSTRAINT thomaz_user_preferences_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- ================================================================
-- BLOCO 3: CORRIGIR OS RASCUNHOS SEM USER_ID
-- ================================================================

UPDATE public.service_order_drafts
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'diretor.giartechsolucoes@gmail.com' 
  LIMIT 1
)
WHERE user_id IS NULL;

-- ================================================================
-- BLOCO 4: CRIAR FUNÇÃO ALIAS increment_template_usage
-- ================================================================

CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.increment_document_template_usage(template_id);
END;
$$;

-- ================================================================
-- BLOCO 5: CRIAR VIEW service_order_documents
-- ================================================================

CREATE OR REPLACE VIEW public.service_order_documents AS
SELECT * FROM public.service_order_attachments;

-- ================================================================
-- BLOCO 6: CORRIGIR handle_new_auth_user
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  IF NEW.email IN (
    'diretor.giartechsolucoes@gmail.com',
    'diretor@giartechsolucoes.com.br',
    'adm.giartechsolucoes@gmail.com'
  ) THEN
    v_role := 'admin';
  ELSIF NEW.email = 'gerente.giartechsolucoes@gmail.com' THEN
    v_role := 'manager';
  ELSE
    v_role := 'user';
  END IF;

  INSERT INTO public.auth_accounts (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE WHEN v_role = 'admin' THEN 'super_admin' ELSE 'viewer' END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  INSERT INTO public.user_profiles (
    id, user_id, email, full_name, role, user_type, created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    'tecnico',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ================================================================
-- BLOCO 7: CORRIGIR mark_notification_as_read
-- ================================================================

CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET 
    read_at  = NOW(),
    is_read  = true
  WHERE id = p_notification_id;
END;
$$;

-- ================================================================
-- BLOCO 8: CORRIGIR checklist duplicado
-- Remove checklists duplicados por OS (mantém o mais antigo por created_at/id textual)
-- ================================================================

DELETE FROM public.service_order_checklist_items
WHERE checklist_id IN (
  SELECT id FROM public.service_order_checklists
  WHERE id NOT IN (
    SELECT DISTINCT ON (service_order_id) id
    FROM public.service_order_checklists
    ORDER BY service_order_id, created_at ASC
  )
);

DELETE FROM public.service_order_checklists
WHERE id NOT IN (
  SELECT DISTINCT ON (service_order_id) id
  FROM public.service_order_checklists
  ORDER BY service_order_id, created_at ASC
);

-- ================================================================
-- BLOCO 9: CORRIGIR requires_photo nos itens de foto
-- ================================================================

UPDATE public.service_order_checklist_items
SET requires_photo = true
WHERE title ILIKE '%foto%';

-- ================================================================
-- BLOCO 10: CORRIGIR propagação de progresso do checklist para OS
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_checklist_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total       INTEGER;
  v_completed   INTEGER;
  v_percentage  DECIMAL(5,2);
  v_checklist_id UUID;
  v_os_id       UUID;
BEGIN
  v_checklist_id := COALESCE(NEW.checklist_id, OLD.checklist_id);

  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed = true)
  INTO v_total, v_completed
  FROM service_order_checklist_items
  WHERE checklist_id = v_checklist_id;

  v_percentage := CASE 
    WHEN v_total > 0 THEN (v_completed::DECIMAL / v_total::DECIMAL) * 100 
    ELSE 0 
  END;

  UPDATE service_order_checklists
  SET 
    total_items         = v_total,
    completed_items     = v_completed,
    progress_percentage = v_percentage,
    completed_at        = CASE WHEN v_completed = v_total AND v_total > 0 THEN NOW() ELSE NULL END,
    updated_at          = NOW()
  WHERE id = v_checklist_id
  RETURNING service_order_id INTO v_os_id;

  IF v_os_id IS NOT NULL THEN
    UPDATE service_orders
    SET 
      progress_percent = v_percentage,
      updated_at       = NOW()
    WHERE id = v_os_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMIT;
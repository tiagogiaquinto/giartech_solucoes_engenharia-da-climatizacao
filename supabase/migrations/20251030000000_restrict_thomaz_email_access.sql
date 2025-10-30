/*
  # Restringir Acesso do Thomaz a Emails

  1. Objetivo
    - Remover acesso do Thomaz AI às tabelas de email
    - Proteger conversas privadas por email
    - Manter segurança e privacidade

  2. Tabelas Afetadas
    - email_accounts (senhas SMTP/IMAP)
    - email_messages (conteúdo de emails)
    - email_templates (templates OK)
    - email_attachments (anexos de emails)

  3. Implementação
    - Revogar SELECT nas tabelas sensíveis
    - Manter acesso apenas a email_templates (públicos)
    - Criar view pública com dados não sensíveis
*/

-- ============================================================================
-- 1. REVOGAR ACESSO DIRETO ÀS TABELAS DE EMAIL
-- ============================================================================

-- Revogar acesso à tabela de contas (contém senhas)
REVOKE ALL ON TABLE email_accounts FROM anon;
REVOKE ALL ON TABLE email_accounts FROM authenticated;

-- Revogar acesso às mensagens (conteúdo privado)
REVOKE ALL ON TABLE email_messages FROM anon;
REVOKE ALL ON TABLE email_messages FROM authenticated;

-- Revogar acesso aos anexos
REVOKE ALL ON TABLE email_attachments FROM anon;
REVOKE ALL ON TABLE email_attachments FROM authenticated;

-- ============================================================================
-- 2. REMOVER POLICIES PERMISSIVAS
-- ============================================================================

-- Remover policies da tabela email_accounts
DROP POLICY IF EXISTS "anon_select_email_accounts" ON email_accounts;
DROP POLICY IF EXISTS "anon_insert_email_accounts" ON email_accounts;
DROP POLICY IF EXISTS "anon_update_email_accounts" ON email_accounts;
DROP POLICY IF EXISTS "anon_delete_email_accounts" ON email_accounts;

-- Remover policies da tabela email_messages
DROP POLICY IF EXISTS "anon_select_email_messages" ON email_messages;
DROP POLICY IF EXISTS "anon_insert_email_messages" ON email_messages;
DROP POLICY IF EXISTS "anon_update_email_messages" ON email_messages;
DROP POLICY IF EXISTS "anon_delete_email_messages" ON email_messages;

-- Remover policies da tabela email_attachments
DROP POLICY IF EXISTS "anon_select_email_attachments" ON email_attachments;
DROP POLICY IF EXISTS "anon_insert_email_attachments" ON email_attachments;
DROP POLICY IF EXISTS "anon_update_email_attachments" ON email_attachments;
DROP POLICY IF EXISTS "anon_delete_email_attachments" ON email_attachments;

-- ============================================================================
-- 3. CRIAR POLICIES RESTRITIVAS (Somente Usuários Autenticados)
-- ============================================================================

-- Email Accounts: Somente authenticated users específicos
CREATE POLICY "authenticated_admin_email_accounts"
  ON email_accounts
  FOR ALL
  TO authenticated
  USING (
    -- Apenas usuários com role 'admin' ou 'manager'
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'manager')
    )
  );

-- Email Messages: Somente authenticated users autorizados
CREATE POLICY "authenticated_authorized_email_messages"
  ON email_messages
  FOR ALL
  TO authenticated
  USING (
    -- Apenas usuários com role 'admin', 'manager' ou 'staff'
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'manager', 'staff')
    )
  );

-- Email Attachments: Seguir mesmas regras das mensagens
CREATE POLICY "authenticated_authorized_email_attachments"
  ON email_attachments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_messages em
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE em.id = email_attachments.message_id
      AND up.role IN ('admin', 'manager', 'staff')
    )
  );

-- ============================================================================
-- 4. MANTER ACESSO A TEMPLATES (Dados Públicos)
-- ============================================================================

-- Email Templates continuam acessíveis (são públicos)
-- Não fazemos alterações nas policies de email_templates

-- ============================================================================
-- 5. CRIAR VIEW PÚBLICA COM ESTATÍSTICAS (Sem Conteúdo Sensível)
-- ============================================================================

CREATE OR REPLACE VIEW v_email_statistics AS
SELECT
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE direction = 'sent') as emails_sent,
  COUNT(*) FILTER (WHERE direction = 'received') as emails_received,
  COUNT(*) FILTER (WHERE status = 'pending') as emails_pending,
  COUNT(*) FILTER (WHERE is_read = false AND direction = 'received') as emails_unread,
  COUNT(DISTINCT customer_id) FILTER (WHERE customer_id IS NOT NULL) as customers_contacted,
  DATE_TRUNC('month', created_at)::DATE as month
FROM email_messages
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Permitir que todos vejam estatísticas (sem dados sensíveis)
GRANT SELECT ON v_email_statistics TO anon, authenticated;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON POLICY "authenticated_admin_email_accounts" ON email_accounts
  IS 'Somente admins e gerentes podem acessar contas de email (contém senhas)';

COMMENT ON POLICY "authenticated_authorized_email_messages" ON email_messages
  IS 'Somente usuários autorizados podem acessar mensagens de email';

COMMENT ON VIEW v_email_statistics
  IS 'Estatísticas públicas de email sem expor conteúdo sensível';

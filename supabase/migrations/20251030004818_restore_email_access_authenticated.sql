/*
  # Restaurar Acesso a Emails para Usuários Autenticados

  1. Problema
    - REVOKE ALL removeu até o acesso de usuários autenticados
    - Frontend não consegue carregar contas de email
    - Usuários legítimos não podem enviar emails

  2. Solução
    - Restaurar GRANTs nas tabelas
    - Manter policies restritivas baseadas em roles
    - Bloquear apenas anon (Thomaz sem autenticação)

  3. Segurança
    - Anon (Thomaz) não pode acessar
    - Authenticated com roles adequadas podem acessar
    - Dados sensíveis continuam protegidos
*/

-- ============================================================================
-- 1. RESTAURAR GRANTS PARA AUTHENTICATED
-- ============================================================================

-- Email Accounts: Restaurar acesso para authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE email_accounts TO authenticated;

-- Email Messages: Restaurar acesso para authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE email_messages TO authenticated;

-- Email Attachments: Restaurar acesso para authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE email_attachments TO authenticated;

-- Email Templates: Já tem acesso, mas garantir
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE email_templates TO authenticated;

-- ============================================================================
-- 2. MANTER BLOQUEIO PARA ANON (Thomaz)
-- ============================================================================

-- Garantir que anon NÃO tem acesso
REVOKE ALL ON TABLE email_accounts FROM anon;
REVOKE ALL ON TABLE email_messages FROM anon;
REVOKE ALL ON TABLE email_attachments FROM anon;

-- Templates podem continuar acessíveis para anon (são públicos)
GRANT SELECT ON TABLE email_templates TO anon;

-- ============================================================================
-- 3. POLICIES JÁ EXISTEM E SÃO RESTRITIVAS
-- ============================================================================

-- As policies criadas anteriormente já fazem a verificação de role:
-- - authenticated_admin_email_accounts (admin, manager)
-- - authenticated_authorized_email_messages (admin, manager, staff)
-- - authenticated_authorized_email_attachments (admin, manager, staff)

-- Essas policies já estão ativas e funcionam com os GRANTs acima

-- ============================================================================
-- 4. ADICIONAR POLICY MAIS PERMISSIVA PARA EMAIL_TEMPLATES
-- ============================================================================

-- Email Templates devem ser acessíveis por todos authenticated users
DROP POLICY IF EXISTS "authenticated_email_templates" ON email_templates;

CREATE POLICY "authenticated_email_templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon pode apenas ler templates
DROP POLICY IF EXISTS "anon_select_email_templates" ON email_templates;

CREATE POLICY "anon_select_email_templates"
  ON email_templates
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- RESUMO DA SEGURANÇA
-- ============================================================================

COMMENT ON TABLE email_accounts IS 'Acesso: Authenticated (admin, manager) | Bloqueado: anon';
COMMENT ON TABLE email_messages IS 'Acesso: Authenticated (admin, manager, staff) | Bloqueado: anon';
COMMENT ON TABLE email_attachments IS 'Acesso: Authenticated (via messages) | Bloqueado: anon';
COMMENT ON TABLE email_templates IS 'Acesso: Authenticated (todos) | anon (somente leitura)';

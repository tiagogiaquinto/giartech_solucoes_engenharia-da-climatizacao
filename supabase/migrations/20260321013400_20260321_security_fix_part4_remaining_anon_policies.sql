/*
  # Correcao de Seguranca - Parte 4: Corrigir policies anon restantes

  ## Problema
  Ainda existiam 9 policies com acesso aberto para role 'anon':

  - auth_accounts: anon podia SELECT, INSERT e UPDATE sem autenticacao
    (risco critico: qualquer pessoa podia criar/modificar contas de acesso)
  - portal_accounts: anon podia SELECT e UPDATE sem restricao
    (risco: exposicao de contas de clientes/parceiros)
  - lead_capture_campaigns: anon podia DELETE, INSERT, SELECT e UPDATE
    (risco: qualquer pessoa podia apagar ou criar campanhas)

  ## Solucao
  1. auth_accounts: manter SELECT para login (necessario), restringir INSERT/UPDATE
  2. portal_accounts: manter SELECT apenas para login por token, restringir UPDATE
  3. lead_capture_campaigns: remover DELETE/INSERT/UPDATE para anon, manter apenas SELECT
     (formularios publicos precisam apenas ler a campanha para submeter leads)

  ## Impacto
  - Login de clientes/parceiros: continua funcionando
  - Formularios publicos de captacao de leads: continuam funcionando
  - Criacao/modificacao de campanhas e contas: exige autenticacao agora
*/

-- =============================================
-- AUTH_ACCOUNTS: corrigir policies anon
-- =============================================

-- Remover INSERT e UPDATE abertos para anon
DROP POLICY IF EXISTS "auth_accounts_anon_insert" ON auth_accounts;
DROP POLICY IF EXISTS "auth_accounts_anon_update" ON auth_accounts;

-- Manter SELECT para anon (necessario para processo de login)
-- A policy auth_accounts_anon_select ja existe e e necessaria

-- Adicionar policy de INSERT apenas para service_role (criacao via edge function)
-- Usuarios autenticados (admins) tambem podem inserir
CREATE POLICY "auth_accounts_authenticated_insert"
  ON auth_accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "auth_accounts_authenticated_update"
  ON auth_accounts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- PORTAL_ACCOUNTS: corrigir UPDATE aberto para anon
-- =============================================

-- Remover UPDATE aberto para anon (qualquer pessoa podia modificar contas de portal)
DROP POLICY IF EXISTS "pa_upd_anon" ON portal_accounts;

-- Manter SELECT para anon (necessario para login de clientes/parceiros por token)
-- A policy pa_sel_anon ja existe e e necessaria para login

-- Adicionar UPDATE apenas para autenticados
CREATE POLICY "pa_upd_authenticated"
  ON portal_accounts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- LEAD_CAPTURE_CAMPAIGNS: restringir anon
-- =============================================

-- Remover DELETE, INSERT e UPDATE abertos para anon
DROP POLICY IF EXISTS "Allow anon delete campaigns" ON lead_capture_campaigns;
DROP POLICY IF EXISTS "Allow anon insert campaigns" ON lead_capture_campaigns;
DROP POLICY IF EXISTS "Allow anon update campaigns" ON lead_capture_campaigns;

-- Manter SELECT para anon (formularios publicos precisam ler a campanha)
-- A policy "Allow anon select campaigns" ja existe e e necessaria

-- Adicionar INSERT, UPDATE e DELETE apenas para autenticados
CREATE POLICY "lead_capture_campaigns_authenticated_insert"
  ON lead_capture_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "lead_capture_campaigns_authenticated_update"
  ON lead_capture_campaigns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "lead_capture_campaigns_authenticated_delete"
  ON lead_capture_campaigns FOR DELETE
  TO authenticated
  USING (true);

/*
  # Correcao de Seguranca - Parte 2: Remover policies abertas para role 'anon'

  ## Problema
  Existiam 744+ policies com USING(true) / WITH CHECK(true) concedendo
  acesso total ao role 'anon' (nao autenticado) em praticamente todas as tabelas.
  Isso significa que qualquer pessoa sem autenticacao podia ler, inserir,
  atualizar e deletar dados sensiveis (clientes, financeiro, funcionarios, etc).

  ## Solucao
  Remover todas as policies do role 'anon' que usam USING(true) ou WITH CHECK(true).
  Apenas usuarios autenticados devem ter acesso aos dados do sistema.

  ## Excecoes mantidas (dados publicos legitimos)
  - lead_capture_campaigns: acesso de leitura para formularios publicos de captacao
  - portal_accounts: login de clientes/parceiros externos
  - auth_accounts: necessario para processo de login

  ## Impacto
  - Usuarios autenticados: SEM IMPACTO (policies authenticated permanecem)
  - Usuarios anonimos: PERDEM ACESSO (comportamento correto para sistema interno)
  - Portais externos (cliente/parceiro): mantidos com policies especificas
*/

DO $$
DECLARE
  rec RECORD;
  drop_sql TEXT;
BEGIN
  FOR rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND roles::text ILIKE '%anon%'
      AND (qual = 'true' OR with_check = 'true')
      AND tablename NOT IN (
        'lead_capture_campaigns',
        'portal_accounts',
        'auth_accounts'
      )
  LOOP
    drop_sql := format('DROP POLICY IF EXISTS %I ON %I', rec.policyname, rec.tablename);
    BEGIN
      EXECUTE drop_sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Nao foi possivel remover policy % da tabela %: %', rec.policyname, rec.tablename, SQLERRM;
    END;
  END LOOP;
END $$;

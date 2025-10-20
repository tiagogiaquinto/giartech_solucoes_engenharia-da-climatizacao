/*
  # Desabilitar RLS para Acesso Livre (Corrigido)
  
  Remove todas as restrições de Row Level Security para permitir
  acesso total sem autenticação.
  
  ## Alterações
  - Desabilita RLS apenas em tabelas (não views)
  - Remove políticas restritivas
  - Permite acesso anônimo total
  
  ## Segurança
  - ATENÇÃO: Sistema totalmente aberto sem autenticação
  - Adequado para desenvolvimento e demonstração
*/

-- ============================================================
-- DESABILITAR RLS EM TABELAS (NÃO VIEWS)
-- ============================================================

DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    -- Desabilitar RLS
    EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', 
      r.schemaname, r.tablename);
    
    -- Log
    RAISE NOTICE 'RLS desabilitado em: %.%', r.schemaname, r.tablename;
  END LOOP;
END $$;

-- ============================================================
-- REMOVER TODAS AS POLÍTICAS
-- ============================================================

DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      r.policyname, r.schemaname, r.tablename);
    
    -- Log
    RAISE NOTICE 'Política removida: % em %.%', r.policyname, r.schemaname, r.tablename;
  END LOOP;
END $$;

-- ============================================================
-- GARANTIR ACESSO ANÔNIMO NO STORAGE
-- ============================================================

-- Remover políticas antigas do storage
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- Criar política de acesso público total para avatars
CREATE POLICY "public_access_all"
ON storage.objects FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================================
-- GARANTIR GRANTS PÚBLICOS
-- ============================================================

-- Grant de acesso para role anon (Supabase anônimo)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    -- Garantir todas as permissões para anon
    EXECUTE format('GRANT ALL ON %I.%I TO anon', r.schemaname, r.tablename);
    EXECUTE format('GRANT ALL ON %I.%I TO authenticated', r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Grant para sequences
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, sequencename 
    FROM pg_sequences 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I.%I TO anon', r.schemaname, r.sequencename);
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I.%I TO authenticated', r.schemaname, r.sequencename);
  END LOOP;
END $$;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

-- Contar tabelas sem RLS (deve ser todas)
SELECT 
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE NOT rowsecurity) as tables_without_rls
FROM pg_tables
WHERE schemaname = 'public';

-- Contar políticas (deve ser 0 em tabelas públicas)
SELECT 
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';

-- Status final
SELECT 'SISTEMA CONFIGURADO PARA ACESSO LIVRE - SEM AUTENTICAÇÃO!' as status;

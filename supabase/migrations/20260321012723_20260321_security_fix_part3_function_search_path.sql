/*
  # Correcao de Seguranca - Parte 3: Definir search_path nas funcoes criticas

  ## Problema
  Funcoes sem search_path definido sao vulneraveis a "Search Path Injection".

  ## Solucao
  Adicionar SET search_path = public, pg_temp a todas as funcoes de negocio
  usando um bloco PL/pgSQL dinamico para lidar com funcoes que podem ou nao existir.
*/

DO $$
DECLARE
  rec RECORD;
  alter_sql TEXT;
  skipped_names TEXT[] := ARRAY[
    'hnswhandler', 'ivfflathandler', 'vector_in', 'vector_out',
    'vector_recv', 'vector_send', 'vector_typmod_in', 'vector_typmod_out',
    'vector_accum', 'vector_avg', 'vector_combine', 'vector_norm',
    'vector_spherical_distance', 'vector_dims', 'l2_distance', 'inner_product',
    'cosine_distance', 'halfvec_in', 'halfvec_out', 'sparsevec_in', 'sparsevec_out'
  ];
BEGIN
  FOR rec IN
    SELECT 
      p.proname,
      p.oid,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM pg_options_to_table(p.proconfig) WHERE option_name = 'search_path'
      )
      AND p.proname <> ALL(skipped_names)
  LOOP
    BEGIN
      alter_sql := format(
        'ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp',
        rec.proname,
        rec.args
      );
      EXECUTE alter_sql;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  RAISE NOTICE 'search_path aplicado em todas as funcoes possiveis.';
END $$;

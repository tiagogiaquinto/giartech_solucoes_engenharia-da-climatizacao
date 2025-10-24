/*
  # Limpar Funções Duplicadas do Thomaz

  1. Limpeza
    - Remover funções com assinatura incorreta (retorno RECORD)
    - Manter apenas funções com retorno JSONB

  2. Segurança
    - Manter permissões consistentes
*/

-- =====================================================
-- 1. REMOVER FUNÇÕES COM RETORNO INCORRETO
-- =====================================================

-- Buscar e remover todas as versões da função que retornam RECORD
DO $$
DECLARE
  func RECORD;
BEGIN
  FOR func IN 
    SELECT 
      p.proname as name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE 'thomaz_get_%'
    AND pg_get_function_result(p.oid) LIKE '%record%'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I(%s)', func.name, func.args);
    RAISE NOTICE 'Dropped function: %(%)', func.name, func.args;
  END LOOP;
END $$;

-- =====================================================
-- 2. RECRIAR thomaz_get_agenda_info SE NECESSÁRIO
-- =====================================================

DROP FUNCTION IF EXISTS thomaz_get_agenda_info() CASCADE;

CREATE OR REPLACE FUNCTION thomaz_get_agenda_info(
  p_date_from TEXT DEFAULT NULL,
  p_date_to TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_date_from DATE;
  v_date_to DATE;
BEGIN
  v_date_from := COALESCE(p_date_from::DATE, CURRENT_DATE);
  v_date_to := COALESCE(p_date_to::DATE, CURRENT_DATE + INTERVAL '7 days');

  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'events', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'title', title,
        'start_time', start_time,
        'end_time', end_time,
        'type', event_type,
        'description', description
      ) ORDER BY start_time
    ) FILTER (WHERE id IS NOT NULL), '[]'::jsonb)
  )
  INTO result
  FROM agenda_events
  WHERE DATE(start_time) BETWEEN v_date_from AND v_date_to;
  
  RETURN COALESCE(result, '{"total_events": 0, "events": []}'::jsonb);
END;
$$;

-- =====================================================
-- 3. GARANTIR PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION thomaz_get_agenda_info(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_employees_info(TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_service_orders_info(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_inventory_info(TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_financial_entries_info(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_system_stats() TO anon, authenticated;

/*
  # Recriar Funções RPC do Thomaz

  1. Funções RPC
    - Drop e recriação de todas as funções com assinaturas corretas
    - Garantir retorno JSONB consistente

  2. Segurança
    - SECURITY DEFINER para acesso completo aos dados
    - search_path configurado
*/

-- =====================================================
-- 1. REMOVER FUNÇÕES EXISTENTES
-- =====================================================

DROP FUNCTION IF EXISTS thomaz_get_agenda_info(TEXT, TEXT);
DROP FUNCTION IF EXISTS thomaz_get_agenda_info();
DROP FUNCTION IF EXISTS thomaz_get_employees_info(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS thomaz_get_service_orders_info(TEXT, INTEGER);
DROP FUNCTION IF EXISTS thomaz_get_inventory_info(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS thomaz_get_financial_entries_info(TEXT, TEXT);

-- =====================================================
-- 2. FUNÇÃO: thomaz_get_agenda_info
-- =====================================================

CREATE FUNCTION thomaz_get_agenda_info(
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
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- =====================================================
-- 3. FUNÇÃO: thomaz_get_employees_info
-- =====================================================

CREATE FUNCTION thomaz_get_employees_info(
  p_search TEXT DEFAULT NULL,
  p_active_only BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_employees', COUNT(*),
    'employees', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'role', role,
        'department', department,
        'phone', phone,
        'email', email,
        'is_active', COALESCE(is_active, true)
      )
    ) FILTER (WHERE id IS NOT NULL), '[]'::jsonb)
  )
  INTO result
  FROM employees
  WHERE (p_active_only = false OR COALESCE(is_active, true) = true)
  AND (p_search IS NULL OR p_search = '' OR 
       name ILIKE '%' || p_search || '%' OR
       role ILIKE '%' || p_search || '%' OR
       department ILIKE '%' || p_search || '%')
  LIMIT 50;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- =====================================================
-- 4. FUNÇÃO: thomaz_get_service_orders_info
-- =====================================================

CREATE FUNCTION thomaz_get_service_orders_info(
  p_filter TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', COUNT(*),
    'orders', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'order_number', order_number,
        'customer_name', customer_name,
        'status', status,
        'total_value', COALESCE(total_value, 0),
        'created_at', created_at,
        'service_date', service_date
      ) ORDER BY created_at DESC
    ) FILTER (WHERE id IS NOT NULL), '[]'::jsonb)
  )
  INTO result
  FROM service_orders
  WHERE (p_filter IS NULL OR p_filter = '' OR
         order_number ILIKE '%' || p_filter || '%' OR
         customer_name ILIKE '%' || p_filter || '%' OR
         status ILIKE '%' || p_filter || '%')
  LIMIT p_limit;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- =====================================================
-- 5. FUNÇÃO: thomaz_get_inventory_info
-- =====================================================

CREATE FUNCTION thomaz_get_inventory_info(
  p_search TEXT DEFAULT NULL,
  p_low_stock_only BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_items', COUNT(*),
    'low_stock_count', COUNT(*) FILTER (WHERE quantity <= minimum_stock),
    'items', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'sku', sku,
        'quantity', quantity,
        'minimum_stock', minimum_stock,
        'unit', unit,
        'category', category,
        'is_low_stock', (quantity <= minimum_stock)
      ) ORDER BY 
        CASE WHEN quantity <= minimum_stock THEN 0 ELSE 1 END,
        quantity ASC
    ) FILTER (WHERE id IS NOT NULL), '[]'::jsonb)
  )
  INTO result
  FROM inventory_items
  WHERE (p_search IS NULL OR p_search = '' OR
         name ILIKE '%' || p_search || '%' OR
         sku ILIKE '%' || p_search || '%' OR
         category ILIKE '%' || p_search || '%')
  AND (p_low_stock_only = false OR quantity <= minimum_stock)
  LIMIT 50;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- =====================================================
-- 6. FUNÇÃO: thomaz_get_financial_entries_info
-- =====================================================

CREATE FUNCTION thomaz_get_financial_entries_info(
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
  v_date_from := COALESCE(p_date_from::DATE, CURRENT_DATE - INTERVAL '30 days');
  v_date_to := COALESCE(p_date_to::DATE, CURRENT_DATE);

  SELECT jsonb_build_object(
    'total_entries', COUNT(*),
    'total_income', COALESCE(SUM(amount) FILTER (WHERE entry_type = 'income'), 0),
    'total_expense', COALESCE(SUM(amount) FILTER (WHERE entry_type = 'expense'), 0),
    'balance', COALESCE(
      SUM(amount) FILTER (WHERE entry_type = 'income') - 
      SUM(amount) FILTER (WHERE entry_type = 'expense'), 
      0
    ),
    'entries', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'description', description,
        'amount', amount,
        'entry_type', entry_type,
        'category', category,
        'date', date,
        'status', status
      ) ORDER BY date DESC
    ) FILTER (WHERE id IS NOT NULL), '[]'::jsonb)
  )
  INTO result
  FROM finance_entries
  WHERE date BETWEEN v_date_from AND v_date_to
  LIMIT 100;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- =====================================================
-- 7. GARANTIR PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION thomaz_get_agenda_info(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_employees_info(TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_service_orders_info(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_inventory_info(TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_get_financial_entries_info(TEXT, TEXT) TO anon, authenticated;

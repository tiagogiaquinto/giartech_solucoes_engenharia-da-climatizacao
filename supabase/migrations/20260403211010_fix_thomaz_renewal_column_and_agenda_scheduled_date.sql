/*
  # Fix thomaz_check_renewal_opportunities and agenda_events column references

  1. Changes
    - Fix `thomaz_check_renewal_opportunities`: replace `c.name` with `c.nome_razao`
      (customers table uses nome_razao, not name)
  
  2. No data loss — only recreating the function with the correct column reference.
*/

CREATE OR REPLACE FUNCTION public.thomaz_check_renewal_opportunities()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_asset RECORD;
  v_count integer := 0;
  v_key   text;
  v_title text;
  v_days_since integer;
BEGIN
  FOR v_asset IN
    SELECT
      ca.id,
      ca.name        AS asset_name,
      ca.client_id,
      ca.last_maintenance,
      ca.last_service_date,
      c.nome_razao   AS customer_name
    FROM customer_assets ca
    JOIN customers c ON c.id = ca.client_id
    WHERE
      COALESCE(ca.last_maintenance, ca.last_service_date, ca.created_at::date)
        < CURRENT_DATE - INTERVAL '180 days'
    ORDER BY ca.last_maintenance ASC NULLS FIRST
    LIMIT 50
  LOOP
    v_days_since := CURRENT_DATE - COALESCE(
      v_asset.last_maintenance,
      v_asset.last_service_date,
      (NOW() - INTERVAL '180 days')::date
    );

    v_key   := 'renewal_' || v_asset.id::text;
    v_title := 'Venda Recorrente: ' || v_asset.customer_name
               || ' (' || v_asset.asset_name || ' — '
               || v_days_since || ' dias sem manutenção)';

    INSERT INTO admin_tasks (title, color, priority, automation_key, os_id, created_at)
    VALUES (
      v_title,
      'blue',
      'high',
      v_key,
      NULL,
      NOW()
    )
    ON CONFLICT (automation_key) DO UPDATE
      SET title      = EXCLUDED.title,
          updated_at = NOW()
    WHERE admin_tasks.automation_key = EXCLUDED.automation_key;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

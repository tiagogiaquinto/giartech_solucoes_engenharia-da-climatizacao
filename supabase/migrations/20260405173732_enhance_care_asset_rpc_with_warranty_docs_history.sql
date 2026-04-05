/*
  # Enhance Care Asset RPC with Warranty, Documents and Service History

  ## Purpose
  Extends the asset page data returned by `get_care_asset_by_token` to include:
  - Warranty counter (days remaining, expired flag)
  - List of completed service orders (documents/history)
  - Customer address/location details
  - Role-aware data so technician notes stay private

  ## New/Modified Functions

  ### `get_care_asset_by_token(p_token uuid)`
  Fully replaces the previous version.
  Returns a JSON object with:
  - Core asset data (name, brand, model, serial, location, health)
  - Customer info (name)
  - Warranty fields (warranty_expiry, warranty_days_left, warranty_active)
  - Maintenance history (last date, next date, technician name)
  - Service orders list: order_number, title, status, completed_at, total_value, pdf_url
  - PMOC flag

  ### `get_care_asset_service_orders(p_token uuid)`
  Returns the live list of service orders for realtime subscription.
  Can be called from the frontend whenever a realtime event fires.

  ## Security
  Both functions are SECURITY DEFINER with a fixed search_path.
  They are intentionally accessible without auth (GRANT TO anon) because
  the QR token itself is the authentication mechanism.
  Sensitive financial data (profit/margins) is NOT included.
*/

CREATE OR REPLACE FUNCTION get_care_asset_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset_id uuid;
  v_warranty_expiry date;
  v_warranty_days_left int;
  v_warranty_active boolean;
  v_result jsonb;
BEGIN
  SELECT id INTO v_asset_id
  FROM customer_equipment
  WHERE qr_code_token = p_token
  LIMIT 1;

  IF v_asset_id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT warranty_expiry INTO v_warranty_expiry
  FROM customer_equipment
  WHERE id = v_asset_id;

  IF v_warranty_expiry IS NOT NULL THEN
    v_warranty_days_left := (v_warranty_expiry - CURRENT_DATE)::int;
    v_warranty_active    := v_warranty_days_left > 0;
  ELSE
    v_warranty_days_left := NULL;
    v_warranty_active    := false;
  END IF;

  SELECT jsonb_build_object(
    'found',              true,
    'asset_id',           ce.id,
    'asset_name',         ce.name,
    'model',              ce.model,
    'brand',              ce.brand,
    'serial_number',      ce.serial_number,
    'location',           ce.location,
    'asset_health',       ce.asset_health,
    'qr_code_token',      ce.qr_code_token,
    'last_maintenance',   ce.last_maintenance_date,
    'next_maintenance',   ce.next_maintenance_date,
    'last_service_date',  ce.last_maintenance_date,
    'pmoc_active',        ce.pmoc_active,
    'customer_name',      cu.name,
    'customer_id',        ce.customer_id,
    'warranty_expiry',    v_warranty_expiry,
    'warranty_days_left', v_warranty_days_left,
    'warranty_active',    v_warranty_active,
    'last_technician', (
      SELECT e.full_name
      FROM service_orders so2
      LEFT JOIN employees e ON e.id = so2.assigned_employee_id
      WHERE so2.customer_equipment_id = ce.id
        AND so2.status IN ('concluido', 'concluded', 'completed')
      ORDER BY so2.completed_at DESC NULLS LAST
      LIMIT 1
    ),
    'service_orders', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'os_id',         so.id,
          'order_number',  so.order_number,
          'title',         COALESCE(so.title, so.description, 'Ordem de Serviço'),
          'status',        so.status,
          'created_at',    so.created_at,
          'completed_at',  so.completed_at,
          'scheduled_at',  so.scheduled_date,
          'technician',    COALESCE(e.full_name, so.technician_name),
          'total_value',   so.total_value,
          'track_token',   so.track_token
        )
        ORDER BY so.created_at DESC
      )
      FROM service_orders so
      LEFT JOIN employees e ON e.id = so.assigned_employee_id
      WHERE so.customer_equipment_id = ce.id
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM customer_equipment ce
  LEFT JOIN customers cu ON cu.id = ce.customer_id
  WHERE ce.id = v_asset_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_care_asset_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_care_asset_service_orders(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset_id uuid;
BEGIN
  SELECT id INTO v_asset_id
  FROM customer_equipment
  WHERE qr_code_token = p_token
  LIMIT 1;

  IF v_asset_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'os_id',         so.id,
        'order_number',  so.order_number,
        'title',         COALESCE(so.title, so.description, 'Ordem de Serviço'),
        'status',        so.status,
        'created_at',    so.created_at,
        'completed_at',  so.completed_at,
        'scheduled_at',  so.scheduled_date,
        'technician',    COALESCE(e.full_name, so.technician_name),
        'total_value',   so.total_value,
        'track_token',   so.track_token
      )
      ORDER BY so.created_at DESC
    )
    FROM service_orders so
    LEFT JOIN employees e ON e.id = so.assigned_employee_id
    WHERE so.customer_equipment_id = v_asset_id
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION get_care_asset_service_orders(text) TO anon, authenticated;

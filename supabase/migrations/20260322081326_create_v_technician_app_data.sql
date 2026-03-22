/*
  # Create v_technician_app_data view (drop and recreate)

  A unified, finance-free data feed for the technician mobile app.
  Drops any existing version first to allow column reordering.
*/

DROP VIEW IF EXISTS public.v_technician_app_data;

CREATE VIEW public.v_technician_app_data AS
SELECT
  so.id,
  so.order_number,
  so.status,
  so.priority,
  so.title,
  so.scheduled_at,
  so.scheduled_time,
  so.completed_at,
  so.progress_percent,
  so.technician_id,
  so.technician_notes,
  so.description,
  so.notes,
  so.access_note,
  so.location,
  COALESCE(so.client_name,  c.nome_razao)  AS client_name,
  COALESCE(so.client_phone, c.telefone)    AS client_phone,
  so.client_address,
  so.client_city,
  so.equipment,
  so.brand,
  so.model,
  so.service_type
FROM public.service_orders so
LEFT JOIN public.customers c ON c.id = so.customer_id;

GRANT SELECT ON public.v_technician_app_data TO authenticated;
GRANT SELECT ON public.v_technician_app_data TO service_role;

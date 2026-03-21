/*
  # Create v_technician_service_orders view (v2)

  ## Purpose
  Provides a flat view of service orders with technician resolution columns.
  The `assigned_employee_auth_id` column allows the frontend to filter:
    `.eq('assigned_employee_auth_id', user.id)`
  so technicians only load their own orders.

  employees.auth_account_id links to auth_accounts.id (which equals auth.uid()).
*/

DROP VIEW IF EXISTS public.v_technician_service_orders CASCADE;

CREATE OR REPLACE VIEW public.v_technician_service_orders AS
SELECT
  so.id,
  so.order_number,
  so.status,
  so.priority,
  so.title,
  so.description,
  so.client_name,
  so.client_phone,
  so.client_address,
  so.client_city,
  so.scheduled_at,
  so.scheduled_time,
  so.due_date,
  so.service_date,
  so.equipment,
  so.brand,
  so.model,
  so.progress_percent,
  so.technician_id,
  so.assigned_to,
  so.created_at,
  so.updated_at,
  e_assigned.id            AS assigned_employee_id,
  e_assigned.name          AS assigned_employee_name,
  e_assigned.auth_account_id AS assigned_employee_auth_id
FROM public.service_orders so
LEFT JOIN public.employees e_assigned
  ON e_assigned.id::text = so.assigned_to::text;

GRANT SELECT ON public.v_technician_service_orders TO authenticated;
GRANT SELECT ON public.v_technician_service_orders TO service_role;

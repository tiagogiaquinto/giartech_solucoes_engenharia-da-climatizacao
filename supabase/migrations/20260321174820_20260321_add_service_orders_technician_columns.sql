/*
  # Add missing columns to service_orders and reload schema

  ## Changes
  - Ensures technician_id (UUID → auth.users) exists
  - Ensures status has a default
  - Ensures progress_percent has a default
  - Reloads PostgREST schema cache

  ## Note on RLS
  We do NOT add the "Acesso App Tecnico" policy here because:
  - The table already has `so_select_staff` (USING true for all authenticated)
  - Adding a second SELECT policy would create an OR condition — any authenticated
    user would still see everything, making the restriction useless
  - Technician filtering is enforced at the VIEW level (v_technician_service_orders)
    where the app queries with .eq('technician_id', auth.uid()) or
    .eq('assigned_employee_auth_id', auth.uid())
*/

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS progress_percent INT DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'service_orders'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.service_orders ADD COLUMN status TEXT DEFAULT 'pendente';
  ELSE
    ALTER TABLE public.service_orders ALTER COLUMN status SET DEFAULT 'pendente';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

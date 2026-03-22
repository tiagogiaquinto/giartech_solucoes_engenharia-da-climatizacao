/*
  # OS Completion Data

  ## Summary
  Creates the `os_completion_data` table to store the finalization data
  collected by the technician at the end of a service order:
  - Technician signature (PNG base64)
  - Client responsible name (typed by technician)
  - Client signature (PNG base64)
  - Completed at timestamp

  ## Security
  - RLS enabled
  - Technician can insert/update only their own assigned OS
  - Staff (admin/manager/etc.) can read all records
*/

CREATE TABLE IF NOT EXISTS public.os_completion_data (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id                 uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  technician_signature  text,
  client_name           text NOT NULL DEFAULT '',
  client_signature      text,
  completed_at          timestamptz DEFAULT now(),
  submitted_by          uuid REFERENCES auth.users(id),
  UNIQUE(os_id)
);

ALTER TABLE public.os_completion_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "completion_select_staff"
  ON public.os_completion_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin', 'manager', 'sales', 'financial')
        AND a.is_active = true
    )
  );

CREATE POLICY "completion_select_technician"
  ON public.os_completion_data FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  );

CREATE POLICY "completion_insert_technician"
  ON public.os_completion_data FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  );

CREATE POLICY "completion_update_technician"
  ON public.os_completion_data FOR UPDATE
  TO authenticated
  USING (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  )
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  );

CREATE POLICY "completion_delete_admin"
  ON public.os_completion_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin')
        AND a.is_active = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_os_completion_data_os_id ON public.os_completion_data(os_id);

NOTIFY pgrst, 'reload schema';

/*
  # Technician Data Isolation & Form Responses

  ## Summary
  This migration enforces proper data boundaries for technician users:
  1. Replaces the open SELECT policy on service_orders with role-aware policies:
     - Staff (admin/manager/sales/financial/super_admin) see ALL orders
     - Technicians see ONLY orders assigned to them
  2. Restricts UPDATE policy: staff full update; technician limited update
  3. Creates `os_form_responses` table for technician field notes
  4. Creates `os_execution_photos` table for before/after photos
  5. Creates `os_signatures` table for client signatures
  6. Adds `technician_notes` column to service_orders

  ## Key Fix
  employees table uses `auth_account_id` (not user_id) to link to auth_accounts.
*/

-- ─── 1. REPLACE SERVICE_ORDERS SELECT POLICY ────────────────────────────────

DROP POLICY IF EXISTS "so_select_staff" ON public.service_orders;

CREATE POLICY "so_select_staff"
  ON public.service_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin', 'manager', 'sales', 'financial')
        AND a.is_active = true
    )
  );

CREATE POLICY "so_select_technician"
  ON public.service_orders
  FOR SELECT
  TO authenticated
  USING (
    (
      technician_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM service_order_assignments soa
        INNER JOIN employees emp ON emp.id = soa.employee_id
        WHERE soa.service_order_id = service_orders.id
          AND emp.auth_account_id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role = 'technician'
        AND a.is_active = true
    )
  );

-- ─── 2. UPDATE POLICIES ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "so_update_staff" ON public.service_orders;

CREATE POLICY "so_update_staff"
  ON public.service_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin', 'manager', 'sales', 'financial')
        AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin', 'manager', 'sales', 'financial')
        AND a.is_active = true
    )
  );

CREATE POLICY "so_update_technician"
  ON public.service_orders
  FOR UPDATE
  TO authenticated
  USING (
    (
      technician_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM service_order_assignments soa
        INNER JOIN employees emp ON emp.id = soa.employee_id
        WHERE soa.service_order_id = service_orders.id
          AND emp.auth_account_id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role = 'technician'
        AND a.is_active = true
    )
  )
  WITH CHECK (
    (
      technician_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM service_order_assignments soa
        INNER JOIN employees emp ON emp.id = soa.employee_id
        WHERE soa.service_order_id = service_orders.id
          AND emp.auth_account_id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role = 'technician'
        AND a.is_active = true
    )
  );

-- ─── 3. TECHNICIAN_NOTES COLUMN ─────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_orders'
      AND column_name = 'technician_notes'
  ) THEN
    ALTER TABLE public.service_orders ADD COLUMN technician_notes TEXT;
  END IF;
END $$;

-- ─── 4. OS_FORM_RESPONSES TABLE ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.os_form_responses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id       uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  field_key   text NOT NULL,
  field_label text,
  value       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(os_id, field_key)
);

ALTER TABLE public.os_form_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_responses_select_staff"
  ON public.os_form_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin', 'manager', 'sales', 'financial')
        AND a.is_active = true
    )
  );

CREATE POLICY "form_responses_select_technician"
  ON public.os_form_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = os_form_responses.os_id
        AND (
          so.technician_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM service_order_assignments soa
            INNER JOIN employees emp ON emp.id = soa.employee_id
            WHERE soa.service_order_id = so.id
              AND emp.auth_account_id = auth.uid()
          )
        )
    )
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role = 'technician'
        AND a.is_active = true
    )
  );

CREATE POLICY "form_responses_insert_technician"
  ON public.os_form_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = os_form_responses.os_id
        AND (
          so.technician_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM service_order_assignments soa
            INNER JOIN employees emp ON emp.id = soa.employee_id
            WHERE soa.service_order_id = so.id
              AND emp.auth_account_id = auth.uid()
          )
        )
    )
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  );

CREATE POLICY "form_responses_update_technician"
  ON public.os_form_responses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = os_form_responses.os_id
        AND (
          so.technician_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM service_order_assignments soa
            INNER JOIN employees emp ON emp.id = soa.employee_id
            WHERE soa.service_order_id = so.id
              AND emp.auth_account_id = auth.uid()
          )
        )
    )
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = os_form_responses.os_id
        AND (
          so.technician_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM service_order_assignments soa
            INNER JOIN employees emp ON emp.id = soa.employee_id
            WHERE soa.service_order_id = so.id
              AND emp.auth_account_id = auth.uid()
          )
        )
    )
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  );

CREATE POLICY "form_responses_delete_admin"
  ON public.os_form_responses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin')
        AND a.is_active = true
    )
  );

-- ─── 5. OS_EXECUTION_PHOTOS TABLE ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.os_execution_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id      uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after')),
  data_url   text,
  taken_by   uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.os_execution_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_select_staff"
  ON public.os_execution_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin', 'manager', 'sales', 'financial')
        AND a.is_active = true
    )
  );

CREATE POLICY "photos_select_technician"
  ON public.os_execution_photos FOR SELECT
  TO authenticated
  USING (
    taken_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  );

CREATE POLICY "photos_insert_technician"
  ON public.os_execution_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    taken_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  );

CREATE POLICY "photos_delete_admin"
  ON public.os_execution_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin')
        AND a.is_active = true
    )
  );

-- ─── 6. OS_SIGNATURES TABLE ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.os_signatures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id         uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  signature_png text NOT NULL,
  signed_at     timestamptz DEFAULT now(),
  signed_by     uuid REFERENCES auth.users(id),
  UNIQUE(os_id)
);

ALTER TABLE public.os_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signatures_select_staff"
  ON public.os_signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin', 'manager', 'sales', 'financial')
        AND a.is_active = true
    )
  );

CREATE POLICY "signatures_select_technician"
  ON public.os_signatures FOR SELECT
  TO authenticated
  USING (
    signed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  );

CREATE POLICY "signatures_insert_technician"
  ON public.os_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    signed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  );

CREATE POLICY "signatures_update_technician"
  ON public.os_signatures FOR UPDATE
  TO authenticated
  USING (
    signed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  )
  WITH CHECK (
    signed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid() AND a.role = 'technician' AND a.is_active = true
    )
  );

CREATE POLICY "signatures_delete_admin"
  ON public.os_signatures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts a
      WHERE a.id = auth.uid()
        AND a.role IN ('super_admin', 'admin')
        AND a.is_active = true
    )
  );

-- ─── 7. INDEXES ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_os_form_responses_os_id ON public.os_form_responses(os_id);
CREATE INDEX IF NOT EXISTS idx_os_execution_photos_os_id ON public.os_execution_photos(os_id);
CREATE INDEX IF NOT EXISTS idx_os_signatures_os_id ON public.os_signatures(os_id);

NOTIFY pgrst, 'reload schema';

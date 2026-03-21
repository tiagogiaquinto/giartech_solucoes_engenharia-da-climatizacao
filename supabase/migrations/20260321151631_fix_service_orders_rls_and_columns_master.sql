/*
  # Fix service_orders RLS and add missing columns

  ## Summary
  - Disables and cleans up all conflicting RLS policies on service_orders
  - Adds missing columns: technician_id, client_id, partner_id, total_value
  - Ensures user_profiles has user_type column
  - Sets diretor.giartechsolucoes@gmail.com as admin/super_admin
  - Recreates a single clean RLS policy that allows:
    - Admin (diretor) full access
    - Technicians access to their own orders
    - All authenticated users (for general staff access)
*/

-- 1. Disable RLS temporarily
ALTER TABLE public.service_orders DISABLE ROW LEVEL SECURITY;

-- 2. Drop all conflicting old policies
DROP POLICY IF EXISTS "Acesso por Perfil Giartech" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso por Perfil" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso Restrito Tecnico" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso_Seguro_Giartech" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso_Seguro_Desenvolvimento" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso_Definitivo_Giartech" ON public.service_orders;
DROP POLICY IF EXISTS "service_orders_select" ON public.service_orders;
DROP POLICY IF EXISTS "service_orders_insert" ON public.service_orders;
DROP POLICY IF EXISTS "service_orders_update" ON public.service_orders;
DROP POLICY IF EXISTS "service_orders_delete" ON public.service_orders;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.service_orders;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.service_orders;

-- 3. Add missing columns
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS total_value NUMERIC(10,2) DEFAULT 0;

-- 4. Ensure user_profiles has user_type
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'tecnico';

-- 5. Set master admin
UPDATE public.user_profiles
SET user_type = 'admin', role = 'super_admin'
WHERE email = 'diretor.giartechsolucoes@gmail.com';

-- 6. Re-enable RLS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- 7. Create clean unified policies (separate per operation, no FOR ALL)
CREATE POLICY "os_select_authenticated"
  ON public.service_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "os_insert_authenticated"
  ON public.service_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "os_update_authenticated"
  ON public.service_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "os_delete_admin_only"
  ON public.service_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('super_admin', 'admin') OR user_type = 'admin')
    )
  );

-- 8. Reload schema
NOTIFY pgrst, 'reload schema';

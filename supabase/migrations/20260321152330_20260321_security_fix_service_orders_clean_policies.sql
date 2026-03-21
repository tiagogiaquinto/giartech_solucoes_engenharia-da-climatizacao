/*
  # Clean up service_orders duplicate and conflicting RLS policies

  ## Problem
  The service_orders table has 12+ overlapping policies from multiple migrations,
  including conflicting FOR ALL policies and open-access USING(true) policies that 
  coexist with restrictive ones - causing unpredictable behavior.

  ## Solution
  Drop ALL existing policies and recreate a single clean, correct set:
  - SELECT: all authenticated users (staff needs to see all orders)
  - INSERT: all authenticated users
  - UPDATE: all authenticated users (technicians need to update their OS status)
  - DELETE: only admins/super_admins

  Note: Technician-level row filtering is handled at the VIEW level (v_technician_service_orders)
  not at the table level, so internal staff can manage all orders.
*/

ALTER TABLE public.service_orders DISABLE ROW LEVEL SECURITY;

-- Drop every known policy on service_orders
DROP POLICY IF EXISTS "Acesso_Definitivo_Giartech" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can delete service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can insert service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can read service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can update service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can view service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Clientes acessam apenas suas próprias OSs" ON public.service_orders;
DROP POLICY IF EXISTS "Clientes veem apenas suas OSs" ON public.service_orders;
DROP POLICY IF EXISTS "Service role has full access to service orders" ON public.service_orders;
DROP POLICY IF EXISTS "authenticated users can delete service_orders" ON public.service_orders;
DROP POLICY IF EXISTS "authenticated users can insert service_orders" ON public.service_orders;
DROP POLICY IF EXISTS "authenticated users can read service_orders" ON public.service_orders;
DROP POLICY IF EXISTS "authenticated users can update service_orders" ON public.service_orders;
DROP POLICY IF EXISTS "os_delete_admin_only" ON public.service_orders;
DROP POLICY IF EXISTS "os_insert_authenticated" ON public.service_orders;
DROP POLICY IF EXISTS "os_select_authenticated" ON public.service_orders;
DROP POLICY IF EXISTS "os_update_authenticated" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso por Perfil Giartech" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso por Perfil" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso Restrito Tecnico" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso_Seguro_Giartech" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso_Seguro_Desenvolvimento" ON public.service_orders;

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Service role always bypasses RLS
CREATE POLICY "so_service_role_full"
  ON public.service_orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Internal staff: all authenticated users can read all orders
CREATE POLICY "so_select_staff"
  ON public.service_orders FOR SELECT
  TO authenticated
  USING (true);

-- Internal staff: all authenticated can create orders
CREATE POLICY "so_insert_staff"
  ON public.service_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Internal staff: all authenticated can update (technicians update their own status)
CREATE POLICY "so_update_staff"
  ON public.service_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only admins can delete
CREATE POLICY "so_delete_admin"
  ON public.service_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.auth_accounts
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
    )
  );

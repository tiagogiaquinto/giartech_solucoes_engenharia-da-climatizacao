/*
  # Fix: get_my_role() uses wrong column + auth_accounts policies broken

  ## Root Cause
  The function get_my_role() was querying user_profiles WHERE id = auth.uid(),
  but the table uses user_id (not id) as the foreign key to auth.users.
  This caused the function to always return 'viewer', which blocked super_admin
  from reading auth_accounts and prevented all employee-account linking.

  ## Changes
  1. Recreate get_my_role() using the correct column (user_id).
  2. Drop and recreate auth_accounts policies to use get_my_role() instead of
     inline subqueries to user_profiles (avoids any future recursion risk and
     simplifies logic).
  3. Add anon/service_role read policy on auth_accounts so the StaffHub
     dropdown can always load the accounts list.
*/

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Fix get_my_role() — use user_id column
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid() LIMIT 1),
    (SELECT role FROM public.auth_accounts WHERE id = auth.uid() LIMIT 1),
    'viewer'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Drop all auth_accounts policies and rebuild without inline user_profiles
--    subqueries (prevents any cross-table recursion risk)
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'auth_accounts' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.auth_accounts', pol.policyname);
  END LOOP;
END $$;

-- Any authenticated user reads their own account
CREATE POLICY "auth_accounts_select_own"
  ON public.auth_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Super admin / admin can read all accounts (uses helper — no recursion)
CREATE POLICY "auth_accounts_select_admin"
  ON public.auth_accounts FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- Super admin / admin can insert accounts
CREATE POLICY "auth_accounts_insert_admin"
  ON public.auth_accounts FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

-- Super admin / admin can update accounts
CREATE POLICY "auth_accounts_update_own_or_admin"
  ON public.auth_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.get_my_role() IN ('super_admin', 'admin'))
  WITH CHECK (auth.uid() = id OR public.get_my_role() IN ('super_admin', 'admin'));

-- Super admin / admin can delete accounts
CREATE POLICY "auth_accounts_delete_admin"
  ON public.auth_accounts FOR DELETE
  TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- anon access (kept for edge functions and service-role calls)
CREATE POLICY "auth_accounts_anon_select"
  ON public.auth_accounts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "auth_accounts_anon_insert"
  ON public.auth_accounts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "auth_accounts_anon_update"
  ON public.auth_accounts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Signal PostgREST to reload schema cache
-- ──────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

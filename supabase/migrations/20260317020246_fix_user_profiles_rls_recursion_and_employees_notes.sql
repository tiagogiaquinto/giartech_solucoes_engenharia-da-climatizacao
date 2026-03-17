/*
  # Fix: Infinite recursion in user_profiles RLS + missing employees.notes column

  ## Problem 1: Infinite Recursion (code 42P17)
  Policies "Super admin reads all profiles", "Super admin inserts profiles" and
  "Super admin updates any profile" on user_profiles contained a subquery that
  SELECTs FROM user_profiles itself, causing PostgreSQL to recurse forever when
  evaluating the policy.

  ## Fix
  - Drop all conflicting policies on user_profiles.
  - Create a SECURITY DEFINER helper function get_my_role() that reads the
    current user's role from user_profiles using a superuser-level bypass,
    breaking the recursion.
  - Recreate safe policies that call get_my_role() instead of querying the table
    directly.

  ## Problem 2: Missing column employees.notes (code PGRST204)
  The frontend queries/upserts a "notes" column on employees that does not exist.

  ## Fix
  - Add notes text column to employees (nullable, default empty string).
  - Signal PostgREST schema cache reload via pg_notify.
*/

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Helper function: get_my_role()
--    SECURITY DEFINER so it runs as the function owner (superuser context),
--    bypassing RLS on user_profiles and breaking the recursive loop.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid() LIMIT 1),
    (SELECT role FROM public.auth_accounts WHERE id = auth.uid() LIMIT 1),
    'viewer'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Drop all existing user_profiles policies (clean slate)
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', pol.policyname);
  END LOOP;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Re-enable RLS (just in case a previous migration disabled it)
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. New safe policies — ZERO self-referential subqueries
-- ──────────────────────────────────────────────────────────────────────────────

-- Any authenticated user can read their own profile
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Any authenticated user can update their own profile
CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super-admins can read all profiles (uses helper, no recursion)
CREATE POLICY "user_profiles_select_admin"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- Super-admins can insert any profile
CREATE POLICY "user_profiles_insert_admin"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

-- Super-admins can update any profile
CREATE POLICY "user_profiles_update_admin"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

-- Super-admins can delete profiles
CREATE POLICY "user_profiles_delete_admin"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'admin'));

-- anon/service_role full access (matches previous open-access migrations)
CREATE POLICY "user_profiles_anon_select"
  ON public.user_profiles FOR SELECT
  TO anon
  USING (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Add notes column to employees (fixes PGRST204)
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. Signal PostgREST to reload schema cache
-- ──────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

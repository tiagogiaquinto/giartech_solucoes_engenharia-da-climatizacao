/*
  # Fix get_my_role() infinite recursion + seed user_profiles for all accounts

  ## Problem
  1. get_my_role() fallback read from auth_accounts inside an auth_accounts RLS policy
     causing infinite recursion — role always resolved to 'viewer'.
  2. user_profiles had a CHECK constraint that blocked super_admin, sales,
     financial, and viewer roles from being stored.
  3. super_admin and other users had no user_profiles row, so get_my_role()
     always returned 'viewer'.

  ## Changes
  1. Expand user_profiles role CHECK to include all valid roles.
  2. Recreate get_my_role() to read ONLY user_profiles (eliminates recursion).
  3. Seed user_profiles rows for all existing auth_accounts.
  4. Sync role on existing rows where auth_accounts has a different value.
  5. Update handle_new_user trigger to populate role from auth_accounts.
*/

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Expand the role CHECK constraint on user_profiles
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('super_admin','admin','manager','technician','sales','financial','viewer','user'));

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Recreate get_my_role() — reads ONLY user_profiles (no auth_accounts lookup)
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
    'viewer'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Seed user_profiles for all existing auth_accounts that lack a profile
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO public.user_profiles (user_id, full_name, role, email)
SELECT aa.id, aa.full_name, aa.role, aa.email
FROM public.auth_accounts aa
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.user_id = aa.id
)
ON CONFLICT (user_id) DO UPDATE
  SET role      = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      email     = EXCLUDED.email,
      updated_at = now();

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Sync role on existing user_profiles rows where auth_accounts differs
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE public.user_profiles up
SET role = aa.role, updated_at = now()
FROM public.auth_accounts aa
WHERE up.user_id = aa.id
  AND up.role IS DISTINCT FROM aa.role;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Update handle_new_user trigger to sync role from auth_accounts
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_full_name text;
BEGIN
  SELECT role, full_name INTO v_role, v_full_name
  FROM public.auth_accounts WHERE id = NEW.id;

  v_role      := COALESCE(v_role, 'viewer');
  v_full_name := COALESCE(v_full_name, NEW.raw_user_meta_data->>'full_name', NEW.email);

  INSERT INTO public.user_profiles (user_id, full_name, role, email)
  VALUES (NEW.id, v_full_name, v_role, NEW.email)
  ON CONFLICT (user_id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        role       = EXCLUDED.role,
        email      = EXCLUDED.email,
        updated_at = now();

  RETURN NEW;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. Signal PostgREST to reload schema cache
-- ──────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

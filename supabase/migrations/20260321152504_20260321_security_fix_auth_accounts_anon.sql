/*
  # Fix auth_accounts: remove open anonymous SELECT policy

  ## Problem
  The policy "auth_accounts_anon_select" allows anonymous (unauthenticated) users
  to SELECT all rows from auth_accounts — which exposes user emails, roles, and metadata
  to anyone without a session.

  Also: "auth_accounts_authenticated_update" allows ANY authenticated user to UPDATE
  ANY account (USING(true) with no ownership check).

  ## Fix
  - Remove anon SELECT entirely
  - Keep own-record SELECT and admin SELECT
  - Fix update policy to only allow own-record or admin
*/

DROP POLICY IF EXISTS "auth_accounts_anon_select" ON public.auth_accounts;
DROP POLICY IF EXISTS "auth_accounts_authenticated_update" ON public.auth_accounts;
DROP POLICY IF EXISTS "auth_accounts_authenticated_insert" ON public.auth_accounts;

-- Ensure the correct update policy exists (own or admin)
DROP POLICY IF EXISTS "auth_accounts_update_own_or_admin" ON public.auth_accounts;
CREATE POLICY "auth_accounts_update_own_or_admin"
  ON public.auth_accounts FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = id) OR
    (get_my_role() = ANY (ARRAY['super_admin', 'admin']))
  )
  WITH CHECK (
    (auth.uid() = id) OR
    (get_my_role() = ANY (ARRAY['super_admin', 'admin']))
  );

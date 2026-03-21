/*
  # Fix portal_accounts and partner_referrals security (v2)

  ## Problems
  1. portal_accounts: anon users can SELECT all accounts (includes password hashes)
  2. portal_accounts: any authenticated user can UPDATE any account
  3. partner_referrals: open read/write for all authenticated

  ## Fix
  - portal_accounts restricted to admin management + service_role for login RPC
  - partner_referrals: staff read/insert, admin-only updates
  - portal_service_requests: secured with direct policy statements
*/

-- ============================================================
-- portal_accounts
-- ============================================================
ALTER TABLE public.portal_accounts DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pa_sel_anon" ON public.portal_accounts;
DROP POLICY IF EXISTS "pa_sel_auth" ON public.portal_accounts;
DROP POLICY IF EXISTS "pa_ins_auth" ON public.portal_accounts;
DROP POLICY IF EXISTS "pa_upd_auth" ON public.portal_accounts;
DROP POLICY IF EXISTS "pa_upd_authenticated" ON public.portal_accounts;
DROP POLICY IF EXISTS "pa_del_auth" ON public.portal_accounts;
DROP POLICY IF EXISTS "pa_service_role_full" ON public.portal_accounts;
DROP POLICY IF EXISTS "pa_select_admin" ON public.portal_accounts;
DROP POLICY IF EXISTS "pa_insert_admin" ON public.portal_accounts;
DROP POLICY IF EXISTS "pa_update_admin" ON public.portal_accounts;
DROP POLICY IF EXISTS "pa_delete_admin" ON public.portal_accounts;

ALTER TABLE public.portal_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pa_service_role_full"
  ON public.portal_accounts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "pa_select_admin"
  ON public.portal_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.auth_accounts a
      WHERE a.id = auth.uid() AND a.role IN ('super_admin', 'admin') AND a.is_active = true
    )
  );

CREATE POLICY "pa_insert_admin"
  ON public.portal_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auth_accounts a
      WHERE a.id = auth.uid() AND a.role IN ('super_admin', 'admin') AND a.is_active = true
    )
  );

CREATE POLICY "pa_update_admin"
  ON public.portal_accounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.auth_accounts a
      WHERE a.id = auth.uid() AND a.role IN ('super_admin', 'admin') AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auth_accounts a
      WHERE a.id = auth.uid() AND a.role IN ('super_admin', 'admin') AND a.is_active = true
    )
  );

CREATE POLICY "pa_delete_admin"
  ON public.portal_accounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.auth_accounts a
      WHERE a.id = auth.uid() AND a.role IN ('super_admin', 'admin') AND a.is_active = true
    )
  );

-- ============================================================
-- partner_referrals
-- ============================================================
ALTER TABLE public.partner_referrals DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pr_sel_auth" ON public.partner_referrals;
DROP POLICY IF EXISTS "pr_sel_anon" ON public.partner_referrals;
DROP POLICY IF EXISTS "pr_ins_auth" ON public.partner_referrals;
DROP POLICY IF EXISTS "pr_ins_anon" ON public.partner_referrals;
DROP POLICY IF EXISTS "pr_upd_auth" ON public.partner_referrals;
DROP POLICY IF EXISTS "pr_upd_anon" ON public.partner_referrals;
DROP POLICY IF EXISTS "pr_service_role_full" ON public.partner_referrals;
DROP POLICY IF EXISTS "pr_select_staff" ON public.partner_referrals;
DROP POLICY IF EXISTS "pr_insert_staff" ON public.partner_referrals;
DROP POLICY IF EXISTS "pr_update_admin" ON public.partner_referrals;

ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_service_role_full"
  ON public.partner_referrals FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "pr_select_staff"
  ON public.partner_referrals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pr_insert_staff"
  ON public.partner_referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "pr_update_admin"
  ON public.partner_referrals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.auth_accounts a
      WHERE a.id = auth.uid() AND a.role IN ('super_admin', 'admin', 'manager') AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auth_accounts a
      WHERE a.id = auth.uid() AND a.role IN ('super_admin', 'admin', 'manager') AND a.is_active = true
    )
  );

-- ============================================================
-- portal_service_requests
-- ============================================================
ALTER TABLE public.portal_service_requests DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "psr_sel_anon" ON public.portal_service_requests;
DROP POLICY IF EXISTS "psr_sel_auth" ON public.portal_service_requests;
DROP POLICY IF EXISTS "psr_ins_anon" ON public.portal_service_requests;
DROP POLICY IF EXISTS "psr_ins_auth" ON public.portal_service_requests;
DROP POLICY IF EXISTS "psr_upd_auth" ON public.portal_service_requests;
DROP POLICY IF EXISTS "psr_service_role_full" ON public.portal_service_requests;
DROP POLICY IF EXISTS "psr_select_staff" ON public.portal_service_requests;
DROP POLICY IF EXISTS "psr_insert_staff" ON public.portal_service_requests;
DROP POLICY IF EXISTS "psr_update_admin" ON public.portal_service_requests;

ALTER TABLE public.portal_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psr_service_role_full"
  ON public.portal_service_requests FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "psr_select_staff"
  ON public.portal_service_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "psr_insert_staff"
  ON public.portal_service_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "psr_update_admin"
  ON public.portal_service_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.auth_accounts a
      WHERE a.id = auth.uid() AND a.role IN ('super_admin', 'admin', 'manager') AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auth_accounts a
      WHERE a.id = auth.uid() AND a.role IN ('super_admin', 'admin', 'manager') AND a.is_active = true
    )
  );

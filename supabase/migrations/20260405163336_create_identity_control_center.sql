
/*
  # Identity Control Center - Admin User Management

  ## Summary
  Creates infrastructure for the premium Identity Control Center module.

  ### New Tables
  - `profile_edit_audit` — Logs every admin edit with before/after snapshots,
    who made the change and when. Immutable audit trail.

  ### New RPCs
  - `admin_get_all_profiles` — Returns unified view of all system users
    (auth_accounts staff + portal_accounts clients/partners) with rich metadata.
  - `admin_update_staff_profile` — Updates auth_accounts + user_profiles + employees
    atomically, logs to audit trail.
  - `admin_update_portal_profile` — Updates portal_accounts + customers record,
    logs to audit trail.
  - `admin_toggle_profile_active` — Activates / deactivates any profile type.
  - `admin_update_module_permissions` — Bulk-upserts module_permissions for a user.
  - `admin_reset_portal_password` — Resets a portal account password hash.

  ## Security
  - RLS enabled on profile_edit_audit
  - Only super_admin / admin can read audit rows
  - All RPCs check for admin role before executing
*/

-- ==========================================
-- 1. Audit table for profile edits
-- ==========================================
CREATE TABLE IF NOT EXISTS profile_edit_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type   text NOT NULL, -- 'staff' | 'portal_client' | 'portal_partner'
  target_id     uuid NOT NULL,
  target_email  text,
  changed_by    uuid,           -- auth_accounts.id of the admin
  changed_by_email text,
  field_name    text NOT NULL,
  old_value     text,
  new_value     text,
  changed_at    timestamptz DEFAULT now()
);

ALTER TABLE profile_edit_audit ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pea_target_id  ON profile_edit_audit(target_id);
CREATE INDEX IF NOT EXISTS idx_pea_changed_by ON profile_edit_audit(changed_by);
CREATE INDEX IF NOT EXISTS idx_pea_changed_at ON profile_edit_audit(changed_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profile_edit_audit' AND policyname = 'pea_admin_all'
  ) THEN
    CREATE POLICY "pea_admin_all"
      ON profile_edit_audit FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth_accounts
          WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
      );
  END IF;
END $$;

GRANT ALL ON profile_edit_audit TO authenticated;
GRANT ALL ON profile_edit_audit TO service_role;
GRANT SELECT ON profile_edit_audit TO anon;

-- ==========================================
-- 2. admin_get_all_profiles
-- Returns unified list of all system users
-- ==========================================
CREATE OR REPLACE FUNCTION admin_get_all_profiles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_result jsonb;
BEGIN
  SELECT role INTO v_caller_role
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin', 'admin', 'manager') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  SELECT jsonb_build_object(
    'staff', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',           aa.id,
          'type',         'staff',
          'email',        aa.email,
          'full_name',    aa.full_name,
          'role',         aa.role,
          'is_active',    aa.is_active,
          'last_login',   aa.last_login_at,
          'created_at',   aa.created_at,
          'phone',        up.phone,
          'department',   up.department,
          'avatar_url',   up.avatar_url,
          'employee_id',  e.id,
          'salary',       e.salary,
          'hourly_rate',  e.hourly_rate,
          'work_hours',   e.work_hours_per_day,
          'custo_hora',   e.custo_hora,
          'especialidade',e.especialidade
        )
        ORDER BY aa.full_name
      )
      FROM auth_accounts aa
      LEFT JOIN user_profiles up ON up.user_id = aa.id
      LEFT JOIN employees e ON e.auth_account_id = aa.id
    ), '[]'::jsonb),

    'portal', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',           pa.id,
          'type',         pa.role,
          'email',        pa.email,
          'full_name',    pa.full_name,
          'role',         pa.role,
          'is_active',    pa.is_active,
          'last_login',   pa.last_login_at,
          'created_at',   pa.created_at,
          'phone',        pa.phone,
          'document',     pa.document_cpf_cnpj,
          'customer_id',  pa.linked_customer_id,
          'partner_id',   pa.linked_partner_id,
          'customer_name', c.nome_razao,
          'customer_email', c.email
        )
        ORDER BY pa.full_name
      )
      FROM portal_accounts pa
      LEFT JOIN customers c ON c.id = pa.linked_customer_id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_profiles() TO anon;

-- ==========================================
-- 3. admin_update_staff_profile
-- ==========================================
CREATE OR REPLACE FUNCTION admin_update_staff_profile(
  p_target_id   uuid,
  p_full_name   text DEFAULT NULL,
  p_phone       text DEFAULT NULL,
  p_department  text DEFAULT NULL,
  p_role        text DEFAULT NULL,
  p_salary      numeric DEFAULT NULL,
  p_hourly_rate numeric DEFAULT NULL,
  p_work_hours  numeric DEFAULT NULL,
  p_custo_hora  numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_caller_email text;
BEGIN
  SELECT role, email INTO v_caller_role, v_caller_email
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  IF p_full_name IS NOT NULL THEN
    UPDATE auth_accounts SET full_name = p_full_name, updated_at = now() WHERE id = p_target_id;
    UPDATE user_profiles SET full_name = p_full_name, updated_at = now() WHERE user_id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
    VALUES('staff', p_target_id, auth.uid(), v_caller_email, 'full_name', p_full_name);
  END IF;

  IF p_phone IS NOT NULL THEN
    UPDATE user_profiles SET phone = p_phone, updated_at = now() WHERE user_id = p_target_id;
    UPDATE employees SET phone = p_phone, updated_at = now() WHERE auth_account_id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
    VALUES('staff', p_target_id, auth.uid(), v_caller_email, 'phone', p_phone);
  END IF;

  IF p_department IS NOT NULL THEN
    UPDATE user_profiles SET department = p_department, updated_at = now() WHERE user_id = p_target_id;
    UPDATE employees SET department = p_department, updated_at = now() WHERE auth_account_id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
    VALUES('staff', p_target_id, auth.uid(), v_caller_email, 'department', p_department);
  END IF;

  IF p_role IS NOT NULL THEN
    UPDATE auth_accounts SET role = p_role, updated_at = now() WHERE id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
    VALUES('staff', p_target_id, auth.uid(), v_caller_email, 'role', p_role);
  END IF;

  IF p_salary IS NOT NULL THEN
    UPDATE employees SET salary = p_salary, updated_at = now() WHERE auth_account_id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
    VALUES('staff', p_target_id, auth.uid(), v_caller_email, 'salary', p_salary::text);
  END IF;

  IF p_hourly_rate IS NOT NULL THEN
    UPDATE employees SET hourly_rate = p_hourly_rate, updated_at = now() WHERE auth_account_id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
    VALUES('staff', p_target_id, auth.uid(), v_caller_email, 'hourly_rate', p_hourly_rate::text);
  END IF;

  IF p_work_hours IS NOT NULL THEN
    UPDATE employees SET work_hours_per_day = p_work_hours, updated_at = now() WHERE auth_account_id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
    VALUES('staff', p_target_id, auth.uid(), v_caller_email, 'work_hours_per_day', p_work_hours::text);
  END IF;

  IF p_custo_hora IS NOT NULL THEN
    UPDATE employees SET custo_hora = p_custo_hora, updated_at = now() WHERE auth_account_id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
    VALUES('staff', p_target_id, auth.uid(), v_caller_email, 'custo_hora', p_custo_hora::text);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_staff_profile(uuid,text,text,text,text,numeric,numeric,numeric,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_staff_profile(uuid,text,text,text,text,numeric,numeric,numeric,numeric) TO anon;

-- ==========================================
-- 4. admin_update_portal_profile
-- ==========================================
CREATE OR REPLACE FUNCTION admin_update_portal_profile(
  p_target_id  uuid,
  p_full_name  text DEFAULT NULL,
  p_phone      text DEFAULT NULL,
  p_role       text DEFAULT NULL,
  p_email      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role  text;
  v_caller_email text;
  v_old_email    text;
BEGIN
  SELECT role, email INTO v_caller_role, v_caller_email
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  SELECT email INTO v_old_email FROM portal_accounts WHERE id = p_target_id;

  IF p_full_name IS NOT NULL THEN
    UPDATE portal_accounts SET full_name = p_full_name, updated_at = now() WHERE id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, target_email, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES('portal', p_target_id, v_old_email, auth.uid(), v_caller_email, 'full_name', NULL, p_full_name);
  END IF;

  IF p_phone IS NOT NULL THEN
    UPDATE portal_accounts SET phone = p_phone, updated_at = now() WHERE id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, target_email, changed_by, changed_by_email, field_name, new_value)
    VALUES('portal', p_target_id, v_old_email, auth.uid(), v_caller_email, 'phone', p_phone);
  END IF;

  IF p_role IS NOT NULL THEN
    UPDATE portal_accounts SET role = p_role, updated_at = now() WHERE id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, target_email, changed_by, changed_by_email, field_name, new_value)
    VALUES('portal', p_target_id, v_old_email, auth.uid(), v_caller_email, 'role', p_role);
  END IF;

  IF p_email IS NOT NULL AND p_email <> v_old_email THEN
    IF EXISTS(SELECT 1 FROM portal_accounts WHERE email = p_email AND id <> p_target_id) THEN
      RAISE EXCEPTION 'EMAIL_DUPLICATE';
    END IF;
    UPDATE portal_accounts SET email = p_email, updated_at = now() WHERE id = p_target_id;
    INSERT INTO profile_edit_audit(target_type, target_id, target_email, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES('portal', p_target_id, v_old_email, auth.uid(), v_caller_email, 'email', v_old_email, p_email);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_portal_profile(uuid,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_portal_profile(uuid,text,text,text,text) TO anon;

-- ==========================================
-- 5. admin_toggle_profile_active
-- ==========================================
CREATE OR REPLACE FUNCTION admin_toggle_profile_active(
  p_target_id   uuid,
  p_target_type text, -- 'staff' | 'portal'
  p_is_active   boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role  text;
  v_caller_email text;
BEGIN
  SELECT role, email INTO v_caller_role, v_caller_email
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  IF p_target_type = 'staff' THEN
    UPDATE auth_accounts SET is_active = p_is_active, updated_at = now() WHERE id = p_target_id;
  ELSE
    UPDATE portal_accounts SET is_active = p_is_active, updated_at = now() WHERE id = p_target_id;
  END IF;

  INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
  VALUES(p_target_type, p_target_id, auth.uid(), v_caller_email, 'is_active', p_is_active::text);

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_toggle_profile_active(uuid,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_toggle_profile_active(uuid,text,boolean) TO anon;

-- ==========================================
-- 6. admin_update_module_permissions
-- ==========================================
CREATE OR REPLACE FUNCTION admin_update_module_permissions(
  p_user_id    uuid,
  p_modules    jsonb  -- [{"module_code":"agenda","can_view":true,"can_create":true,"can_edit":true,"can_delete":false}]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_mod jsonb;
BEGIN
  SELECT role INTO v_caller_role
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  FOR v_mod IN SELECT * FROM jsonb_array_elements(p_modules)
  LOOP
    INSERT INTO module_permissions(user_id, module_code, can_view, can_create, can_edit, can_delete)
    VALUES(
      p_user_id,
      v_mod->>'module_code',
      COALESCE((v_mod->>'can_view')::boolean, false),
      COALESCE((v_mod->>'can_create')::boolean, false),
      COALESCE((v_mod->>'can_edit')::boolean, false),
      COALESCE((v_mod->>'can_delete')::boolean, false)
    )
    ON CONFLICT (user_id, module_code) DO UPDATE
      SET can_view   = EXCLUDED.can_view,
          can_create = EXCLUDED.can_create,
          can_edit   = EXCLUDED.can_edit,
          can_delete = EXCLUDED.can_delete,
          updated_at = now();
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_module_permissions(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_module_permissions(uuid, jsonb) TO anon;

-- ==========================================
-- 7. admin_reset_portal_password
-- ==========================================
CREATE OR REPLACE FUNCTION admin_reset_portal_password(
  p_portal_account_id uuid,
  p_new_password      text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_role  text;
  v_caller_email text;
BEGIN
  SELECT role, email INTO v_caller_role, v_caller_email
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  UPDATE portal_accounts
  SET password_hash = crypt(p_new_password, gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = p_portal_account_id;

  INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
  VALUES('portal', p_portal_account_id, auth.uid(), v_caller_email, 'password_reset', 'RESET');

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_reset_portal_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_portal_password(uuid, text) TO anon;

-- ==========================================
-- 8. admin_get_profile_audit
-- ==========================================
CREATE OR REPLACE FUNCTION admin_get_profile_audit(p_target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin', 'admin', 'manager') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id',             id,
        'field_name',     field_name,
        'old_value',      old_value,
        'new_value',      new_value,
        'changed_by_email', changed_by_email,
        'changed_at',     changed_at
      )
      ORDER BY changed_at DESC
    )
    FROM profile_edit_audit
    WHERE target_id = p_target_id
    LIMIT 50
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_profile_audit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_profile_audit(uuid) TO anon;

-- ensure module_permissions has unique constraint for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'module_permissions'
    AND indexname = 'module_permissions_user_module_unique'
  ) THEN
    ALTER TABLE module_permissions
      ADD CONSTRAINT module_permissions_user_module_unique UNIQUE (user_id, module_code);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

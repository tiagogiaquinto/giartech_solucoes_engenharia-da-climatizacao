/*
  # Fix customer_equipment RLS policies for authenticated users

  ## Problem
  The table `customer_equipment` only has RLS policies for the `anon` role.
  When a logged-in user tries to insert/update/delete equipment, the operation
  fails with "new row violates row-level security policy" because authenticated
  users are not covered by any policy.

  ## Fix
  Add equivalent policies for the `authenticated` role, mirroring the existing
  `anon` policies.
*/

CREATE POLICY "authenticated_select_customer_equipment"
  ON customer_equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_customer_equipment"
  ON customer_equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_customer_equipment"
  ON customer_equipment FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_customer_equipment"
  ON customer_equipment FOR DELETE
  TO authenticated
  USING (true);

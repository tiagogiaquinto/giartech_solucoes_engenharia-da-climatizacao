/*
  # Fix Customer Addresses RLS Policies

  This migration fixes the RLS policies for customer_addresses table to properly allow
  all fields including 'logradouro' to be inserted and updated.

  ## Changes
  - Drop existing restrictive policies
  - Create new permissive policies that allow all fields
*/

-- Drop existing policies
DROP POLICY IF EXISTS "anon_insert_customer_addresses" ON customer_addresses;
DROP POLICY IF EXISTS "anon_update_customer_addresses" ON customer_addresses;
DROP POLICY IF EXISTS "anon_select_customer_addresses" ON customer_addresses;
DROP POLICY IF EXISTS "anon_delete_customer_addresses" ON customer_addresses;

-- Create new permissive policies
CREATE POLICY "allow_all_insert_customer_addresses"
  ON customer_addresses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "allow_all_update_customer_addresses"
  ON customer_addresses
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all_select_customer_addresses"
  ON customer_addresses
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "allow_all_delete_customer_addresses"
  ON customer_addresses
  FOR DELETE
  TO anon, authenticated
  USING (true);
/*
  # Fix RLS Policies for Testing

  This migration temporarily relaxes RLS policies to allow development and testing
  without full Supabase authentication implementation.

  ## Changes
  1. Drop existing restrictive RLS policies
  2. Add temporary permissive policies for development
  3. Enable full CRUD operations for testing

  ## Important Notes
  - These policies are for DEVELOPMENT ONLY
  - Production deployment must use proper authentication-based policies
  - All policies use 'true' condition to allow operations during development
*/

-- Drop all existing policies for clients table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'clients') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON clients';
    END LOOP;
END $$;

-- Create development-friendly policies for clients
CREATE POLICY "Allow all SELECT on clients during development"
  ON clients FOR SELECT
  USING (true);

CREATE POLICY "Allow all INSERT on clients during development"
  ON clients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all UPDATE on clients during development"
  ON clients FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all DELETE on clients during development"
  ON clients FOR DELETE
  USING (true);

-- Drop all existing policies for contracts table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'contracts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON contracts';
    END LOOP;
END $$;

-- Create development-friendly policies for contracts
CREATE POLICY "Allow all SELECT on contracts during development"
  ON contracts FOR SELECT
  USING (true);

CREATE POLICY "Allow all INSERT on contracts during development"
  ON contracts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all UPDATE on contracts during development"
  ON contracts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all DELETE on contracts during development"
  ON contracts FOR DELETE
  USING (true);

-- Drop all existing policies for service_orders table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'service_orders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON service_orders';
    END LOOP;
END $$;

-- Create development-friendly policies for service_orders
CREATE POLICY "Allow all SELECT on service_orders during development"
  ON service_orders FOR SELECT
  USING (true);

CREATE POLICY "Allow all INSERT on service_orders during development"
  ON service_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all UPDATE on service_orders during development"
  ON service_orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all DELETE on service_orders during development"
  ON service_orders FOR DELETE
  USING (true);

-- Drop all existing policies for inventory_items table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'inventory_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON inventory_items';
    END LOOP;
END $$;

-- Create development-friendly policies for inventory_items
CREATE POLICY "Allow all SELECT on inventory_items during development"
  ON inventory_items FOR SELECT
  USING (true);

CREATE POLICY "Allow all INSERT on inventory_items during development"
  ON inventory_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all UPDATE on inventory_items during development"
  ON inventory_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all DELETE on inventory_items during development"
  ON inventory_items FOR DELETE
  USING (true);

-- Drop all existing policies for inventory_movements table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'inventory_movements') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON inventory_movements';
    END LOOP;
END $$;

-- Create development-friendly policies for inventory_movements
CREATE POLICY "Allow all SELECT on inventory_movements during development"
  ON inventory_movements FOR SELECT
  USING (true);

CREATE POLICY "Allow all INSERT on inventory_movements during development"
  ON inventory_movements FOR INSERT
  WITH CHECK (true);

-- Drop all existing policies for users table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;
END $$;

-- Create development-friendly policies for users
CREATE POLICY "Allow all SELECT on users during development"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Allow all INSERT on users during development"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all UPDATE on users during development"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all DELETE on users during development"
  ON users FOR DELETE
  USING (true);

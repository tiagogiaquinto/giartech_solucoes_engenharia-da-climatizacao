/*
  # Fix all capitalize triggers search path

  1. Changes
    - Fix search_path for all trigger_capitalize_* functions
    - Change from empty string to 'public' schema
    - Allows triggers to find capitalize functions

  2. Functions Fixed
    - trigger_capitalize_employees
    - trigger_capitalize_financial_categories
    - trigger_capitalize_materials
    - trigger_capitalize_service_catalog
    - trigger_capitalize_suppliers
    - trigger_capitalize_user_profiles

  3. Security
    - Maintains SECURITY DEFINER
    - Maintains existing RLS policies
*/

-- Fix trigger_capitalize_employees
DROP FUNCTION IF EXISTS trigger_capitalize_employees() CASCADE;

CREATE OR REPLACE FUNCTION trigger_capitalize_employees()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.name IS NOT NULL THEN
    NEW.name := capitalize_proper_name(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER capitalize_employees_trigger
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_employees();

-- Fix trigger_capitalize_financial_categories
DROP FUNCTION IF EXISTS trigger_capitalize_financial_categories() CASCADE;

CREATE OR REPLACE FUNCTION trigger_capitalize_financial_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.name IS NOT NULL THEN
    NEW.name := capitalize_first_letter(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER capitalize_financial_categories_trigger
  BEFORE INSERT OR UPDATE ON financial_categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_financial_categories();

-- Fix trigger_capitalize_materials
DROP FUNCTION IF EXISTS trigger_capitalize_materials() CASCADE;

CREATE OR REPLACE FUNCTION trigger_capitalize_materials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.name IS NOT NULL THEN
    NEW.name := capitalize_first_letter(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER capitalize_materials_trigger
  BEFORE INSERT OR UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_materials();

-- Fix trigger_capitalize_service_catalog
DROP FUNCTION IF EXISTS trigger_capitalize_service_catalog() CASCADE;

CREATE OR REPLACE FUNCTION trigger_capitalize_service_catalog()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.name IS NOT NULL THEN
    NEW.name := capitalize_first_letter(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER capitalize_service_catalog_trigger
  BEFORE INSERT OR UPDATE ON service_catalog
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_service_catalog();

-- Fix trigger_capitalize_suppliers
DROP FUNCTION IF EXISTS trigger_capitalize_suppliers() CASCADE;

CREATE OR REPLACE FUNCTION trigger_capitalize_suppliers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.nome_razao IS NOT NULL THEN
    NEW.nome_razao := capitalize_company_name(NEW.nome_razao);
  END IF;

  IF NEW.nome_fantasia IS NOT NULL THEN
    NEW.nome_fantasia := capitalize_company_name(NEW.nome_fantasia);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER capitalize_suppliers_trigger
  BEFORE INSERT OR UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_suppliers();

-- Fix trigger_capitalize_user_profiles
DROP FUNCTION IF EXISTS trigger_capitalize_user_profiles() CASCADE;

CREATE OR REPLACE FUNCTION trigger_capitalize_user_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.full_name IS NOT NULL THEN
    NEW.full_name := capitalize_proper_name(NEW.full_name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER capitalize_user_profiles_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_user_profiles();

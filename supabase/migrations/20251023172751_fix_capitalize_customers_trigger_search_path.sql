/*
  # Fix capitalize customers trigger search path

  1. Changes
    - Drop and recreate trigger_capitalize_customers function
    - Set proper search_path to 'public' instead of empty string
    - This allows the trigger to find capitalize_company_name function

  2. Security
    - Maintains existing RLS policies
    - No data modifications
*/

-- Drop and recreate the function with correct search_path
DROP FUNCTION IF EXISTS trigger_capitalize_customers() CASCADE;

CREATE OR REPLACE FUNCTION trigger_capitalize_customers()
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS capitalize_customers_trigger ON customers;

CREATE TRIGGER capitalize_customers_trigger
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_customers();

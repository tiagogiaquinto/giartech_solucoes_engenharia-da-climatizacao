/*
  # Fix Employees Trigger

  1. Changes
    - Drop old trigger that references non-existent columns
    - Create new trigger for correct columns (name, role, email, phone)
    
  2. Security
    - Maintains data integrity
*/

-- Drop old trigger
DROP TRIGGER IF EXISTS capitalize_employees_trigger ON employees;

-- Drop old function
DROP FUNCTION IF EXISTS trigger_capitalize_employees();

-- Create new function with correct field names
CREATE OR REPLACE FUNCTION trigger_capitalize_employees()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.name IS NOT NULL THEN
    NEW.name := INITCAP(NEW.name);
  END IF;
  
  IF NEW.role IS NOT NULL THEN
    NEW.role := INITCAP(NEW.role);
  END IF;

  RETURN NEW;
END;
$$;

-- Create new trigger
CREATE TRIGGER capitalize_employees_trigger
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_employees();

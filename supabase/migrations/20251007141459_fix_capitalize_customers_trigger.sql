/*
  # Fix capitalize customers trigger

  The trigger was trying to access 'logradouro' field which doesn't exist in customers table.
  This migration fixes the trigger function to only handle fields that exist.
*/

CREATE OR REPLACE FUNCTION trigger_capitalize_customers()
RETURNS TRIGGER
LANGUAGE plpgsql
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
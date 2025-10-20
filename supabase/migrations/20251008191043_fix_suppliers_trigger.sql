/*
  # Fix Suppliers Trigger Function

  1. Updates
    - Remove references to old columns (razao_social, nome_fantasia, logradouro, bairro, cidade)
    - Update to use only existing columns (name, contact_person, address)
    
  2. Changes
    - Fix trigger_capitalize_suppliers() function to match current schema
*/

-- Drop and recreate the function with correct columns
CREATE OR REPLACE FUNCTION trigger_capitalize_suppliers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NOT NULL THEN 
    NEW.name := INITCAP(NEW.name); 
  END IF;
  
  IF NEW.contact_person IS NOT NULL THEN 
    NEW.contact_person := INITCAP(NEW.contact_person); 
  END IF;
  
  IF NEW.address IS NOT NULL THEN 
    NEW.address := INITCAP(NEW.address); 
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
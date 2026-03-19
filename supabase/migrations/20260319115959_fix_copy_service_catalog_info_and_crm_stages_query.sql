/*
  # Fix two bugs blocking service order save

  ## Problem 1 - copy_service_catalog_info trigger
  The trigger reads `technical_requirements` and `scope` from `service_catalog`,
  but neither column exists there. The correct columns are `escopo_detalhado`
  and there is no technical_requirements. This causes every insert/update of
  service_order_items to fail with "column technical_requirements does not exist".

  ## Problem 2 - crm_stages column names
  The frontend queries `crm_stages(id, name, position)` but the actual column
  names are `nome` and `ordem`. This causes a 400 error when auto-creating the
  CRM opportunity linked to the new service order.

  ## Fix 1
  Recreate copy_service_catalog_info() referencing only columns that exist in
  service_catalog: name, description, escopo_detalhado.

  ## Fix 2
  No DB change needed for crm_stages — fixed in frontend code.
*/

CREATE OR REPLACE FUNCTION public.copy_service_catalog_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.service_catalog_id IS NOT NULL AND NEW.service_name IS NULL THEN
    SELECT
      name,
      description,
      COALESCE(escopo_detalhado, escopo_servico, description) as scope_val,
      COALESCE(escopo_detalhado, '') as obs_val
    INTO
      NEW.service_name,
      NEW.service_description,
      NEW.service_scope,
      NEW.observations
    FROM service_catalog
    WHERE id = NEW.service_catalog_id;
  END IF;

  RETURN NEW;
END;
$function$;

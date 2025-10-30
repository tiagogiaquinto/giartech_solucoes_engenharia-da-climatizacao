/*
  # Fix Finance Entry Triggers - Column Names
  
  1. Problem
    - Triggers are using English column names (type, amount, description, status)
    - Actual table uses Portuguese column names (tipo, valor, descricao, status)
    - This causes "record 'new' has no field 'type'" errors
  
  2. Solution
    - Recreate trigger functions with correct Portuguese column names
    - Fix: type → tipo
    - Fix: amount → valor
    - Fix: description → descricao
*/

-- Drop and recreate trigger function with correct column names
CREATE OR REPLACE FUNCTION trigger_automation_payment_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rule record;
BEGIN
  -- Check if payment was received (status changed to 'recebido' or 'pago')
  -- And it's a receita (income)
  IF (NEW.status IN ('recebido', 'pago')) 
     AND (OLD IS NULL OR OLD.status NOT IN ('recebido', 'pago')) 
     AND NEW.tipo = 'receita' THEN
    
    FOR v_rule IN
      SELECT * FROM automation_rules
      WHERE trigger_type = 'payment_received'
        AND is_active = true
      ORDER BY priority DESC
    LOOP
      PERFORM execute_automation(
        v_rule.id,
        jsonb_build_object(
          'finance_entry_id', NEW.id,
          'amount', NEW.valor,
          'description', NEW.descricao,
          'tipo', NEW.tipo,
          'status', NEW.status
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

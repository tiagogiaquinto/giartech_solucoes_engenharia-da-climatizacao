/*
  # Corrigir Trigger de Automação de Clientes

  Corrige a função trigger_automation_customer_created para usar os nomes corretos das colunas:
  - NEW.name → NEW.nome_razao
  - NEW.customer_type → NEW.tipo_pessoa
*/

-- Recriar função com campos corretos
CREATE OR REPLACE FUNCTION trigger_automation_customer_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rule record;
BEGIN
  FOR v_rule IN
    SELECT * FROM automation_rules
    WHERE trigger_type = 'customer_created'
    AND is_active = true
    ORDER BY priority DESC
  LOOP
    PERFORM execute_automation_smart(
      v_rule.id,
      jsonb_build_object(
        'customer_id', NEW.id,
        'customer_name', NEW.nome_razao,
        'customer_type', NEW.tipo_pessoa,
        'email', NEW.email,
        'created_at', NEW.created_at
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

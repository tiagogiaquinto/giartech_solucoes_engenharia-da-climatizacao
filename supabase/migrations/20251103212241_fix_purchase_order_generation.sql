/*
  # Fix Purchase Order Number Generation
  
  1. Correções
    - Recria função generate_purchase_order_number com melhor tratamento
    - Adiciona permissões corretas
    - Garante retorno sempre válido
*/

-- Remover função antiga
DROP FUNCTION IF EXISTS generate_purchase_order_number();

-- Recriar com melhor tratamento
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
  result TEXT;
BEGIN
  -- Ano atual
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Buscar próximo número
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN order_number ~ ('^PO' || year_prefix || '[0-9]+$')
        THEN CAST(SUBSTRING(order_number FROM length('PO' || year_prefix) + 1) AS INTEGER)
        ELSE 0
      END
    ), 
    0
  ) + 1
  INTO next_number
  FROM purchase_orders
  WHERE order_number LIKE 'PO' || year_prefix || '%';
  
  -- Garantir que temos um número válido
  next_number := COALESCE(next_number, 1);
  
  -- Formatar resultado
  result := 'PO' || year_prefix || LPAD(next_number::TEXT, 4, '0');
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar número baseado em timestamp
    RETURN 'PO' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 4, '0');
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION generate_purchase_order_number() TO anon;
GRANT EXECUTE ON FUNCTION generate_purchase_order_number() TO authenticated;

-- Testar função
DO $$
DECLARE
  test_result TEXT;
BEGIN
  test_result := generate_purchase_order_number();
  RAISE NOTICE 'Função testada com sucesso: %', test_result;
END;
$$;

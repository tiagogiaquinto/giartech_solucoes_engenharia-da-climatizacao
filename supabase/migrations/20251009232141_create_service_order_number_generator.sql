/*
  # Criar função para gerar número de ordem de serviço

  1. Função
    - `generate_service_order_number()` - Gera número sequencial único para OS
    - Formato: OS-AAAA-NNNN (ex: OS-2025-0001)
    - Sequencial por ano
  
  2. Segurança
    - Função SECURITY DEFINER para garantir execução
    - Acesso público para todos usuários autenticados
*/

-- Criar função para gerar número de ordem de serviço
CREATE OR REPLACE FUNCTION generate_service_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  order_number TEXT;
BEGIN
  -- Obtém o ano atual
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Busca o último número usado no ano atual
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(so.order_number FROM 'OS-' || current_year || '-(\d+)')
        AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM service_orders so
  WHERE so.order_number LIKE 'OS-' || current_year || '-%';
  
  -- Formata o número com zeros à esquerda (4 dígitos)
  order_number := 'OS-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN order_number;
END;
$$;

-- Permitir que todos usuários executem a função
GRANT EXECUTE ON FUNCTION generate_service_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_service_order_number() TO anon;
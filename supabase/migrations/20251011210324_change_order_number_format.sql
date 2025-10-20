/*
  # Alterar formato de numeração de Ordem de Serviço

  1. Alterações
    - Mudar formato de "OS-2025-0001" para "0001/2025"
    - Mantém sequencial por ano
    - Formato mais limpo e fácil de ler

  2. Segurança
    - Mantém SECURITY DEFINER
    - Mantém permissões existentes
*/

-- Recriar função para gerar número de ordem de serviço no formato 0001/2025
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
  -- Aceita tanto formato antigo (OS-2025-0001) quanto novo (0001/2025)
  SELECT COALESCE(
    MAX(
      CAST(
        CASE
          WHEN so.order_number LIKE 'OS-%' THEN
            SUBSTRING(so.order_number FROM 'OS-' || current_year || '-(\d+)')
          WHEN so.order_number LIKE '%/%' THEN
            SUBSTRING(so.order_number FROM '(\d+)/' || current_year)
          ELSE '0'
        END
        AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM service_orders so
  WHERE so.order_number LIKE 'OS-' || current_year || '-%'
     OR so.order_number LIKE '%/' || current_year;

  -- Formata o número no novo formato: 0001/2025
  order_number := LPAD(next_number::TEXT, 4, '0') || '/' || current_year;

  RETURN order_number;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION generate_service_order_number() IS 'Gera número sequencial para ordem de serviço no formato 0001/2025';
/*
  # Corrigir função generate_service_order_number

  1. Alterações
    - Adiciona alias da tabela 'so' para evitar ambiguidade
    - Corrige erro "column reference order_number is ambiguous"
  
  2. Segurança
    - Mantém SECURITY DEFINER
    - Mantém permissões existentes
*/

-- Recriar função para gerar número de ordem de serviço com alias correto
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
  
  -- Busca o último número usado no ano atual com alias para evitar ambiguidade
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
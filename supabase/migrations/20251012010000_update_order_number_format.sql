/*
  # Atualizar formato de numeração de ordens de serviço

  1. Mudanças
    - Formato ANTIGO: OS-2025-0001
    - Formato NOVO: 01/2025 (sequencial simples por ano)

  2. Nova Função
    - `generate_service_order_number()` - Gera número no formato NN/AAAA
    - Sequencial por ano, reinicia a cada ano
    - Exemplo: 01/2025, 02/2025, 03/2025...

  3. Segurança
    - Função SECURITY DEFINER
    - Acesso público para usuários autenticados
*/

-- Remover função antiga
DROP FUNCTION IF EXISTS generate_service_order_number();

-- Criar nova função com formato simplificado NN/AAAA
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
  -- Formato: NN/AAAA (ex: 01/2025, 02/2025)
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(so.order_number FROM '^(\d+)/' || current_year)
        AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM service_orders so
  WHERE so.order_number LIKE '%/' || current_year;

  -- Formata o número: NN/AAAA (com 2 dígitos no número)
  order_number := LPAD(next_number::TEXT, 2, '0') || '/' || current_year;

  RETURN order_number;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION generate_service_order_number() IS
'Gera número sequencial para ordem de serviço no formato NN/AAAA (ex: 01/2025, 02/2025)';

-- Permitir que todos usuários executem a função
GRANT EXECUTE ON FUNCTION generate_service_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_service_order_number() TO anon;

-- Atualizar ordens existentes para o novo formato (opcional, comentado por segurança)
-- Para manter histórico, não vamos alterar as ordens antigas
-- Se quiser converter todas:
-- UPDATE service_orders
-- SET order_number = LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 2, '0') || '/' || EXTRACT(YEAR FROM created_at)::TEXT
-- WHERE order_number LIKE 'OS-%';

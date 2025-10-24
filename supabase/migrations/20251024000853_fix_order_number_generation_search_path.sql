/*
  # Correção da Geração Automática de Número de OS

  1. Problema Identificado
    - Função set_service_order_number() com search_path vazio
    - Não consegue encontrar generate_next_order_number()
    - Erro: "No function matches the given name"

  2. Solução
    - Recriar função com search_path correto
    - Usar schema-qualified calls (public.função)
    - Garantir que a função seja encontrada

  3. Impacto
    - Geração automática de número de OS funcionará
    - Trigger executará sem erros
    - Sistema de numeração sequencial OK
*/

-- Recriar a função set_service_order_number com chamada qualificada
CREATE OR REPLACE FUNCTION set_service_order_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Se order_number não foi fornecido ou está vazio, gerar automaticamente
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    -- Usar chamada schema-qualified
    NEW.order_number := public.generate_next_order_number();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar a função generate_next_order_number também com search_path público
CREATE OR REPLACE FUNCTION generate_next_order_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  last_number INTEGER;
  next_number INTEGER;
BEGIN
  -- Obter ano atual
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Buscar o último número do ano atual
  SELECT COALESCE(
    MAX(
      CAST(
        SPLIT_PART(order_number, '/', 1) AS INTEGER
      )
    ), 0
  )
  INTO last_number
  FROM public.service_orders
  WHERE order_number LIKE '%/' || current_year;
  
  -- Incrementar
  next_number := last_number + 1;
  
  -- Retornar no formato: NÚMERO/ANO (com zero à esquerda se necessário)
  RETURN LPAD(next_number::TEXT, 2, '0') || '/' || current_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS trigger_set_service_order_number ON service_orders;

CREATE TRIGGER trigger_set_service_order_number
  BEFORE INSERT ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_service_order_number();

-- Testar a função
DO $$
DECLARE
  test_number TEXT;
BEGIN
  test_number := public.generate_next_order_number();
  RAISE NOTICE 'Próximo número de OS será: %', test_number;
END $$;

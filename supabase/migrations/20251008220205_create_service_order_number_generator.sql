/*
  # Sistema de Numeração Sequencial para Ordens de Serviço
  
  Implementa numeração automática no formato: 01/2025, 02/2025, etc.
  
  ## Funcionalidades
  
  1. Função para gerar próximo número
     - Busca o último número do ano atual
     - Incrementa sequencialmente
     - Retorna formato: NÚMERO/ANO
  
  2. Trigger automático
     - Atribui número ao criar nova OS
     - Executa antes do INSERT
     - Garante sequência correta
  
  ## Formato
  
  - Sequência reinicia a cada ano
  - Números com zero à esquerda (01, 02, 03...)
  - Exemplo: 01/2025, 02/2025, 150/2025
*/

-- Criar função para gerar o próximo número da OS
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
  FROM service_orders
  WHERE order_number LIKE '%/' || current_year;
  
  -- Incrementar
  next_number := last_number + 1;
  
  -- Retornar no formato: NÚMERO/ANO (com zero à esquerda se necessário)
  RETURN LPAD(next_number::TEXT, 2, '0') || '/' || current_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atribuir automaticamente o número
CREATE OR REPLACE FUNCTION set_service_order_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Se order_number não foi fornecido ou está vazio, gerar automaticamente
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_next_order_number();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_set_service_order_number ON service_orders;

-- Criar trigger
CREATE TRIGGER trigger_set_service_order_number
  BEFORE INSERT ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_service_order_number();

-- Atualizar OSs existentes que não têm numeração no formato correto
DO $$
DECLARE
  current_year TEXT;
  counter INTEGER := 1;
  ordem RECORD;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Atualizar apenas OSs que não seguem o padrão NÚMERO/ANO
  FOR ordem IN 
    SELECT id, order_number, created_at
    FROM service_orders
    WHERE order_number NOT LIKE '%/%'
       OR order_number !~ '^\d+/\d{4}$'
    ORDER BY created_at ASC
  LOOP
    UPDATE service_orders
    SET order_number = LPAD(counter::TEXT, 2, '0') || '/' || EXTRACT(YEAR FROM ordem.created_at)::TEXT
    WHERE id = ordem.id;
    
    counter := counter + 1;
  END LOOP;
END $$;

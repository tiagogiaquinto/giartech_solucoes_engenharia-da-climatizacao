/*
  # Corrigir campos de cliente em service_orders

  1. Alterações
    - Torna client_name opcional (nullable)
    - Torna client_phone opcional (já é)
    - Torna client_email opcional (já é)
    - Adiciona trigger para preencher automaticamente do customer
  
  2. Notas
    - Se customer_id existir, preenche automaticamente
    - Evita erro de null constraint
*/

-- Tornar client_name opcional
ALTER TABLE service_orders 
ALTER COLUMN client_name DROP NOT NULL;

-- Criar função para preencher dados do cliente automaticamente
CREATE OR REPLACE FUNCTION fill_service_order_client_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Se customer_id foi fornecido, buscar dados do cliente
  IF NEW.customer_id IS NOT NULL THEN
    SELECT 
      COALESCE(nome_razao, nome_fantasia, 'Cliente'),
      COALESCE(telefone, celular),
      email
    INTO 
      NEW.client_name,
      NEW.client_phone,
      NEW.client_email
    FROM customers
    WHERE id = NEW.customer_id;
  END IF;
  
  -- Se ainda não tem client_name, usar valor padrão
  IF NEW.client_name IS NULL OR NEW.client_name = '' THEN
    NEW.client_name := 'Cliente Não Identificado';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS service_order_fill_client_info ON service_orders;
CREATE TRIGGER service_order_fill_client_info
  BEFORE INSERT OR UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION fill_service_order_client_info();

-- Atualizar registros existentes sem client_name
UPDATE service_orders 
SET client_name = 'Cliente Não Identificado'
WHERE client_name IS NULL OR client_name = '';

-- Comentários
COMMENT ON COLUMN service_orders.client_name IS 'Nome do cliente (preenchido automaticamente do customer)';
COMMENT ON FUNCTION fill_service_order_client_info IS 'Preenche automaticamente dados do cliente na OS';

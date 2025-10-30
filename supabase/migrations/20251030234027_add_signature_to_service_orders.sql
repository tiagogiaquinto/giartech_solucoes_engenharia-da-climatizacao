/*
  # Adicionar Assinatura Digital às OSs

  1. Novos Campos
    - customer_signature (text) - Imagem da assinatura em base64
    - signature_date (timestamptz) - Data/hora da assinatura
    - signed_by_name (text) - Nome de quem assinou
    - signature_ip (text) - IP de onde foi assinado
    
  2. Funcionalidades
    - Armazenar assinatura digital
    - Timestamp de assinatura
    - Rastreamento de quem assinou
*/

-- Adicionar colunas de assinatura
ALTER TABLE service_orders
ADD COLUMN IF NOT EXISTS customer_signature text,
ADD COLUMN IF NOT EXISTS signature_date timestamptz,
ADD COLUMN IF NOT EXISTS signed_by_name text,
ADD COLUMN IF NOT EXISTS signature_ip text,
ADD COLUMN IF NOT EXISTS signature_location text;

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_service_orders_signature ON service_orders(signature_date) WHERE signature_date IS NOT NULL;

-- Função para registrar assinatura
CREATE OR REPLACE FUNCTION register_signature(
  p_order_id uuid,
  p_signature text,
  p_signed_by text DEFAULT NULL,
  p_ip text DEFAULT NULL,
  p_location text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE service_orders
  SET 
    customer_signature = p_signature,
    signature_date = now(),
    signed_by_name = p_signed_by,
    signature_ip = p_ip,
    signature_location = p_location,
    updated_at = now()
  WHERE id = p_order_id;
  
  -- Criar notificação
  PERFORM add_notification(
    'Assinatura Registrada',
    'OS #' || (SELECT order_number FROM service_orders WHERE id = p_order_id) || ' foi assinada pelo cliente',
    'success',
    'os',
    'service_order',
    p_order_id,
    '/service-orders/' || p_order_id,
    'medium'
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View de OSs assinadas
CREATE OR REPLACE VIEW v_signed_service_orders AS
SELECT 
  id,
  order_number,
  client_name,
  status,
  total_amount,
  signature_date,
  signed_by_name,
  signature_ip,
  created_at
FROM service_orders
WHERE customer_signature IS NOT NULL
ORDER BY signature_date DESC;

COMMENT ON COLUMN service_orders.customer_signature IS 'Assinatura digital do cliente em base64';
COMMENT ON COLUMN service_orders.signature_date IS 'Data e hora da assinatura';
COMMENT ON COLUMN service_orders.signed_by_name IS 'Nome de quem assinou';
COMMENT ON FUNCTION register_signature IS 'Registra assinatura digital na OS';
COMMENT ON VIEW v_signed_service_orders IS 'Lista de OSs assinadas pelos clientes';

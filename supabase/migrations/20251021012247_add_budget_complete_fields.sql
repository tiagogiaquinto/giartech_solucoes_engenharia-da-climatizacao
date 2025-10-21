/*
  # Adicionar campos completos para orçamentos modelo Giartech
  
  1. Novos Campos em service_orders
    - client_company_name (text) - Nome da empresa do cliente
    - client_cnpj (text) - CNPJ do cliente
    - client_cpf (text) - CPF do cliente
    - client_address (text) - Endereço completo do cliente
    - client_city (text) - Cidade do cliente
    - client_state (text) - Estado do cliente
    - client_cep (text) - CEP do cliente
    - title (text) - Título do orçamento/OS
    - brand (text) - Marca do equipamento
    - model (text) - Modelo do equipamento
    - equipment (text) - Tipo de aparelho
    - payment_methods (text) - Métodos de pagamento aceitos
    - payment_pix (text) - Chave PIX
    - payment_bank (text) - Nome do banco
    - payment_agency (text) - Agência bancária
    - payment_account (text) - Número da conta
    - payment_account_type (text) - Tipo de conta
    - payment_holder (text) - Titular da conta
    - additional_info (text) - Informações adicionais
    
  2. Security
    - Mantém RLS existente
*/

-- Adicionar campos de cliente
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'client_company_name'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN client_company_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'client_cnpj'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN client_cnpj TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'client_cpf'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN client_cpf TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'client_address'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN client_address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'client_city'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN client_city TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'client_state'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN client_state TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'client_cep'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN client_cep TEXT;
  END IF;

  -- Adicionar campos de informações básicas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'title'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN title TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'brand'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN brand TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'model'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN model TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'equipment'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN equipment TEXT;
  END IF;

  -- Adicionar campos de pagamento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'payment_methods'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_methods TEXT DEFAULT 'Transferência bancária, dinheiro, cartão de crédito, cartão de débito ou pix';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'payment_pix'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_pix TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'payment_bank'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_bank TEXT DEFAULT 'Cora';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'payment_agency'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_agency TEXT DEFAULT '0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'payment_account'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_account TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'payment_account_type'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_account_type TEXT DEFAULT 'Corrente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'payment_holder'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_holder TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'additional_info'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN additional_info TEXT;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_service_orders_client_cnpj ON service_orders(client_cnpj);
CREATE INDEX IF NOT EXISTS idx_service_orders_client_cpf ON service_orders(client_cpf);
CREATE INDEX IF NOT EXISTS idx_service_orders_order_number ON service_orders(order_number);

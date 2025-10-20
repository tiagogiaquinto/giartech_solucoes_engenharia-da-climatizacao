/*
  # Adicionar Campos Completos para Ordem de Serviço
  
  ## Novos Campos Adicionados
  
  ### 1. Pagamento e Financeiro
    - `payment_method` (text) - Forma de pagamento (dinheiro, pix, cartão, etc)
    - `payment_installments` (integer) - Número de parcelas (1 a 12)
    - `bank_account_id` (uuid) - Referência para conta bancária utilizada
    - `desconto_percentual` (numeric) - Desconto em porcentagem
    - `desconto_valor` (numeric) - Desconto em valor absoluto
  
  ### 2. Garantia
    - `warranty_period` (integer) - Período de garantia (número)
    - `warranty_type` (text) - Tipo do período (days, months, years)
    - `warranty_end_date` (date) - Data calculada do fim da garantia
  
  ### 3. Contrato
    - `contract_template_id` (uuid) - Referência para template de contrato
    - `contract_notes` (text) - Observações específicas do contrato
  
  ### 4. Dados Adicionais
    - `subtotal` (numeric) - Subtotal antes do desconto
    - `discount_amount` (numeric) - Valor do desconto aplicado
    - `final_total` (numeric) - Total final após desconto
  
  ## Observações
  - Todos os campos são opcionais (nullable)
  - Valores padrão adequados onde necessário
  - Campos existentes preservados
*/

-- Adicionar campos de pagamento
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_method TEXT DEFAULT 'dinheiro';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'payment_installments'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_installments INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'bank_account_id'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN bank_account_id UUID REFERENCES bank_accounts(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'desconto_percentual'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN desconto_percentual NUMERIC(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'desconto_valor'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN desconto_valor NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- Adicionar campos de garantia
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'warranty_period'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN warranty_period INTEGER DEFAULT 90;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'warranty_type'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN warranty_type TEXT DEFAULT 'days';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'warranty_end_date'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN warranty_end_date DATE;
  END IF;
END $$;

-- Adicionar campos de contrato
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'contract_template_id'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN contract_template_id UUID REFERENCES contract_templates(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'contract_notes'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN contract_notes TEXT;
  END IF;
END $$;

-- Adicionar campos financeiros calculados
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN subtotal NUMERIC(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN discount_amount NUMERIC(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'final_total'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN final_total NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_service_orders_payment_method ON service_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_service_orders_bank_account ON service_orders(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_contract_template ON service_orders(contract_template_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_warranty_end ON service_orders(warranty_end_date);

-- Comentários para documentação
COMMENT ON COLUMN service_orders.payment_method IS 'Forma de pagamento: dinheiro, pix, debito, credito, transferencia, boleto, cheque';
COMMENT ON COLUMN service_orders.payment_installments IS 'Número de parcelas: 1 (à vista) até 12';
COMMENT ON COLUMN service_orders.warranty_period IS 'Período de garantia em número inteiro';
COMMENT ON COLUMN service_orders.warranty_type IS 'Tipo do período: days, months ou years';
COMMENT ON COLUMN service_orders.warranty_end_date IS 'Data calculada do fim da garantia';
COMMENT ON COLUMN service_orders.desconto_percentual IS 'Desconto em porcentagem (0-100)';
COMMENT ON COLUMN service_orders.desconto_valor IS 'Desconto em valor absoluto (R$)';

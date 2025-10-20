/*
  # Adicionar campos de Contrato na tabela service_orders

  1. Novos Campos
    - `contract_text` (TEXT) - Texto completo do contrato
    - `contract_clauses` (TEXT) - Cláusulas específicas
    - `warranty_terms` (TEXT) - Termos de garantia
    - `payment_conditions` (TEXT) - Condições de pagamento
    - `bank_details` (TEXT) - Dados bancários para pagamento
    - `contract_generated_at` (TIMESTAMPTZ) - Data de geração do contrato
  
  2. Objetivo
    - Permitir criação e armazenamento de contratos personalizados
    - Facilitar geração de PDF de contratos
    - Manter histórico de termos acordados
*/

-- Adicionar colunas de contrato
DO $$
BEGIN
  -- contract_text
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'contract_text'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN contract_text TEXT;
  END IF;

  -- contract_clauses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'contract_clauses'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN contract_clauses TEXT;
  END IF;

  -- warranty_terms
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'warranty_terms'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN warranty_terms TEXT;
  END IF;

  -- payment_conditions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'payment_conditions'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN payment_conditions TEXT;
  END IF;

  -- bank_details
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'bank_details'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN bank_details TEXT;
  END IF;

  -- contract_generated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'contract_generated_at'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN contract_generated_at TIMESTAMPTZ;
  END IF;
END $$;
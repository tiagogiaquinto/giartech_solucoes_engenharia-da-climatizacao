/*
  # Adicionar Campos Extras em Service Orders
  
  ## Novos Campos
  
  1. show_value (boolean)
     - Define se os valores devem ser exibidos
     - Default: true
  
  2. total_estimated_duration (integer)
     - Duração total estimada em minutos
     - Calculado automaticamente
  
  3. generated_contract (text)
     - ID ou referência do contrato gerado
     - Opcional
  
  ## Segurança
  - Sem mudanças nas políticas RLS existentes
*/

-- Adicionar campos extras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'show_value'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN show_value boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'total_estimated_duration'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN total_estimated_duration integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'generated_contract'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN generated_contract text;
  END IF;
END $$;

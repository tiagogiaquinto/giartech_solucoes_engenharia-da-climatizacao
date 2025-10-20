/*
  # Adicionar campo de Ferramentas Especiais (Locação) na tabela service_orders

  1. Modificação
    - Adiciona campo `special_tools` do tipo text na tabela `service_orders`
    - Campo permite armazenar descrição de ferramentas e equipamentos especiais necessários para a OS
    - Campo opcional (nullable)
  
  2. Objetivo
    - Permitir que usuários listem ferramentas especiais que precisam ser locadas
    - Facilitar o planejamento de equipamentos especiais (guindastes, plataformas, geradores, etc.)
    - Melhorar o controle de custos de locação de equipamentos
*/

-- Adicionar coluna special_tools se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'special_tools'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN special_tools TEXT;
  END IF;
END $$;
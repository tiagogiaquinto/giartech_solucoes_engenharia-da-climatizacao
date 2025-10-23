/*
  # Adicionar campo escopo_detalhado em service_order_items

  1. Altera Tabela
    - Adiciona coluna `escopo_detalhado` do tipo text
    - Permite descrição detalhada do escopo de cada item de serviço

  2. Segurança
    - Campo opcional (nullable)
    - Sem impacto em dados existentes
*/

-- Adicionar campo escopo_detalhado em service_order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_items' AND column_name = 'escopo_detalhado'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN escopo_detalhado text;
  END IF;
END $$;
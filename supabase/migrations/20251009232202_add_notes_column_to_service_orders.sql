/*
  # Adicionar coluna notes à tabela service_orders

  1. Modificação
    - Adiciona coluna `notes` (TEXT) para observações gerais da OS
    - Campo opcional para anotações durante a negociação
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'notes'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN notes TEXT;
  END IF;
END $$;
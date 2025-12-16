/*
  # Adicionar campo WhatsApp à tabela customers
  
  1. Changes
    - Adiciona coluna `whatsapp` à tabela `customers`
    - Permite armazenar número de WhatsApp separadamente do telefone/celular
  
  2. Notes
    - Campo opcional (pode ser NULL)
    - Facilita integração com WhatsApp
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE customers ADD COLUMN whatsapp text;
  END IF;
END $$;

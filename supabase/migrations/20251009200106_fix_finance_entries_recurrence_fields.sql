/*
  # Fix Finance Entries - Add Recurrence Fields

  1. Changes
    - Add recurrence fields to finance_entries table
    - Add data_fim_recorrencia (end date for recurring entries)
    - Add intervalo_recorrencia (interval: daily, weekly, monthly, yearly)
    - Add numero_parcelas (number of installments)
    
  2. Notes
    - All fields are optional (nullable)
    - Used for recurring transactions and installments
*/

-- Add recurrence fields if they don't exist
DO $$
BEGIN
  -- Add data_fim_recorrencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_entries' AND column_name = 'data_fim_recorrencia'
  ) THEN
    ALTER TABLE finance_entries ADD COLUMN data_fim_recorrencia date;
  END IF;

  -- Add intervalo_recorrencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_entries' AND column_name = 'intervalo_recorrencia'
  ) THEN
    ALTER TABLE finance_entries ADD COLUMN intervalo_recorrencia text;
  END IF;

  -- Add numero_parcelas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_entries' AND column_name = 'numero_parcelas'
  ) THEN
    ALTER TABLE finance_entries ADD COLUMN numero_parcelas integer;
  END IF;
END $$;

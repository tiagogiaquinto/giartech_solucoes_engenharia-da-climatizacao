/*
  # Add Recurrence Fields to Finance Entries

  ## Description
  Adds fields to support recurring/provisioned financial entries (monthly, bimonthly, etc.)

  ## New Fields
  - `recorrente`: Boolean to indicate if entry is recurring
  - `frequencia_recorrencia`: Frequency of recurrence (weekly, biweekly, monthly, etc.)
  - `data_fim_recorrencia`: End date for recurrence
  - `parent_entry_id`: Link to original entry for auto-generated recurrences

  ## Changes
  1. Add new columns to finance_entries table
  2. Create index for recurring entries
  3. Add check constraint for frequency values
*/

-- Add recurrence fields
ALTER TABLE finance_entries
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT,
ADD COLUMN IF NOT EXISTS data_fim_recorrencia DATE,
ADD COLUMN IF NOT EXISTS parent_entry_id UUID REFERENCES finance_entries(id) ON DELETE CASCADE;

-- Add check constraint for valid frequencies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'finance_entries_frequencia_check'
  ) THEN
    ALTER TABLE finance_entries
    ADD CONSTRAINT finance_entries_frequencia_check
    CHECK (
      frequencia_recorrencia IS NULL OR
      frequencia_recorrencia IN ('semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual')
    );
  END IF;
END $$;

-- Create index for recurring entries
CREATE INDEX IF NOT EXISTS idx_finance_entries_recorrente
ON finance_entries(recorrente)
WHERE recorrente = true;

-- Create index for parent entries
CREATE INDEX IF NOT EXISTS idx_finance_entries_parent
ON finance_entries(parent_entry_id);

-- Add comment
COMMENT ON COLUMN finance_entries.recorrente IS 'Indica se o lançamento é recorrente';
COMMENT ON COLUMN finance_entries.frequencia_recorrencia IS 'Frequência da recorrência: semanal, quinzenal, mensal, bimestral, trimestral, semestral, anual';
COMMENT ON COLUMN finance_entries.data_fim_recorrencia IS 'Data de término da recorrência';
COMMENT ON COLUMN finance_entries.parent_entry_id IS 'ID do lançamento original (para lançamentos gerados automaticamente)';

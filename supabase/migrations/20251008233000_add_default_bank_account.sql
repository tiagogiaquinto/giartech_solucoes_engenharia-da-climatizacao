/*
  # Add Default Bank Account Feature

  ## Description
  Adds default account functionality to bank_accounts table

  ## Changes
  1. Add is_default field to bank_accounts
  2. Create trigger to ensure only one default account
  3. Create function to set default account
*/

-- Add is_default field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_accounts' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE bank_accounts ADD COLUMN is_default BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_bank_accounts_default ON bank_accounts(is_default) WHERE is_default = true;

-- Function to ensure only one default account
CREATE OR REPLACE FUNCTION ensure_single_default_bank_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE bank_accounts
    SET is_default = false
    WHERE is_default = true
      AND id != NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_ensure_single_default_bank_account ON bank_accounts;

CREATE TRIGGER trigger_ensure_single_default_bank_account
  BEFORE INSERT OR UPDATE ON bank_accounts
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_bank_account();

-- Set first account as default if none exists
DO $$
DECLARE
  has_default BOOLEAN;
  first_account_id UUID;
BEGIN
  SELECT EXISTS(SELECT 1 FROM bank_accounts WHERE is_default = true) INTO has_default;

  IF NOT has_default THEN
    SELECT id INTO first_account_id FROM bank_accounts LIMIT 1;

    IF first_account_id IS NOT NULL THEN
      UPDATE bank_accounts SET is_default = true WHERE id = first_account_id;
    END IF;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN bank_accounts.is_default IS 'Indica se esta é a conta padrão para lançamentos financeiros';
COMMENT ON FUNCTION ensure_single_default_bank_account IS 'Garante que apenas uma conta bancária seja marcada como padrão';

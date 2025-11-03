/*
  # Fix 'total' Column Issue

  ## Problem
  - Error: "Could not find the 'total' column of 'service_orders' in the schema cache"
  - Some code or cache is expecting a 'total' column that doesn't exist
  
  ## Solution
  - Create a computed column 'total' that aliases 'total_value'
  - This ensures backward compatibility
  
  ## Changes
  - Add generated column 'total' as alias to 'total_value'
*/

-- Add total as a generated column that mirrors total_value
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'total'
  ) THEN
    ALTER TABLE service_orders 
    ADD COLUMN total numeric GENERATED ALWAYS AS (COALESCE(total_value, final_total, 0)) STORED;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN service_orders.total IS 'Computed column for backward compatibility, mirrors total_value';

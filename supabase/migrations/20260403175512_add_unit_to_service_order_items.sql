/*
  # Add unit column to service_order_items

  ## Summary
  Adds the missing `unit` column to the `service_order_items` table.
  This column stores the unit of measure for each item (e.g., UN, KG, M, HR).

  ## Changes
  - `service_order_items`: added `unit` text column with default 'UN'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_items' AND column_name = 'unit'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN unit text DEFAULT 'UN';
  END IF;
END $$;

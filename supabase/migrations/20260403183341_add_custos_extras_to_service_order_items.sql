/*
  # Add custos_extras column to service_order_items

  1. Changes
    - `service_order_items`: add `custos_extras` column (jsonb) to store ad-hoc extra costs per item
      Each entry: { id, descricao, valor }

  2. Notes
    - Stored as JSONB array for flexibility; no separate table needed for this data.
    - Default is empty array.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_items' AND column_name = 'custos_extras'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN custos_extras jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

/*
  # Fix Inventory Supplier Field
  
  1. Changes
    - Remove supplier_id (UUID) column from inventory_items
    - Add supplier_name (text) column to inventory_items
    - This allows users to enter supplier name directly without requiring a supplier_id
  
  2. Security
    - No RLS changes needed
*/

-- Remove the UUID supplier_id column
ALTER TABLE inventory_items DROP COLUMN IF EXISTS supplier_id;

-- Add text supplier_name column
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS supplier_name text;

/*
  # Add Supplier and Category IDs to Finance Entries

  1. Changes
    - Add supplier_id column to finance_entries table
    - Add category_id column to link to financial_categories table
    - Add subcategory_id column for detailed categorization
    - Keep text fields for backward compatibility
    - Add foreign key constraints
    
  2. Notes
    - All new fields are optional (nullable)
    - Allows linking to suppliers for better tracking
    - Enables hierarchical categorization (category + subcategory)
    - Text fields remain for flexibility
*/

-- Add supplier_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_entries' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE finance_entries ADD COLUMN supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add category_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_entries' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE finance_entries ADD COLUMN category_id uuid REFERENCES financial_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add subcategory_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_entries' AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE finance_entries ADD COLUMN subcategory_id uuid REFERENCES financial_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_finance_entries_supplier ON finance_entries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_category ON finance_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_subcategory ON finance_entries(subcategory_id);

-- Add comment to explain the structure
COMMENT ON COLUMN finance_entries.category_id IS 'Link to main category in financial_categories table';
COMMENT ON COLUMN finance_entries.subcategory_id IS 'Link to subcategory in financial_categories table (where parent_id IS NOT NULL)';
COMMENT ON COLUMN finance_entries.supplier_id IS 'Link to supplier for expense tracking';

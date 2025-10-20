/*
  # Fix Employees and Materials Schema
  
  1. Employees Table
    - Add missing `salary` column (decimal for monthly salary)
  
  2. Materials Table
    - Add missing `unit_cost` column (cost price)
    
  3. Notes
    - These fields are required by Financial Integration dashboard
    - All changes use IF NOT EXISTS for safety
*/

-- Add salary column to employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'salary'
  ) THEN
    ALTER TABLE employees ADD COLUMN salary NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add unit_cost column to materials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' AND column_name = 'unit_cost'
  ) THEN
    ALTER TABLE materials ADD COLUMN unit_cost NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN employees.salary IS 'Monthly salary amount';
COMMENT ON COLUMN materials.unit_cost IS 'Cost price per unit';
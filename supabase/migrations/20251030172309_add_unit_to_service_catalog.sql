/*
  # Add unit column to service_catalog
  
  1. Problem
    - Frontend trying to save 'unit' field but column doesn't exist
    - Error: "Could not find the 'unit' column of 'service_catalog'"
  
  2. Solution
    - Add unit column to service_catalog table
    - Set default value to 'un' (unidade)
*/

-- Add unit column to service_catalog
ALTER TABLE service_catalog 
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'un';

-- Add comment
COMMENT ON COLUMN service_catalog.unit IS 'Unidade de medida do serviço (un, h, m², etc)';

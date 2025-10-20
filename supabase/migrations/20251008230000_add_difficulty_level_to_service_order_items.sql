/*
  # Add Difficulty Level to Service Order Items

  ## Description
  Adds difficulty level field to service order items with automatic price adjustment

  ## New Fields
  - `difficulty_level`: Integer (1-3) representing service complexity
  - `difficulty_multiplier`: Decimal multiplier applied to base price
  - `base_unit_price`: Original price before difficulty adjustment

  ## Difficulty Levels and Multipliers
  - Level 1 (Easy): +0% (multiplier 1.0)
  - Level 2 (Medium): +20% (multiplier 1.2)
  - Level 3 (Hard): +50% (multiplier 1.5)

  ## Changes
  1. Add difficulty fields to service_order_items
  2. Add check constraint for valid difficulty levels
  3. Update existing records with default level 1
*/

-- Add difficulty level fields
ALTER TABLE service_order_items
ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS difficulty_multiplier NUMERIC(4,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS base_unit_price NUMERIC(10,2);

-- Add check constraint for valid difficulty levels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'service_order_items_difficulty_check'
  ) THEN
    ALTER TABLE service_order_items
    ADD CONSTRAINT service_order_items_difficulty_check
    CHECK (difficulty_level BETWEEN 1 AND 3);
  END IF;
END $$;

-- Add check constraint for valid multipliers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'service_order_items_multiplier_check'
  ) THEN
    ALTER TABLE service_order_items
    ADD CONSTRAINT service_order_items_multiplier_check
    CHECK (difficulty_multiplier >= 1.0 AND difficulty_multiplier <= 2.0);
  END IF;
END $$;

-- Update existing records - set base_unit_price same as unit_price if not set
UPDATE service_order_items
SET base_unit_price = unit_price
WHERE base_unit_price IS NULL;

-- Create index for difficulty level queries
CREATE INDEX IF NOT EXISTS idx_service_order_items_difficulty
ON service_order_items(difficulty_level);

-- Add comments
COMMENT ON COLUMN service_order_items.difficulty_level IS 'Nível de dificuldade do serviço: 1=Fácil, 2=Médio, 3=Difícil';
COMMENT ON COLUMN service_order_items.difficulty_multiplier IS 'Multiplicador aplicado ao preço base: 1.0 (fácil), 1.2 (médio), 1.5 (difícil)';
COMMENT ON COLUMN service_order_items.base_unit_price IS 'Preço unitário base antes do ajuste de dificuldade';

-- Create function to calculate difficulty multiplier
CREATE OR REPLACE FUNCTION calculate_difficulty_multiplier(level INTEGER)
RETURNS NUMERIC(4,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE level
    WHEN 1 THEN 1.0  -- Easy: +0%
    WHEN 2 THEN 1.2  -- Medium: +20%
    WHEN 3 THEN 1.5  -- Hard: +50%
    ELSE 1.0
  END;
END;
$$;

COMMENT ON FUNCTION calculate_difficulty_multiplier IS 'Calcula o multiplicador baseado no nível de dificuldade';

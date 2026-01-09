/*
  # Corrigir estrutura lead_capture_campaigns

  1. Remover constraints temporariamente
  2. Adicionar colunas
  3. Recriar constraints
*/

-- Adicionar colunas sem constraints primeiro
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS search_type text;
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS search_keywords text[] DEFAULT ARRAY[]::text[];
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS search_region text;
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS search_radius_km numeric DEFAULT 10;
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS target_business_types text[] DEFAULT ARRAY[]::text[];
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS cep_ranges jsonb DEFAULT '[]'::jsonb;
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS auto_capture_enabled boolean DEFAULT false;
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS capture_frequency text DEFAULT 'weekly';
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS last_capture_at timestamptz;
ALTER TABLE lead_capture_campaigns ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Atualizar valores
UPDATE lead_capture_campaigns SET name = nome WHERE name IS NULL;
UPDATE lead_capture_campaigns SET description = descricao WHERE description IS NULL;
UPDATE lead_capture_campaigns SET status = CASE WHEN is_active THEN 'ativo' ELSE 'pausado' END WHERE status IS NULL;
UPDATE lead_capture_campaigns SET search_type = CASE 
  WHEN source_type = 'cnpj' THEN 'cep_region'
  WHEN source_type IN ('google_maps', 'cep_region', 'manual') THEN source_type
  ELSE 'google_maps'
END WHERE search_type IS NULL;
UPDATE lead_capture_campaigns SET auto_capture_enabled = is_active WHERE auto_capture_enabled IS NULL;
UPDATE lead_capture_campaigns SET last_capture_at = last_run WHERE last_capture_at IS NULL;

-- Garantir NOT NULL
ALTER TABLE lead_capture_campaigns ALTER COLUMN name SET NOT NULL;
ALTER TABLE lead_capture_campaigns ALTER COLUMN status SET NOT NULL;
ALTER TABLE lead_capture_campaigns ALTER COLUMN search_type SET NOT NULL;

-- Adicionar constraints
DO $$ 
BEGIN
  ALTER TABLE lead_capture_campaigns DROP CONSTRAINT IF EXISTS lead_capture_campaigns_status_check;
  ALTER TABLE lead_capture_campaigns ADD CONSTRAINT lead_capture_campaigns_status_check 
    CHECK (status IN ('ativo', 'pausado', 'concluído'));

  ALTER TABLE lead_capture_campaigns DROP CONSTRAINT IF EXISTS lead_capture_campaigns_search_type_check;
  ALTER TABLE lead_capture_campaigns ADD CONSTRAINT lead_capture_campaigns_search_type_check 
    CHECK (search_type IN ('google_maps', 'cep_region', 'manual'));

  ALTER TABLE lead_capture_campaigns DROP CONSTRAINT IF EXISTS lead_capture_campaigns_capture_frequency_check;
  ALTER TABLE lead_capture_campaigns ADD CONSTRAINT lead_capture_campaigns_capture_frequency_check 
    CHECK (capture_frequency IN ('daily', 'weekly', 'monthly'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
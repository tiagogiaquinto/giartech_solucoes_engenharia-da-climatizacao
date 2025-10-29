/*
  # Adicionar Colunas Faltantes no Service Catalog

  ## Problema
  - Erro: "Could not find the 'estimated_time_minutes' column in 'service_catalog'"
  
  ## Solução
  - Adicionar estimated_time_minutes
  - Adicionar outras colunas necessárias para criação de OS
*/

-- Adicionar estimated_time_minutes
ALTER TABLE service_catalog 
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER DEFAULT 60;

-- Adicionar complexity_level
ALTER TABLE service_catalog 
ADD COLUMN IF NOT EXISTS complexity_level TEXT DEFAULT 'medium';

-- Adicionar requires_special_tools
ALTER TABLE service_catalog 
ADD COLUMN IF NOT EXISTS requires_special_tools BOOLEAN DEFAULT false;

-- Adicionar department
ALTER TABLE service_catalog 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Adicionar service_type
ALTER TABLE service_catalog 
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'manutencao';

-- Comentar colunas
COMMENT ON COLUMN service_catalog.estimated_time_minutes IS 'Tempo estimado em minutos';
COMMENT ON COLUMN service_catalog.complexity_level IS 'Nível de complexidade: low, medium, high';
COMMENT ON COLUMN service_catalog.requires_special_tools IS 'Requer ferramentas especiais';
COMMENT ON COLUMN service_catalog.department IS 'Departamento responsável';
COMMENT ON COLUMN service_catalog.service_type IS 'Tipo de serviço';

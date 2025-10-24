/*
  # Adicionar Informações Detalhadas aos Serviços da OS

  1. Novos Campos
    - service_name (text) - Nome do serviço
    - service_description (text) - Descrição detalhada
    - service_scope (text) - Escopo completo do serviço
    - technical_requirements (text) - Requisitos técnicos
    - safety_warnings (text) - Avisos de segurança
    - execution_steps (text) - Passos de execução
    - expected_results (text) - Resultados esperados
    - quality_standards (text) - Padrões de qualidade
    - warranty_info (text) - Informações de garantia
    - observations (text) - Observações adicionais

  2. Segurança
    - Campos podem ser nulos (flexibilidade)
    - Índices para performance
*/

-- Adicionar campos de informações detalhadas
ALTER TABLE service_order_items 
  ADD COLUMN IF NOT EXISTS service_name text,
  ADD COLUMN IF NOT EXISTS service_description text,
  ADD COLUMN IF NOT EXISTS service_scope text,
  ADD COLUMN IF NOT EXISTS technical_requirements text,
  ADD COLUMN IF NOT EXISTS safety_warnings text,
  ADD COLUMN IF NOT EXISTS execution_steps text,
  ADD COLUMN IF NOT EXISTS expected_results text,
  ADD COLUMN IF NOT EXISTS quality_standards text,
  ADD COLUMN IF NOT EXISTS warranty_info text,
  ADD COLUMN IF NOT EXISTS observations text;

-- Criar índice para busca por nome de serviço
CREATE INDEX IF NOT EXISTS idx_service_order_items_service_name 
  ON service_order_items(service_name);

-- Comentários
COMMENT ON COLUMN service_order_items.service_name IS 'Nome do serviço executado';
COMMENT ON COLUMN service_order_items.service_description IS 'Descrição detalhada do serviço';
COMMENT ON COLUMN service_order_items.service_scope IS 'Escopo completo do que será feito';
COMMENT ON COLUMN service_order_items.technical_requirements IS 'Requisitos técnicos e equipamentos necessários';
COMMENT ON COLUMN service_order_items.safety_warnings IS 'Avisos de segurança e EPIs necessários';
COMMENT ON COLUMN service_order_items.execution_steps IS 'Passos detalhados de execução';
COMMENT ON COLUMN service_order_items.expected_results IS 'Resultados esperados após execução';
COMMENT ON COLUMN service_order_items.quality_standards IS 'Padrões de qualidade a serem seguidos';
COMMENT ON COLUMN service_order_items.warranty_info IS 'Informações sobre garantia do serviço';
COMMENT ON COLUMN service_order_items.observations IS 'Observações adicionais importantes';

-- Trigger para copiar informações do catálogo quando adicionar serviço
CREATE OR REPLACE FUNCTION copy_service_catalog_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Se tem service_catalog_id e não tem service_name, copiar do catálogo
  IF NEW.service_catalog_id IS NOT NULL AND NEW.service_name IS NULL THEN
    SELECT 
      name,
      description,
      scope,
      technical_requirements,
      COALESCE(escopo_detalhado, observations) as obs
    INTO 
      NEW.service_name,
      NEW.service_description,
      NEW.service_scope,
      NEW.technical_requirements,
      NEW.observations
    FROM service_catalog
    WHERE id = NEW.service_catalog_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_copy_service_info ON service_order_items;
CREATE TRIGGER trigger_copy_service_info
  BEFORE INSERT OR UPDATE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION copy_service_catalog_info();

/*
  # Adicionar Prazo de Execução às Ordens de Serviço
  
  1. Novos Campos
    - `prazo_execucao_dias` (integer) - Prazo em dias para execução
    - `data_inicio_execucao` (date) - Data de início da execução
    - `data_fim_execucao` (date) - Data prevista de término
  
  2. Objetivo
    - Controlar prazo de execução dos serviços
    - Calcular data de término automaticamente
    - Exibir nos PDFs e documentos
*/

-- Adicionar campos de prazo de execução
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'prazo_execucao_dias') THEN
    ALTER TABLE service_orders ADD COLUMN prazo_execucao_dias integer DEFAULT 7;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'data_inicio_execucao') THEN
    ALTER TABLE service_orders ADD COLUMN data_inicio_execucao date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'data_fim_execucao') THEN
    ALTER TABLE service_orders ADD COLUMN data_fim_execucao date;
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN service_orders.prazo_execucao_dias IS 'Prazo de execução do serviço em dias úteis';
COMMENT ON COLUMN service_orders.data_inicio_execucao IS 'Data de início da execução do serviço';
COMMENT ON COLUMN service_orders.data_fim_execucao IS 'Data prevista de término da execução';

-- Função para calcular data de fim baseado no prazo
CREATE OR REPLACE FUNCTION calculate_execution_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_inicio_execucao IS NOT NULL AND NEW.prazo_execucao_dias IS NOT NULL THEN
    NEW.data_fim_execucao := NEW.data_inicio_execucao + (NEW.prazo_execucao_dias || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular automaticamente
DROP TRIGGER IF EXISTS set_execution_end_date ON service_orders;
CREATE TRIGGER set_execution_end_date
  BEFORE INSERT OR UPDATE OF data_inicio_execucao, prazo_execucao_dias
  ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_execution_end_date();

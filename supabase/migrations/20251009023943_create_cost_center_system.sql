/*
  # Sistema de Centro de Custos por Ordem de Serviço

  ## 1. Nova Tabela: service_order_costs
  
  Armazena todos os custos relacionados a uma ordem de serviço:
  - Custos adicionais após criação da OS
  - Custos de materiais extras
  - Custos de combustível
  - Custos de deslocamento
  - Custos de terceirizados
  - Outros custos operacionais
  
  Campos:
  - `id`: Identificador único
  - `service_order_id`: FK para service_orders
  - `cost_type`: Tipo do custo (material, combustivel, deslocamento, terceirizado, outros)
  - `description`: Descrição detalhada do custo
  - `amount`: Valor do custo
  - `cost_date`: Data em que o custo ocorreu
  - `supplier`: Fornecedor/origem do custo
  - `payment_method`: Forma de pagamento
  - `invoice_number`: Número da nota fiscal
  - `notes`: Observações adicionais
  - `created_by`: Usuário que registrou
  - `created_at`: Data de criação do registro

  ## 2. Adicionar Campos em service_orders
  
  - `service_date`: Data real de execução do serviço (pode ser retroativa)
  - `completion_date`: Data de conclusão do serviço
  - `total_additional_costs`: Total de custos adicionais

  ## 3. Security
  
  - Enable RLS
  - Políticas para acesso autenticado
*/

-- Criar tabela de custos
CREATE TABLE IF NOT EXISTS service_order_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  cost_type text NOT NULL CHECK (cost_type IN ('material', 'combustivel', 'deslocamento', 'terceirizado', 'alimentacao', 'pedagio', 'estacionamento', 'outros')),
  description text NOT NULL,
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  cost_date date NOT NULL DEFAULT CURRENT_DATE,
  supplier text,
  payment_method text,
  invoice_number text,
  notes text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar campos de data em service_orders se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'service_date'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN service_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'completion_date'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN completion_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'total_additional_costs'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN total_additional_costs numeric(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_service_order_costs_order_id ON service_order_costs(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_costs_date ON service_order_costs(cost_date);
CREATE INDEX IF NOT EXISTS idx_service_order_costs_type ON service_order_costs(cost_type);
CREATE INDEX IF NOT EXISTS idx_service_orders_service_date ON service_orders(service_date);
CREATE INDEX IF NOT EXISTS idx_service_orders_completion_date ON service_orders(completion_date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_service_order_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_order_costs_updated_at
  BEFORE UPDATE ON service_order_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_costs_updated_at();

-- Função para calcular total de custos adicionais
CREATE OR REPLACE FUNCTION calculate_additional_costs(order_id uuid)
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total
  FROM service_order_costs
  WHERE service_order_id = order_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar total_additional_costs automaticamente
CREATE OR REPLACE FUNCTION update_service_order_additional_costs()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE service_orders
    SET total_additional_costs = calculate_additional_costs(OLD.service_order_id)
    WHERE id = OLD.service_order_id;
    RETURN OLD;
  ELSE
    UPDATE service_orders
    SET total_additional_costs = calculate_additional_costs(NEW.service_order_id)
    WHERE id = NEW.service_order_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_costs_on_insert
  AFTER INSERT ON service_order_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_additional_costs();

CREATE TRIGGER trigger_update_order_costs_on_update
  AFTER UPDATE ON service_order_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_additional_costs();

CREATE TRIGGER trigger_update_order_costs_on_delete
  AFTER DELETE ON service_order_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_additional_costs();

-- Enable RLS
ALTER TABLE service_order_costs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow authenticated read service_order_costs"
  ON service_order_costs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert service_order_costs"
  ON service_order_costs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update service_order_costs"
  ON service_order_costs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete service_order_costs"
  ON service_order_costs FOR DELETE
  TO authenticated
  USING (true);

-- Comentários para documentação
COMMENT ON TABLE service_order_costs IS 'Centro de custos por ordem de serviço - permite rastrear todos os custos adicionais';
COMMENT ON COLUMN service_order_costs.cost_type IS 'Tipo do custo: material, combustivel, deslocamento, terceirizado, alimentacao, pedagio, estacionamento, outros';
COMMENT ON COLUMN service_order_costs.cost_date IS 'Data em que o custo ocorreu (pode ser retroativa)';
COMMENT ON COLUMN service_orders.service_date IS 'Data de execução do serviço (pode ser retroativa para histórico)';
COMMENT ON COLUMN service_orders.completion_date IS 'Data de conclusão do serviço';
COMMENT ON COLUMN service_orders.total_additional_costs IS 'Total de custos adicionais calculado automaticamente';
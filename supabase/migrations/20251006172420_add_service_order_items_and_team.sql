/*
  # Adicionar Múltiplos Serviços e Equipe nas Ordens de Serviço
  
  1. Novas Tabelas:
    - service_order_items: Itens/serviços individuais na OS
      - Permite múltiplos serviços por ordem
      - Cálculo de valores e durações
      - Referência ao catálogo de serviços
    
    - service_order_team: Equipe atribuída à OS
      - Múltiplos funcionários por ordem
      - Papéis: leader, technician, assistant, supervisor
      - Registro de atribuição
  
  2. Campos Extras em service_orders:
    - show_value: Controla exibição de valores
    - total_estimated_duration: Duração total calculada
    - generated_contract: Referência ao contrato gerado
    - total_value: Valor total calculado
  
  3. Triggers Automáticos:
    - Cálculo automático de totais ao inserir/atualizar/deletar itens
    - Auto-atualização de timestamps
*/

CREATE TABLE IF NOT EXISTS service_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  service_catalog_id uuid REFERENCES service_catalog(id) ON DELETE RESTRICT,
  quantity decimal(10,2) DEFAULT 1 NOT NULL,
  unit_price numeric(12,2),
  total_price numeric(12,2),
  estimated_duration integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_order_items DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_service_order_items_order_id ON service_order_items(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_items_service_id ON service_order_items(service_catalog_id);

CREATE OR REPLACE FUNCTION update_service_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_service_order_items_updated_at ON service_order_items;
CREATE TRIGGER trigger_update_service_order_items_updated_at
  BEFORE UPDATE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_items_updated_at();

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  role text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS service_order_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('leader', 'technician', 'assistant', 'supervisor')),
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_order_id, employee_id)
);

ALTER TABLE service_order_team DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_service_order_team_order_id ON service_order_team(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_team_employee_id ON service_order_team(employee_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'show_value'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN show_value boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'total_estimated_duration'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN total_estimated_duration integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'generated_contract'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN generated_contract text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'total_value'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN total_value numeric(12,2) DEFAULT 0;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION calculate_service_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_orders
  SET
    total_value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    total_estimated_duration = (
      SELECT COALESCE(SUM(estimated_duration * quantity), 0)
      FROM service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    updated_at = now()
  WHERE id = NEW.service_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_calculate_totals_on_insert ON service_order_items;
CREATE TRIGGER trigger_calculate_totals_on_insert
  AFTER INSERT ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals();

DROP TRIGGER IF EXISTS trigger_calculate_totals_on_update ON service_order_items;
CREATE TRIGGER trigger_calculate_totals_on_update
  AFTER UPDATE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals();

CREATE OR REPLACE FUNCTION calculate_service_order_totals_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_orders
  SET
    total_value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM service_order_items
      WHERE service_order_id = OLD.service_order_id
    ),
    total_estimated_duration = (
      SELECT COALESCE(SUM(estimated_duration * quantity), 0)
      FROM service_order_items
      WHERE service_order_id = OLD.service_order_id
    ),
    updated_at = now()
  WHERE id = OLD.service_order_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_calculate_totals_on_delete ON service_order_items;
CREATE TRIGGER trigger_calculate_totals_on_delete
  AFTER DELETE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals_on_delete();

COMMENT ON TABLE service_order_items IS 'Itens/serviços individuais dentro de uma ordem de serviço';
COMMENT ON TABLE service_order_team IS 'Membros da equipe atribuídos a uma ordem de serviço';
COMMENT ON TABLE employees IS 'Funcionários da empresa';

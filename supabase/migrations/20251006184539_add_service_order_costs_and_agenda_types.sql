/*
  # Adicionar Custos Adicionais em OS e Tipos de Compromisso na Agenda

  1. Alterações em service_orders
    - Adicionar custo_materiais (numeric)
    - Adicionar custo_insumos (numeric)
    - Adicionar custo_combustivel (numeric)
    - Adicionar observacoes_custos (text)

  2. Alterações em agenda
    - Modificar event_type para suportar novos tipos
    - Adicionar campo color para customização

  3. Dados
    - Inserir tipos padrão de compromisso
*/

-- Adicionar campos de custos adicionais em service_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'custo_materiais'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN custo_materiais NUMERIC(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'custo_insumos'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN custo_insumos NUMERIC(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'custo_combustivel'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN custo_combustivel NUMERIC(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'observacoes_custos'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN observacoes_custos TEXT;
  END IF;
END $$;

-- Adicionar campo color na agenda se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agenda' AND column_name = 'color'
  ) THEN
    ALTER TABLE agenda ADD COLUMN color TEXT DEFAULT '#3b82f6';
  END IF;
END $$;

-- Comentários nas colunas
COMMENT ON COLUMN service_orders.custo_materiais IS 'Custo adicional com materiais utilizados na OS';
COMMENT ON COLUMN service_orders.custo_insumos IS 'Custo adicional com insumos utilizados na OS';
COMMENT ON COLUMN service_orders.custo_combustivel IS 'Custo adicional com combustível utilizado na OS';
COMMENT ON COLUMN service_orders.observacoes_custos IS 'Observações sobre os custos adicionais';
COMMENT ON COLUMN agenda.color IS 'Cor do evento no calendário (hex)';

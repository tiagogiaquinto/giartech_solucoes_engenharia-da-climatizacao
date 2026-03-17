/*
  # Parte 2a: Adicionar colunas de mão de obra em service_order_team
*/
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_order_team' AND column_name='custo_hora_snapshot') THEN
    ALTER TABLE service_order_team ADD COLUMN custo_hora_snapshot numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_order_team' AND column_name='horas_trabalhadas') THEN
    ALTER TABLE service_order_team ADD COLUMN horas_trabalhadas numeric(6,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_order_team' AND column_name='custo_total_mao_obra') THEN
    ALTER TABLE service_order_team ADD COLUMN custo_total_mao_obra numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

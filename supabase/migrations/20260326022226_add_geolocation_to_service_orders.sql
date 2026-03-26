/*
  # Adicionar campos de geolocalização às Ordens de Serviço

  ## Objetivo
  Permitir a detecção automática de chegada do técnico ao local do cliente.
  Quando o técnico entra num raio de 100 metros, o status muda automaticamente.

  ## Mudanças
  - `service_orders`: adiciona `client_lat`, `client_lng`, `started_at`
  - `service_orders`: adiciona `arrived_at` para registrar hora de chegada detectada por GPS
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='client_lat') THEN
    ALTER TABLE service_orders ADD COLUMN client_lat numeric(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='client_lng') THEN
    ALTER TABLE service_orders ADD COLUMN client_lng numeric(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='started_at') THEN
    ALTER TABLE service_orders ADD COLUMN started_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='arrived_at') THEN
    ALTER TABLE service_orders ADD COLUMN arrived_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_orders_lat_lng ON service_orders(client_lat, client_lng)
  WHERE client_lat IS NOT NULL AND client_lng IS NOT NULL;

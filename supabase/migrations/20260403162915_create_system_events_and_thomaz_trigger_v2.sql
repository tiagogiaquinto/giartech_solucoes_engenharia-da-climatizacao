/*
  # Sistema de Eventos para o Thomaz AI (v2 - idempotente)

  ## Resumo
  Cria a infraestrutura de eventos que permite ao Thomaz monitorar ações importantes
  no sistema em tempo real, com gatilho automático ao concluir uma OS.

  ## Novas Tabelas
  - `system_events`: Fila de eventos gerados automaticamente pelo banco

  ## Funções
  - `notify_thomaz_on_finish()`: Dispara ao atualizar status para concluído

  ## Gatilho
  - `tr_notify_thomaz` na tabela `service_orders`
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_events' AND policyname = 'Authenticated users can read system events'
  ) THEN
    CREATE POLICY "Authenticated users can read system events"
      ON system_events FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_events' AND policyname = 'Authenticated users can insert system events'
  ) THEN
    CREATE POLICY "Authenticated users can insert system events"
      ON system_events FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_events' AND policyname = 'Authenticated users can update system events'
  ) THEN
    CREATE POLICY "Authenticated users can update system events"
      ON system_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_system_events_event_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_processed ON system_events(processed);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at DESC);

CREATE OR REPLACE FUNCTION notify_thomaz_on_finish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('concluido', 'concluida', 'completed') AND
     OLD.status NOT IN ('concluido', 'concluida', 'completed') THEN
    INSERT INTO system_events (event_type, payload)
    VALUES (
      'OS_CONCLUIDA',
      jsonb_build_object(
        'os_id', NEW.id,
        'order_number', NEW.order_number,
        'technician_id', NEW.technician_id,
        'valor', NEW.total_value,
        'client_id', NEW.client_id,
        'client_name', NEW.client_name,
        'descricao', NEW.description,
        'concluido_em', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_thomaz ON public.service_orders;

CREATE TRIGGER tr_notify_thomaz
  AFTER UPDATE ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_thomaz_on_finish();

NOTIFY pgrst, 'reload schema';

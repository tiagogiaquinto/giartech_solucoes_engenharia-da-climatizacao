/*
  # Sistema Mobile para Técnicos - SIMPLIFICADO

  Sistema mobile profissional com modo offline, checklist, fotos e assinaturas.
  Valores financeiros completamente ocultos para técnicos.
*/

-- Tabela de checklist
CREATE TABLE IF NOT EXISTS service_order_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL DEFAULT 0,
  item_description TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES employees(id),
  notes TEXT,
  photo_required BOOLEAN DEFAULT false,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_service_order ON service_order_checklist(service_order_id);

-- Tabela de controle de tempo
CREATE TABLE IF NOT EXISTS service_order_time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  elapsed_seconds INTEGER DEFAULT 0,
  is_running BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_tracking_service_order ON service_order_time_tracking(service_order_id);

-- Campos de assinatura
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'signature_data') THEN
    ALTER TABLE service_orders ADD COLUMN signature_data TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'signed_at') THEN
    ALTER TABLE service_orders ADD COLUMN signed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'signed_by') THEN
    ALTER TABLE service_orders ADD COLUMN signed_by TEXT;
  END IF;
END $$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('service-order-photos', 'service-order-photos', true) ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE service_order_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_time_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist_all" ON service_order_checklist;
CREATE POLICY "checklist_all" ON service_order_checklist FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "time_all" ON service_order_time_tracking;
CREATE POLICY "time_all" ON service_order_time_tracking FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "photos_all" ON storage.objects;
CREATE POLICY "photos_all" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'service-order-photos') WITH CHECK (bucket_id = 'service-order-photos');

-- Função de checklist
DROP FUNCTION IF EXISTS create_default_checklist(UUID, TEXT);
CREATE FUNCTION create_default_checklist(p_service_order_id UUID, p_service_type TEXT DEFAULT 'geral')
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
  INSERT INTO service_order_checklist (service_order_id, item_order, item_description, is_mandatory, photo_required) VALUES
    (p_service_order_id, 1, 'Verificar local e condições de segurança', true, false),
    (p_service_order_id, 2, 'Foto do local ANTES do serviço', true, true),
    (p_service_order_id, 3, 'Conferir materiais necessários', true, false),
    (p_service_order_id, 4, 'Executar serviço conforme escopo', true, false),
    (p_service_order_id, 5, 'Realizar testes e verificações', true, false),
    (p_service_order_id, 6, 'Foto do local DEPOIS do serviço', true, true),
    (p_service_order_id, 7, 'Limpar área de trabalho', true, false),
    (p_service_order_id, 8, 'Coletar assinatura do cliente', true, false);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;

GRANT EXECUTE ON FUNCTION create_default_checklist TO anon, authenticated;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_checklist_timestamp ON service_order_checklist;
DROP FUNCTION IF EXISTS update_checklist_updated_at() CASCADE;

CREATE FUNCTION update_checklist_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.completed = true AND OLD.completed = false THEN NEW.completed_at = now(); END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trigger_update_checklist_timestamp BEFORE UPDATE ON service_order_checklist FOR EACH ROW EXECUTE FUNCTION update_checklist_updated_at();

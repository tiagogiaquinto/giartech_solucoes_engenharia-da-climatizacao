/*
  # Sistema Completo de Gestão de Técnicos - FIXED

  ## Funcionalidades Completas
  1. ✅ Fotos obrigatórias antes/depois (mínimo 2 cada)
  2. ✅ Checklist com ordem de prioridade (Alta/Média/Baixa)
  3. ✅ Sistema de aceite de OS por técnico
  4. ✅ Dashboard de desempenho individual e equipe
  5. ✅ Validação automática de OS com relatório fotográfico
  6. ✅ Métricas detalhadas de produtividade
*/

-- Função auxiliar para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

-- Tabela de fotos categorizadas
CREATE TABLE IF NOT EXISTS service_order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'during', 'issue', 'completed')),
  photo_url TEXT NOT NULL,
  photo_thumbnail TEXT,
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  taken_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES employees(id),
  file_size INTEGER,
  mime_type TEXT,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photos_service_order ON service_order_photos(service_order_id);
CREATE INDEX IF NOT EXISTS idx_photos_type ON service_order_photos(photo_type);

-- Atualizar checklist com prioridade
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_checklist' AND column_name = 'priority') THEN
    ALTER TABLE service_order_checklist ADD COLUMN priority INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_checklist' AND column_name = 'category') THEN
    ALTER TABLE service_order_checklist ADD COLUMN category TEXT DEFAULT 'geral';
  END IF;
END $$;

-- Tabela de atribuição e aceite
CREATE TABLE IF NOT EXISTS service_order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES employees(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignments_service_order ON service_order_assignments(service_order_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON service_order_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON service_order_assignments(status);

-- Tabela de desempenho
CREATE TABLE IF NOT EXISTS technician_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_os_assigned INTEGER DEFAULT 0,
  total_os_completed INTEGER DEFAULT 0,
  total_os_cancelled INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  avg_completion_time_hours DECIMAL(10,2) DEFAULT 0,
  total_hours_worked DECIMAL(10,2) DEFAULT 0,
  on_time_completion INTEGER DEFAULT 0,
  late_completion INTEGER DEFAULT 0,
  total_checklists_completed INTEGER DEFAULT 0,
  checklist_completion_rate DECIMAL(5,2) DEFAULT 0,
  total_photos_submitted INTEGER DEFAULT 0,
  total_signatures_collected INTEGER DEFAULT 0,
  avg_customer_rating DECIMAL(3,2),
  total_complaints INTEGER DEFAULT 0,
  total_compliments INTEGER DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  total_cost DECIMAL(15,2) DEFAULT 0,
  avg_margin DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_performance_employee ON technician_performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_period ON technician_performance(period_start, period_end);

-- Tabela de validação
CREATE TABLE IF NOT EXISTS service_order_validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL UNIQUE REFERENCES service_orders(id) ON DELETE CASCADE,
  has_before_photos BOOLEAN DEFAULT false,
  has_after_photos BOOLEAN DEFAULT false,
  has_signature BOOLEAN DEFAULT false,
  checklist_complete BOOLEAN DEFAULT false,
  checklist_completion_percentage DECIMAL(5,2) DEFAULT 0,
  before_photos_count INTEGER DEFAULT 0,
  after_photos_count INTEGER DEFAULT 0,
  total_photos_count INTEGER DEFAULT 0,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES employees(id),
  validation_notes TEXT,
  rejection_reason TEXT,
  photo_report_generated BOOLEAN DEFAULT false,
  photo_report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_validation_service_order ON service_order_validation(service_order_id);
CREATE INDEX IF NOT EXISTS idx_validation_status ON service_order_validation(validation_status);

-- RLS
ALTER TABLE service_order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_validation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "photos_all" ON service_order_photos;
CREATE POLICY "photos_all" ON service_order_photos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "assignments_all" ON service_order_assignments;
CREATE POLICY "assignments_all" ON service_order_assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "performance_all" ON technician_performance;
CREATE POLICY "performance_all" ON technician_performance FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "validation_all" ON service_order_validation;
CREATE POLICY "validation_all" ON service_order_validation FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Funções
DROP FUNCTION IF EXISTS create_prioritized_checklist(UUID);
CREATE FUNCTION create_prioritized_checklist(p_service_order_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
  INSERT INTO service_order_checklist (service_order_id, item_order, priority, item_description, is_mandatory, photo_required, category) VALUES
    (p_service_order_id, 1, 1, 'Verificar condições de segurança no local', true, false, 'Segurança'),
    (p_service_order_id, 2, 1, 'Foto ANTES - Vista geral', true, true, 'Documentação'),
    (p_service_order_id, 3, 1, 'Foto ANTES - Detalhe do problema', true, true, 'Documentação'),
    (p_service_order_id, 4, 1, 'Conferir materiais necessários', true, false, 'Preparação'),
    (p_service_order_id, 5, 2, 'Proteger área de trabalho', false, false, 'Preparação'),
    (p_service_order_id, 6, 2, 'Executar serviço conforme escopo', true, false, 'Execução'),
    (p_service_order_id, 7, 2, 'Realizar testes funcionais', true, false, 'Qualidade'),
    (p_service_order_id, 8, 2, 'Verificar normas técnicas', false, false, 'Qualidade'),
    (p_service_order_id, 9, 3, 'Foto DURANTE execução', false, true, 'Documentação'),
    (p_service_order_id, 10, 3, 'Limpar área de trabalho', true, false, 'Finalização'),
    (p_service_order_id, 11, 1, 'Foto DEPOIS - Vista geral', true, true, 'Documentação'),
    (p_service_order_id, 12, 1, 'Foto DEPOIS - Detalhe concluído', true, true, 'Documentação'),
    (p_service_order_id, 13, 1, 'Orientar cliente', true, false, 'Finalização'),
    (p_service_order_id, 14, 1, 'Coletar assinatura digital', true, false, 'Finalização');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;

DROP FUNCTION IF EXISTS assign_os_to_technician(UUID, UUID, UUID);
CREATE FUNCTION assign_os_to_technician(p_service_order_id UUID, p_employee_id UUID, p_assigned_by UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_assignment_id UUID;
BEGIN
  INSERT INTO service_order_assignments (service_order_id, employee_id, assigned_by, status)
  VALUES (p_service_order_id, p_employee_id, p_assigned_by, 'pending')
  RETURNING id INTO v_assignment_id;
  PERFORM create_prioritized_checklist(p_service_order_id);
  RETURN v_assignment_id;
END; $$;

DROP FUNCTION IF EXISTS respond_to_os_assignment(UUID, TEXT, TEXT);
CREATE FUNCTION respond_to_os_assignment(p_assignment_id UUID, p_response TEXT, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_response = 'accepted' THEN
    UPDATE service_order_assignments SET status = 'accepted', accepted_at = now(), notes = p_notes, updated_at = now() WHERE id = p_assignment_id;
    RETURN true;
  ELSIF p_response = 'rejected' THEN
    UPDATE service_order_assignments SET status = 'rejected', rejected_at = now(), rejection_reason = p_notes, updated_at = now() WHERE id = p_assignment_id;
    RETURN true;
  END IF;
  RETURN false;
END; $$;

DROP FUNCTION IF EXISTS validate_service_order(UUID);
CREATE FUNCTION validate_service_order(p_service_order_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result JSON;
  v_before_count INTEGER;
  v_after_count INTEGER;
  v_has_signature BOOLEAN;
  v_checklist_total INTEGER;
  v_checklist_completed INTEGER;
  v_checklist_percentage DECIMAL(5,2);
BEGIN
  SELECT COUNT(*) INTO v_before_count FROM service_order_photos WHERE service_order_id = p_service_order_id AND photo_type = 'before';
  SELECT COUNT(*) INTO v_after_count FROM service_order_photos WHERE service_order_id = p_service_order_id AND photo_type = 'after';
  SELECT (signature_data IS NOT NULL) INTO v_has_signature FROM service_orders WHERE id = p_service_order_id;
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true) INTO v_checklist_total, v_checklist_completed
  FROM service_order_checklist WHERE service_order_id = p_service_order_id;
  v_checklist_percentage := CASE WHEN v_checklist_total > 0 THEN (v_checklist_completed::DECIMAL / v_checklist_total * 100) ELSE 0 END;

  INSERT INTO service_order_validation (
    service_order_id, has_before_photos, has_after_photos, has_signature, checklist_complete,
    checklist_completion_percentage, before_photos_count, after_photos_count, total_photos_count, validation_status
  ) VALUES (
    p_service_order_id, v_before_count >= 2, v_after_count >= 2, COALESCE(v_has_signature, false),
    v_checklist_total > 0 AND v_checklist_completed = v_checklist_total, v_checklist_percentage,
    v_before_count, v_after_count, v_before_count + v_after_count,
    CASE WHEN v_before_count >= 2 AND v_after_count >= 2 AND v_has_signature AND v_checklist_completed = v_checklist_total
    THEN 'approved' ELSE 'pending' END
  ) ON CONFLICT (service_order_id) DO UPDATE SET
    has_before_photos = EXCLUDED.has_before_photos, has_after_photos = EXCLUDED.has_after_photos,
    has_signature = EXCLUDED.has_signature, checklist_complete = EXCLUDED.checklist_complete,
    checklist_completion_percentage = EXCLUDED.checklist_completion_percentage,
    before_photos_count = EXCLUDED.before_photos_count, after_photos_count = EXCLUDED.after_photos_count,
    total_photos_count = EXCLUDED.total_photos_count, validation_status = EXCLUDED.validation_status, updated_at = now();

  SELECT json_build_object(
    'is_valid', v_before_count >= 2 AND v_after_count >= 2 AND v_has_signature AND v_checklist_completed = v_checklist_total,
    'before_photos', v_before_count, 'after_photos', v_after_count, 'has_signature', v_has_signature,
    'checklist_percentage', v_checklist_percentage
  ) INTO v_result;
  RETURN v_result;
END; $$;

-- View sem valores financeiros
CREATE OR REPLACE VIEW v_technician_performance_public AS
SELECT tp.id, tp.employee_id, e.name as technician_name, tp.period_start, tp.period_end,
  tp.total_os_assigned, tp.total_os_completed, tp.total_os_cancelled, tp.completion_rate,
  tp.avg_completion_time_hours, tp.total_hours_worked, tp.on_time_completion, tp.late_completion,
  tp.total_checklists_completed, tp.checklist_completion_rate, tp.total_photos_submitted,
  tp.total_signatures_collected, tp.avg_customer_rating, tp.total_complaints, tp.total_compliments
FROM technician_performance tp LEFT JOIN employees e ON e.id = tp.employee_id;

GRANT SELECT ON v_technician_performance_public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_prioritized_checklist TO anon, authenticated;
GRANT EXECUTE ON FUNCTION assign_os_to_technician TO anon, authenticated;
GRANT EXECUTE ON FUNCTION respond_to_os_assignment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_service_order TO anon, authenticated;

-- Triggers
DROP TRIGGER IF EXISTS trigger_update_assignment_timestamp ON service_order_assignments;
CREATE TRIGGER trigger_update_assignment_timestamp BEFORE UPDATE ON service_order_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_validation_timestamp ON service_order_validation;
CREATE TRIGGER trigger_update_validation_timestamp BEFORE UPDATE ON service_order_validation FOR EACH ROW EXECUTE FUNCTION update_updated_at();

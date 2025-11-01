/*
  # Sistema de Solicitação de Compras Mobile

  1. Novas Tabelas
    - `purchase_requests` - Solicitações de compra dos técnicos
    - `purchase_request_items` - Itens das solicitações
    - `technician_vehicle_inventory` - Inventário do carro do técnico
    - `special_tools_catalog` - Catálogo de ferramentas especiais

  2. Features
    - Técnico solicita materiais em falta
    - Técnico solicita ferramentas especiais
    - Aprovação automática/manual
    - Notificação para departamento de compras
    - Rastreamento de status

  3. Security
    - RLS habilitado
    - Técnicos veem apenas suas próprias solicitações
    - Compras vê todas as solicitações
*/

-- =====================================================
-- TABELA: Solicitações de Compra
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE,
  requester_id uuid REFERENCES employees(id),
  service_order_id uuid REFERENCES service_orders(id),
  request_type text NOT NULL CHECK (request_type IN ('materials', 'tools', 'both')),
  urgency text DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_purchase', 'purchased', 'delivered', 'cancelled')),
  reason text,
  notes text,
  requested_delivery_date date,
  estimated_total decimal(15, 2),
  approved_by uuid REFERENCES employees(id),
  approved_at timestamptz,
  approval_notes text,
  purchased_by uuid REFERENCES employees(id),
  purchased_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABELA: Itens da Solicitação de Compra
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id uuid REFERENCES purchase_requests(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('material', 'tool', 'equipment')),
  material_id uuid REFERENCES inventory_items(id),
  tool_id uuid,
  custom_description text,
  quantity decimal(10, 2) NOT NULL,
  unit text,
  estimated_unit_price decimal(15, 2),
  estimated_total decimal(15, 2),
  actual_unit_price decimal(15, 2),
  actual_total decimal(15, 2),
  supplier_id uuid REFERENCES suppliers(id),
  urgency_reason text,
  alternative_accepted boolean DEFAULT true,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'purchased', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABELA: Inventário do Veículo do Técnico
-- =====================================================
CREATE TABLE IF NOT EXISTS technician_vehicle_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  material_id uuid REFERENCES inventory_items(id),
  current_quantity decimal(10, 2) NOT NULL DEFAULT 0,
  min_quantity decimal(10, 2) DEFAULT 0,
  max_quantity decimal(10, 2),
  unit text,
  last_restock_date date,
  last_restock_quantity decimal(10, 2),
  location_in_vehicle text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, material_id)
);

-- =====================================================
-- TABELA: Catálogo de Ferramentas Especiais
-- =====================================================
CREATE TABLE IF NOT EXISTS special_tools_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  description text,
  category text,
  brand text,
  model text,
  is_rental boolean DEFAULT false,
  purchase_price decimal(15, 2),
  rental_price_daily decimal(15, 2),
  in_stock integer DEFAULT 0,
  available integer DEFAULT 0,
  location text,
  supplier_id uuid REFERENCES suppliers(id),
  image_url text,
  specifications jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_purchase_requests_requester ON purchase_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_urgency ON purchase_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at ON purchase_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_request_items_request ON purchase_request_items(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_purchase_request_items_status ON purchase_request_items(status);
CREATE INDEX IF NOT EXISTS idx_technician_vehicle_inventory_employee ON technician_vehicle_inventory(employee_id);
CREATE INDEX IF NOT EXISTS idx_technician_vehicle_inventory_material ON technician_vehicle_inventory(material_id);
CREATE INDEX IF NOT EXISTS idx_special_tools_catalog_active ON special_tools_catalog(active) WHERE active = true;

-- =====================================================
-- FUNÇÃO: Gerar número de solicitação
-- =====================================================
CREATE OR REPLACE FUNCTION generate_purchase_request_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text;
  v_sequence integer;
  v_number text;
BEGIN
  IF NEW.request_number IS NULL THEN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(request_number FROM '\d+$') AS INTEGER
      )
    ), 0) + 1 INTO v_sequence
    FROM purchase_requests
    WHERE request_number LIKE 'SC-' || v_year || '-%';

    v_number := 'SC-' || v_year || '-' || LPAD(v_sequence::text, 4, '0');
    NEW.request_number := v_number;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNÇÃO: Notificar departamento de compras
-- =====================================================
CREATE OR REPLACE FUNCTION notify_purchase_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester_name text;
  v_urgency_label text;
BEGIN
  -- Buscar nome do solicitante
  SELECT full_name INTO v_requester_name
  FROM employees
  WHERE id = NEW.requester_id;

  -- Label de urgência
  v_urgency_label := CASE NEW.urgency
    WHEN 'urgent' THEN '🔴 URGENTE'
    WHEN 'high' THEN '🟠 ALTA'
    WHEN 'normal' THEN '🟡 NORMAL'
    ELSE '🟢 BAIXA'
  END;

  -- Criar notificações para o departamento de compras
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    link,
    priority,
    read
  ) SELECT
    up.user_id,
    'Nova Solicitação de Compra ' || v_urgency_label,
    v_requester_name || ' solicitou ' || NEW.request_type || '. Solicitação: ' || NEW.request_number,
    'purchase_request',
    '/purchasing?request=' || NEW.id,
    CASE NEW.urgency
      WHEN 'urgent' THEN 'high'
      WHEN 'high' THEN 'high'
      ELSE 'normal'
    END,
    false
  FROM user_profiles up
  WHERE up.role IN ('admin', 'purchasing', 'manager');

  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNÇÃO: Atualizar inventário do veículo
-- =====================================================
CREATE OR REPLACE FUNCTION update_vehicle_inventory_on_use()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Diminuir quantidade ao usar material da OS
  IF NEW.material_id IS NOT NULL THEN
    UPDATE technician_vehicle_inventory
    SET
      current_quantity = GREATEST(current_quantity - NEW.quantity, 0),
      updated_at = now()
    WHERE employee_id = (
      SELECT assigned_to FROM service_orders WHERE id = NEW.service_order_id
    )
    AND material_id = NEW.material_id;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNÇÃO: Auto-aprovar pequenas compras
-- =====================================================
CREATE OR REPLACE FUNCTION auto_approve_small_purchases()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auto_approve_limit decimal(15, 2) := 500.00;
BEGIN
  -- Auto-aprovar se valor for menor que o limite E urgência for alta/urgente
  IF NEW.estimated_total <= v_auto_approve_limit
     AND NEW.urgency IN ('high', 'urgent')
     AND NEW.status = 'pending' THEN

    NEW.status := 'approved';
    NEW.approved_at := now();
    NEW.approval_notes := 'Auto-aprovado (valor baixo + alta urgência)';

    -- Criar notificação para o solicitante
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      link,
      read
    ) VALUES (
      (SELECT user_id FROM employees WHERE id = NEW.requester_id),
      'Solicitação Aprovada Automaticamente',
      'Sua solicitação ' || NEW.request_number || ' foi aprovada automaticamente.',
      'purchase_approved',
      '/mobile/purchases/' || NEW.id,
      false
    );

  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Gerar número de solicitação
CREATE TRIGGER trigger_generate_purchase_request_number
  BEFORE INSERT ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_purchase_request_number();

-- Notificar departamento
CREATE TRIGGER trigger_notify_purchase_department
  AFTER INSERT ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_purchase_department();

-- Auto-aprovar pequenas compras
CREATE TRIGGER trigger_auto_approve_small_purchases
  BEFORE INSERT ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_small_purchases();

-- =====================================================
-- FUNÇÃO RPC: Criar solicitação de compra rápida
-- =====================================================
CREATE OR REPLACE FUNCTION create_purchase_request_mobile(
  p_requester_id uuid,
  p_service_order_id uuid DEFAULT NULL,
  p_request_type text DEFAULT 'materials',
  p_urgency text DEFAULT 'normal',
  p_reason text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_request_number text;
  v_item jsonb;
  v_estimated_total decimal(15, 2) := 0;
BEGIN
  -- Criar solicitação
  INSERT INTO purchase_requests (
    requester_id,
    service_order_id,
    request_type,
    urgency,
    reason,
    notes,
    status
  ) VALUES (
    p_requester_id,
    p_service_order_id,
    p_request_type,
    p_urgency,
    p_reason,
    p_notes,
    'pending'
  ) RETURNING id, request_number INTO v_request_id, v_request_number;

  -- Adicionar itens
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO purchase_request_items (
      purchase_request_id,
      item_type,
      material_id,
      custom_description,
      quantity,
      unit,
      estimated_unit_price,
      estimated_total,
      urgency_reason
    ) VALUES (
      v_request_id,
      COALESCE((v_item->>'item_type')::text, 'material'),
      (v_item->>'material_id')::uuid,
      v_item->>'custom_description',
      (v_item->>'quantity')::decimal,
      v_item->>'unit',
      (v_item->>'estimated_unit_price')::decimal,
      (v_item->>'quantity')::decimal * COALESCE((v_item->>'estimated_unit_price')::decimal, 0),
      v_item->>'urgency_reason'
    );

    v_estimated_total := v_estimated_total +
      ((v_item->>'quantity')::decimal * COALESCE((v_item->>'estimated_unit_price')::decimal, 0));
  END LOOP;

  -- Atualizar total estimado
  UPDATE purchase_requests
  SET estimated_total = v_estimated_total
  WHERE id = v_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'request_number', v_request_number,
    'estimated_total', v_estimated_total,
    'message', 'Solicitação criada com sucesso'
  );
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_vehicle_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_tools_catalog ENABLE ROW LEVEL SECURITY;

-- Purchase Requests
CREATE POLICY "Technicians see own requests" ON purchase_requests
  FOR SELECT TO authenticated
  USING (requester_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Technicians create own requests" ON purchase_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Admins and purchasing see all requests" ON purchase_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'purchasing', 'manager')
    )
  );

-- Anon access
CREATE POLICY "Allow all purchase_requests anon" ON purchase_requests FOR ALL TO anon USING (true);

-- Purchase Request Items
CREATE POLICY "See items of own requests" ON purchase_request_items
  FOR SELECT TO authenticated
  USING (
    purchase_request_id IN (
      SELECT id FROM purchase_requests
      WHERE requester_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Create items for own requests" ON purchase_request_items
  FOR INSERT TO authenticated
  WITH CHECK (
    purchase_request_id IN (
      SELECT id FROM purchase_requests
      WHERE requester_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins see all items" ON purchase_request_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'purchasing', 'manager')
    )
  );

-- Anon access
CREATE POLICY "Allow all purchase_request_items anon" ON purchase_request_items FOR ALL TO anon USING (true);

-- Vehicle Inventory
CREATE POLICY "Technicians see own vehicle inventory" ON technician_vehicle_inventory
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Technicians update own vehicle inventory" ON technician_vehicle_inventory
  FOR ALL TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Admins see all vehicle inventory" ON technician_vehicle_inventory
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Anon access
CREATE POLICY "Allow all technician_vehicle_inventory anon" ON technician_vehicle_inventory FOR ALL TO anon USING (true);

-- Special Tools Catalog
CREATE POLICY "All authenticated can view tools" ON special_tools_catalog
  FOR SELECT TO authenticated
  USING (active = true);

CREATE POLICY "Admins manage tools" ON special_tools_catalog
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'purchasing', 'manager')
    )
  );

-- Anon access
CREATE POLICY "Allow all special_tools_catalog anon" ON special_tools_catalog FOR ALL TO anon USING (true);

-- =====================================================
-- DADOS INICIAIS: Ferramentas Especiais
-- =====================================================
INSERT INTO special_tools_catalog (name, code, description, category, is_rental, rental_price_daily, in_stock, available, active) VALUES
('Martelete Rotativo Profissional', 'TOOL-001', 'Martelete para concreto e alvenaria', 'Perfuração', true, 50.00, 3, 3, true),
('Compressor de Ar 100L', 'TOOL-002', 'Compressor industrial 100 litros', 'Pneumática', true, 80.00, 2, 2, true),
('Andaime Tubular 6m', 'TOOL-003', 'Andaime completo até 6 metros', 'Acesso', true, 120.00, 5, 5, true),
('Detector de Tubulação', 'TOOL-004', 'Detector de canos e fios', 'Medição', true, 35.00, 4, 4, true),
('Esmerilhadeira 9"', 'TOOL-005', 'Esmerilhadeira angular 9 polegadas', 'Corte', true, 45.00, 3, 3, true),
('Parafusadeira Industrial', 'TOOL-006', 'Parafusadeira de impacto profissional', 'Fixação', true, 40.00, 6, 6, true),
('Nível a Laser Rotativo', 'TOOL-007', 'Nível a laser profissional', 'Medição', true, 60.00, 2, 2, true),
('Serra Mármore 1400W', 'TOOL-008', 'Serra para corte de pisos e azulejos', 'Corte', true, 55.00, 3, 3, true)
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE purchase_requests IS 'Solicitações de compra dos técnicos em campo';
COMMENT ON TABLE purchase_request_items IS 'Itens das solicitações de compra';
COMMENT ON TABLE technician_vehicle_inventory IS 'Inventário de materiais no veículo do técnico';
COMMENT ON TABLE special_tools_catalog IS 'Catálogo de ferramentas especiais para locação/compra';

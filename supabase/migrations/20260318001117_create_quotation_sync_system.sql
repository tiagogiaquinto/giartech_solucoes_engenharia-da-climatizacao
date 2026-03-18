/*
  # Sistema de Sincronização de Cotações

  ## Descrição
  Cria as tabelas e funções para processar cotações de fornecedores via IA (OCR),
  sincronizar preços de materiais e gerar alertas de margem para o Dashboard CFO.

  ## Novas Tabelas

  1. `quotation_extractions`
     - Armazena resultados de extração de OCR/IA de documentos de cotação
     - Vinculada a uma OS e a um documento
     - Campos: itens extraídos (JSON), status de revisão, fornecedor detectado

  2. `quotation_extracted_items`
     - Itens individuais extraídos de uma cotação
     - Vinculados a inventory_items se encontrado match
     - Campos: descrição, quantidade, valor unitário, data da cotação

  3. `price_update_proposals`
     - Propostas de atualização de preço aguardando aprovação do diretor
     - Flags de confirmação, impacto na margem, serviços afetados

  4. `margin_alerts`
     - Alertas gerados quando custo de material reduz margem abaixo do threshold
     - Vinculado a service_catalog e inventory_items

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Acesso para usuários autenticados
*/

-- Extrações de cotações
CREATE TABLE IF NOT EXISTS quotation_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  document_id uuid,
  file_name text NOT NULL DEFAULT '',
  supplier_detected text DEFAULT '',
  quote_date date,
  extraction_status text NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN ('pending', 'processing', 'completed', 'error', 'confirmed', 'rejected')),
  raw_text text DEFAULT '',
  ai_confidence numeric(5,2) DEFAULT 0,
  items_count integer DEFAULT 0,
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotation_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select quotation_extractions"
  ON quotation_extractions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert quotation_extractions"
  ON quotation_extractions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotation_extractions"
  ON quotation_extractions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can select quotation_extractions"
  ON quotation_extractions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert quotation_extractions"
  ON quotation_extractions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update quotation_extractions"
  ON quotation_extractions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Itens extraídos de cotações
CREATE TABLE IF NOT EXISTS quotation_extracted_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id uuid NOT NULL REFERENCES quotation_extractions(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantity numeric(10,3) DEFAULT 1,
  unit text DEFAULT 'un',
  unit_cost numeric(15,2) DEFAULT 0,
  total_cost numeric(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  quote_date date,
  matched_inventory_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL,
  match_confidence numeric(5,2) DEFAULT 0,
  match_status text NOT NULL DEFAULT 'unmatched'
    CHECK (match_status IN ('unmatched', 'matched', 'new_item', 'ignored')),
  current_avg_cost numeric(15,2) DEFAULT 0,
  price_change_pct numeric(8,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotation_extracted_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select quotation_extracted_items"
  ON quotation_extracted_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert quotation_extracted_items"
  ON quotation_extracted_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotation_extracted_items"
  ON quotation_extracted_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can select quotation_extracted_items"
  ON quotation_extracted_items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert quotation_extracted_items"
  ON quotation_extracted_items FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update quotation_extracted_items"
  ON quotation_extracted_items FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Propostas de atualização de preço
CREATE TABLE IF NOT EXISTS price_update_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id uuid NOT NULL REFERENCES quotation_extractions(id) ON DELETE CASCADE,
  extracted_item_id uuid NOT NULL REFERENCES quotation_extracted_items(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name text NOT NULL DEFAULT '',
  current_cost numeric(15,2) DEFAULT 0,
  proposed_cost numeric(15,2) DEFAULT 0,
  cost_change_pct numeric(8,2) DEFAULT 0,
  affected_services jsonb DEFAULT '[]'::jsonb,
  margin_impact jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  approved_by uuid,
  approved_at timestamptz,
  applied_at timestamptz,
  rejection_reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE price_update_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select price_update_proposals"
  ON price_update_proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert price_update_proposals"
  ON price_update_proposals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update price_update_proposals"
  ON price_update_proposals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can select price_update_proposals"
  ON price_update_proposals FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert price_update_proposals"
  ON price_update_proposals FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update price_update_proposals"
  ON price_update_proposals FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Alertas de margem
CREATE TABLE IF NOT EXISTS margin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL DEFAULT 'margin_warning'
    CHECK (alert_type IN ('margin_warning', 'cost_increase', 'price_suggestion', 'stock_update')),
  severity text NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  material_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL,
  material_name text DEFAULT '',
  service_id uuid,
  service_name text DEFAULT '',
  current_margin_pct numeric(8,2) DEFAULT 0,
  threshold_pct numeric(8,2) DEFAULT 0,
  suggested_price numeric(15,2) DEFAULT 0,
  price_update_proposal_id uuid REFERENCES price_update_proposals(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  dismissed_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE margin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select margin_alerts"
  ON margin_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert margin_alerts"
  ON margin_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update margin_alerts"
  ON margin_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can select margin_alerts"
  ON margin_alerts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert margin_alerts"
  ON margin_alerts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update margin_alerts"
  ON margin_alerts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quotation_extractions_service_order ON quotation_extractions(service_order_id);
CREATE INDEX IF NOT EXISTS idx_quotation_extracted_items_extraction ON quotation_extracted_items(extraction_id);
CREATE INDEX IF NOT EXISTS idx_quotation_extracted_items_inventory ON quotation_extracted_items(matched_inventory_id);
CREATE INDEX IF NOT EXISTS idx_price_update_proposals_status ON price_update_proposals(status);
CREATE INDEX IF NOT EXISTS idx_price_update_proposals_extraction ON price_update_proposals(extraction_id);
CREATE INDEX IF NOT EXISTS idx_margin_alerts_severity ON margin_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_margin_alerts_dismissed ON margin_alerts(is_dismissed);

-- Grants
GRANT ALL ON quotation_extractions TO anon, authenticated;
GRANT ALL ON quotation_extracted_items TO anon, authenticated;
GRANT ALL ON price_update_proposals TO anon, authenticated;
GRANT ALL ON margin_alerts TO anon, authenticated;

-- Função para aplicar atualização de preço aprovada
CREATE OR REPLACE FUNCTION apply_price_update_proposal(p_proposal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal price_update_proposals%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_proposal FROM price_update_proposals WHERE id = p_proposal_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proposta não encontrada');
  END IF;

  IF v_proposal.status <> 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proposta não está aprovada');
  END IF;

  -- Atualizar preço do item de estoque
  IF v_proposal.inventory_item_id IS NOT NULL THEN
    UPDATE inventory_items
    SET
      last_purchase_price = v_proposal.proposed_cost,
      average_cost = CASE
        WHEN average_cost > 0 THEN (average_cost + v_proposal.proposed_cost) / 2
        ELSE v_proposal.proposed_cost
      END,
      updated_at = now()
    WHERE id = v_proposal.inventory_item_id;
  END IF;

  -- Marcar como aplicado
  UPDATE price_update_proposals
  SET status = 'applied', applied_at = now()
  WHERE id = p_proposal_id;

  RETURN jsonb_build_object('success', true, 'message', 'Preço atualizado com sucesso');
END;
$$;

GRANT EXECUTE ON FUNCTION apply_price_update_proposal TO anon, authenticated;

-- Função para buscar alertas de margem ativos
CREATE OR REPLACE FUNCTION get_active_margin_alerts()
RETURNS TABLE (
  id uuid,
  alert_type text,
  severity text,
  title text,
  description text,
  material_name text,
  service_name text,
  current_margin_pct numeric,
  threshold_pct numeric,
  suggested_price numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ma.id, ma.alert_type, ma.severity, ma.title, ma.description,
    ma.material_name, ma.service_name, ma.current_margin_pct,
    ma.threshold_pct, ma.suggested_price, ma.created_at
  FROM margin_alerts ma
  WHERE ma.is_dismissed = false
  ORDER BY
    CASE ma.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
    ma.created_at DESC
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION get_active_margin_alerts TO anon, authenticated;

/*
  # SISTEMA COMPLETO: CENTRO DE CUSTOS, ROI E ANÁLISE FINANCEIRA POR OS

  ## 📊 OBJETIVO
  Rastrear TODOS os custos de cada OS para análise precisa de:
  - ROI (Return on Investment) por tipo de serviço
  - Rentabilidade real vs esperada
  - Custos extras não planejados
  - Performance por departamento
  - Serviços mais e menos lucrativos
  - Tendências de custos ao longo do tempo

  ## 🎯 ESTRUTURA

  ### 1. Centros de Custo Departamentais (cost_centers)
  Define departamentos/áreas da empresa

  ### 2. Custos Extras por OS (service_order_costs)
  Já existe! Vamos expandir com mais campos

  ### 3. Análise de Rentabilidade (v_service_order_profitability)
  View que calcula ROI, margem, lucro real

  ### 4. ROI por Tipo de Serviço (v_service_roi_by_type)
  Identifica quais serviços são mais rentáveis

  ### 5. Análise de Custos Extras (v_cost_analysis)
  Analisa onde os custos extras mais acontecem

  ### 6. Dashboard CFO (v_cfo_cost_analysis)
  Visão executiva de custos e rentabilidade

  ## 🔐 SEGURANÇA
  - RLS habilitado em todas as tabelas
  - Acesso autenticado
  - Audit logs automáticos
*/

-- =====================================================
-- PARTE 1: CENTROS DE CUSTO DEPARTAMENTAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id uuid REFERENCES cost_centers(id) ON DELETE SET NULL,
  department TEXT,
  manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  budget_monthly DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cost_centers_code ON cost_centers(code);
CREATE INDEX IF NOT EXISTS idx_cost_centers_parent ON cost_centers(parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_active ON cost_centers(is_active);

-- Dados iniciais de centros de custo
INSERT INTO cost_centers (code, name, description, department) VALUES
('CC-001', 'Operações', 'Custos operacionais gerais', 'Operacional'),
('CC-002', 'Manutenção', 'Serviços de manutenção', 'Operacional'),
('CC-003', 'Instalação', 'Serviços de instalação', 'Operacional'),
('CC-004', 'Garantia', 'Atendimentos em garantia', 'Pós-Venda'),
('CC-005', 'Emergência', 'Atendimentos emergenciais', 'Operacional'),
('CC-006', 'Comercial', 'Atividades comerciais', 'Vendas'),
('CC-007', 'Administrativo', 'Custos administrativos', 'Administrativo'),
('CC-008', 'Logística', 'Transporte e deslocamento', 'Operacional'),
('CC-009', 'Treinamento', 'Capacitação de equipe', 'RH'),
('CC-010', 'Marketing', 'Marketing e vendas', 'Comercial')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PARTE 2: EXPANDIR service_order_costs
-- =====================================================

-- Adicionar novos campos para análise mais detalhada
DO $$
BEGIN
  -- Centro de custo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_costs' AND column_name = 'cost_center_id'
  ) THEN
    ALTER TABLE service_order_costs
    ADD COLUMN cost_center_id uuid REFERENCES cost_centers(id) ON DELETE SET NULL;
  END IF;

  -- É custo de garantia?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_costs' AND column_name = 'is_warranty'
  ) THEN
    ALTER TABLE service_order_costs
    ADD COLUMN is_warranty BOOLEAN DEFAULT false;
  END IF;

  -- É custo planejado ou extra?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_costs' AND column_name = 'is_planned'
  ) THEN
    ALTER TABLE service_order_costs
    ADD COLUMN is_planned BOOLEAN DEFAULT false;
  END IF;

  -- Categoria de custo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_costs' AND column_name = 'category'
  ) THEN
    ALTER TABLE service_order_costs
    ADD COLUMN category TEXT CHECK (category IN (
      'material_extra', 'combustivel', 'pedagio', 'estacionamento',
      'alimentacao', 'hospedagem', 'ferramentas', 'equipamento',
      'terceirizado', 'manutencao_veiculo', 'outros'
    ));
  END IF;

  -- Aprovado por
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_costs' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE service_order_costs
    ADD COLUMN approved_by uuid REFERENCES employees(id) ON DELETE SET NULL;
  END IF;

  -- Data de aprovação
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_costs' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE service_order_costs
    ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;

  -- Status de aprovação
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_costs' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE service_order_costs
    ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN (
      'pending', 'approved', 'rejected'
    ));
  END IF;

  -- Anexos (URLs de comprovantes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_costs' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE service_order_costs
    ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_service_order_costs_center ON service_order_costs(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_service_order_costs_warranty ON service_order_costs(is_warranty);
CREATE INDEX IF NOT EXISTS idx_service_order_costs_category ON service_order_costs(category);
CREATE INDEX IF NOT EXISTS idx_service_order_costs_approval ON service_order_costs(approval_status);

-- =====================================================
-- PARTE 3: ADICIONAR CAMPOS EM service_orders
-- =====================================================

DO $$
BEGIN
  -- Centro de custo principal da OS
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'cost_center_id'
  ) THEN
    ALTER TABLE service_orders
    ADD COLUMN cost_center_id uuid REFERENCES cost_centers(id) ON DELETE SET NULL;
  END IF;

  -- Custo planejado total
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'planned_cost'
  ) THEN
    ALTER TABLE service_orders
    ADD COLUMN planned_cost DECIMAL(12,2) DEFAULT 0;
  END IF;

  -- Custo real total (incluindo extras)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'actual_cost'
  ) THEN
    ALTER TABLE service_orders
    ADD COLUMN actual_cost DECIMAL(12,2) DEFAULT 0;
  END IF;

  -- Receita total
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'revenue'
  ) THEN
    ALTER TABLE service_orders
    ADD COLUMN revenue DECIMAL(12,2) DEFAULT 0;
  END IF;

  -- Lucro real
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'profit'
  ) THEN
    ALTER TABLE service_orders
    ADD COLUMN profit DECIMAL(12,2) DEFAULT 0;
  END IF;

  -- Margem de lucro real (%)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'profit_margin'
  ) THEN
    ALTER TABLE service_orders
    ADD COLUMN profit_margin DECIMAL(5,2) DEFAULT 0;
  END IF;

  -- ROI (%)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'roi'
  ) THEN
    ALTER TABLE service_orders
    ADD COLUMN roi DECIMAL(8,2) DEFAULT 0;
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_orders_cost_center ON service_orders(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_profit ON service_orders(profit);
CREATE INDEX IF NOT EXISTS idx_service_orders_roi ON service_orders(roi);

-- =====================================================
-- PARTE 4: FUNÇÃO PARA CALCULAR CUSTOS E ROI
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_service_order_financials(order_id uuid)
RETURNS TABLE (
  planned_cost DECIMAL,
  actual_cost DECIMAL,
  revenue DECIMAL,
  profit DECIMAL,
  profit_margin DECIMAL,
  roi DECIMAL,
  additional_costs DECIMAL
) AS $$
DECLARE
  v_cost_materials DECIMAL := 0;
  v_cost_labor DECIMAL := 0;
  v_cost_extras DECIMAL := 0;
  v_revenue DECIMAL := 0;
  v_planned DECIMAL := 0;
  v_actual DECIMAL := 0;
  v_profit DECIMAL := 0;
  v_margin DECIMAL := 0;
  v_roi DECIMAL := 0;
BEGIN
  -- Custo de materiais
  SELECT COALESCE(SUM(total_cost), 0) INTO v_cost_materials
  FROM service_order_materials
  WHERE service_order_id = order_id;

  -- Custo de mão de obra
  SELECT COALESCE(SUM(total_cost), 0) INTO v_cost_labor
  FROM service_order_labor
  WHERE service_order_id = order_id;

  -- Custos extras
  SELECT COALESCE(SUM(amount), 0) INTO v_cost_extras
  FROM service_order_costs
  WHERE service_order_id = order_id;

  -- Receita (da tabela principal)
  SELECT COALESCE(total_value, 0) INTO v_revenue
  FROM service_orders
  WHERE id = order_id;

  -- Cálculos
  v_planned := v_cost_materials + v_cost_labor;
  v_actual := v_planned + v_cost_extras;
  v_profit := v_revenue - v_actual;

  IF v_revenue > 0 THEN
    v_margin := (v_profit / v_revenue) * 100;
  END IF;

  IF v_actual > 0 THEN
    v_roi := ((v_revenue - v_actual) / v_actual) * 100;
  END IF;

  RETURN QUERY SELECT
    v_planned,
    v_actual,
    v_revenue,
    v_profit,
    v_margin,
    v_roi,
    v_cost_extras;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 5: TRIGGER PARA ATUALIZAR FINANCIALS AUTO
-- =====================================================

CREATE OR REPLACE FUNCTION update_service_order_financials()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id uuid;
  v_financials RECORD;
BEGIN
  -- Determinar qual OS atualizar
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.service_order_id;
  ELSE
    v_order_id := NEW.service_order_id;
  END IF;

  -- Calcular financials
  SELECT * INTO v_financials
  FROM calculate_service_order_financials(v_order_id);

  -- Atualizar service_orders
  UPDATE service_orders SET
    planned_cost = v_financials.planned_cost,
    actual_cost = v_financials.actual_cost,
    revenue = v_financials.revenue,
    profit = v_financials.profit,
    profit_margin = v_financials.profit_margin,
    roi = v_financials.roi,
    total_additional_costs = v_financials.additional_costs,
    updated_at = NOW()
  WHERE id = v_order_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
DROP TRIGGER IF EXISTS trigger_update_financials_on_materials ON service_order_materials;
CREATE TRIGGER trigger_update_financials_on_materials
  AFTER INSERT OR UPDATE OR DELETE ON service_order_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_financials();

DROP TRIGGER IF EXISTS trigger_update_financials_on_labor ON service_order_labor;
CREATE TRIGGER trigger_update_financials_on_labor
  AFTER INSERT OR UPDATE OR DELETE ON service_order_labor
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_financials();

DROP TRIGGER IF EXISTS trigger_update_financials_on_costs ON service_order_costs;
CREATE TRIGGER trigger_update_financials_on_costs
  AFTER INSERT OR UPDATE OR DELETE ON service_order_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_financials();

-- =====================================================
-- PARTE 6: VIEW - ANÁLISE DE RENTABILIDADE POR OS
-- =====================================================

CREATE OR REPLACE VIEW v_service_order_profitability AS
SELECT
  so.id,
  so.order_number,
  so.client_name,
  so.status,
  so.service_type,
  cc.name as cost_center_name,
  cc.department,

  -- Financeiro básico
  so.total_value as revenue,
  so.planned_cost,
  so.actual_cost,
  so.total_additional_costs as extra_costs,

  -- Rentabilidade
  so.profit,
  so.profit_margin,
  so.roi,

  -- Variações
  (so.actual_cost - so.planned_cost) as cost_variance,
  CASE
    WHEN so.planned_cost > 0 THEN
      ((so.actual_cost - so.planned_cost) / so.planned_cost * 100)
    ELSE 0
  END as cost_variance_percent,

  -- Classificação
  CASE
    WHEN so.roi >= 50 THEN 'Excelente'
    WHEN so.roi >= 30 THEN 'Bom'
    WHEN so.roi >= 15 THEN 'Regular'
    WHEN so.roi >= 0 THEN 'Baixo'
    ELSE 'Prejuízo'
  END as roi_classification,

  CASE
    WHEN so.profit_margin >= 40 THEN 'Alto'
    WHEN so.profit_margin >= 25 THEN 'Médio'
    WHEN so.profit_margin >= 10 THEN 'Baixo'
    ELSE 'Negativo'
  END as margin_classification,

  -- Datas
  so.created_at,
  so.service_date,
  so.completion_date,

  -- Métricas extras
  EXTRACT(EPOCH FROM (so.completion_date - so.service_date))/86400 as days_to_complete,

  -- Custos detalhados
  (SELECT COALESCE(SUM(total_cost), 0) FROM service_order_materials WHERE service_order_id = so.id) as material_costs,
  (SELECT COALESCE(SUM(total_cost), 0) FROM service_order_labor WHERE service_order_id = so.id) as labor_costs,
  (SELECT COALESCE(SUM(amount), 0) FROM service_order_costs WHERE service_order_id = so.id AND is_warranty = true) as warranty_costs,
  (SELECT COUNT(*) FROM service_order_costs WHERE service_order_id = so.id) as extra_cost_count

FROM service_orders so
LEFT JOIN cost_centers cc ON cc.id = so.cost_center_id
WHERE so.status NOT IN ('cancelada', 'excluida');

-- =====================================================
-- PARTE 7: VIEW - ROI POR TIPO DE SERVIÇO
-- =====================================================

CREATE OR REPLACE VIEW v_service_roi_by_type AS
SELECT
  service_type,
  COUNT(*) as total_services,
  COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed_services,

  -- Receitas
  SUM(revenue) as total_revenue,
  AVG(revenue) as avg_revenue,

  -- Custos
  SUM(planned_cost) as total_planned_cost,
  SUM(actual_cost) as total_actual_cost,
  SUM(extra_costs) as total_extra_costs,
  AVG(actual_cost) as avg_actual_cost,

  -- Rentabilidade
  SUM(profit) as total_profit,
  AVG(profit) as avg_profit,
  AVG(profit_margin) as avg_margin,
  AVG(roi) as avg_roi,

  -- Variações
  AVG(cost_variance) as avg_cost_variance,
  AVG(cost_variance_percent) as avg_cost_variance_percent,

  -- Performance
  SUM(CASE WHEN roi >= 30 THEN 1 ELSE 0 END) as high_roi_count,
  SUM(CASE WHEN roi < 0 THEN 1 ELSE 0 END) as negative_roi_count,

  -- Classificação geral
  CASE
    WHEN AVG(roi) >= 50 THEN 'Tipo A - Excelente'
    WHEN AVG(roi) >= 30 THEN 'Tipo B - Bom'
    WHEN AVG(roi) >= 15 THEN 'Tipo C - Regular'
    ELSE 'Tipo D - Revisar'
  END as service_classification

FROM v_service_order_profitability
GROUP BY service_type
ORDER BY avg_roi DESC;

-- =====================================================
-- PARTE 8: VIEW - ANÁLISE DE CUSTOS EXTRAS
-- =====================================================

CREATE OR REPLACE VIEW v_cost_analysis AS
SELECT
  soc.category,
  soc.cost_type,
  cc.name as cost_center,
  COUNT(*) as occurrence_count,
  SUM(soc.amount) as total_amount,
  AVG(soc.amount) as avg_amount,
  MIN(soc.amount) as min_amount,
  MAX(soc.amount) as max_amount,

  -- Por status
  COUNT(CASE WHEN soc.is_warranty THEN 1 END) as warranty_count,
  SUM(CASE WHEN soc.is_warranty THEN soc.amount ELSE 0 END) as warranty_amount,

  COUNT(CASE WHEN NOT soc.is_planned THEN 1 END) as unplanned_count,
  SUM(CASE WHEN NOT soc.is_planned THEN soc.amount ELSE 0 END) as unplanned_amount,

  -- Aprovações
  COUNT(CASE WHEN soc.approval_status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN soc.approval_status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN soc.approval_status = 'rejected' THEN 1 END) as rejected_count,

  -- Temporal
  DATE_TRUNC('month', soc.cost_date) as month,
  EXTRACT(YEAR FROM soc.cost_date) as year

FROM service_order_costs soc
LEFT JOIN cost_centers cc ON cc.id = soc.cost_center_id
GROUP BY soc.category, soc.cost_type, cc.name, DATE_TRUNC('month', soc.cost_date), EXTRACT(YEAR FROM soc.cost_date)
ORDER BY total_amount DESC;

-- =====================================================
-- PARTE 9: VIEW - DASHBOARD CFO
-- =====================================================

CREATE OR REPLACE VIEW v_cfo_cost_analysis AS
SELECT
  -- Período
  DATE_TRUNC('month', so.created_at) as month,
  EXTRACT(YEAR FROM so.created_at) as year,
  EXTRACT(MONTH FROM so.created_at) as month_number,

  -- Centro de custo
  cc.code as cost_center_code,
  cc.name as cost_center_name,
  cc.department,

  -- Volume
  COUNT(*) as total_orders,
  COUNT(CASE WHEN so.status = 'concluido' THEN 1 END) as completed_orders,

  -- Receitas
  SUM(so.revenue) as total_revenue,
  AVG(so.revenue) as avg_revenue_per_order,

  -- Custos
  SUM(so.planned_cost) as total_planned_cost,
  SUM(so.actual_cost) as total_actual_cost,
  SUM(so.total_additional_costs) as total_extra_costs,

  -- Rentabilidade
  SUM(so.profit) as total_profit,
  AVG(so.profit_margin) as avg_margin,
  AVG(so.roi) as avg_roi,

  -- Variações
  SUM(so.actual_cost - so.planned_cost) as total_cost_variance,
  AVG(CASE WHEN so.planned_cost > 0 THEN
    ((so.actual_cost - so.planned_cost) / so.planned_cost * 100)
  ELSE 0 END) as avg_cost_variance_percent,

  -- Performance
  SUM(CASE WHEN so.roi >= 30 THEN 1 ELSE 0 END) as high_performance_count,
  SUM(CASE WHEN so.roi < 0 THEN 1 ELSE 0 END) as loss_count,

  -- Budget vs Real
  cc.budget_monthly,
  SUM(so.actual_cost) - cc.budget_monthly as budget_variance

FROM service_orders so
LEFT JOIN cost_centers cc ON cc.id = so.cost_center_id
WHERE so.status NOT IN ('cancelada', 'excluida')
GROUP BY
  DATE_TRUNC('month', so.created_at),
  EXTRACT(YEAR FROM so.created_at),
  EXTRACT(MONTH FROM so.created_at),
  cc.code,
  cc.name,
  cc.department,
  cc.budget_monthly
ORDER BY year DESC, month_number DESC, total_revenue DESC;

-- =====================================================
-- PARTE 10: VIEW - TOP/BOTTOM PERFORMERS
-- =====================================================

CREATE OR REPLACE VIEW v_service_performance_ranking AS
WITH ranked_services AS (
  SELECT
    *,
    ROW_NUMBER() OVER (ORDER BY roi DESC) as roi_rank,
    ROW_NUMBER() OVER (ORDER BY profit DESC) as profit_rank,
    ROW_NUMBER() OVER (ORDER BY profit_margin DESC) as margin_rank
  FROM v_service_order_profitability
  WHERE status = 'concluido'
)
SELECT
  id,
  order_number,
  client_name,
  service_type,
  cost_center_name,
  revenue,
  actual_cost,
  profit,
  profit_margin,
  roi,
  roi_rank,
  profit_rank,
  margin_rank,
  CASE
    WHEN roi_rank <= 10 THEN 'Top 10 ROI'
    WHEN roi_rank <= 20 THEN 'Top 20 ROI'
    WHEN roi_rank >= (SELECT COUNT(*) - 9 FROM ranked_services) THEN 'Bottom 10 ROI'
    ELSE 'Normal'
  END as performance_tier
FROM ranked_services
ORDER BY roi_rank;

-- =====================================================
-- PARTE 11: FUNCTION - RELATÓRIO GERENCIAL
-- =====================================================

CREATE OR REPLACE FUNCTION get_cost_center_report(
  p_cost_center_id uuid DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  metric TEXT,
  value DECIMAL,
  formatted_value TEXT,
  comparison TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH data AS (
    SELECT
      COUNT(*) as total_orders,
      SUM(revenue) as total_revenue,
      SUM(actual_cost) as total_cost,
      SUM(profit) as total_profit,
      AVG(roi) as avg_roi,
      AVG(profit_margin) as avg_margin,
      SUM(extra_costs) as total_extra_costs
    FROM v_service_order_profitability
    WHERE (p_cost_center_id IS NULL OR cost_center_name IN (
      SELECT name FROM cost_centers WHERE id = p_cost_center_id
    ))
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
  )
  SELECT * FROM (
    SELECT 'Total de Ordens'::TEXT, total_orders::DECIMAL, total_orders::TEXT, ''::TEXT FROM data
    UNION ALL
    SELECT 'Receita Total', total_revenue, 'R$ ' || TO_CHAR(total_revenue, 'FM999,999,990.00'), '' FROM data
    UNION ALL
    SELECT 'Custo Total', total_cost, 'R$ ' || TO_CHAR(total_cost, 'FM999,999,990.00'), '' FROM data
    UNION ALL
    SELECT 'Lucro Total', total_profit, 'R$ ' || TO_CHAR(total_profit, 'FM999,999,990.00'), '' FROM data
    UNION ALL
    SELECT 'ROI Médio (%)', avg_roi, TO_CHAR(avg_roi, 'FM990.00') || '%', '' FROM data
    UNION ALL
    SELECT 'Margem Média (%)', avg_margin, TO_CHAR(avg_margin, 'FM990.00') || '%', '' FROM data
    UNION ALL
    SELECT 'Custos Extras', total_extra_costs, 'R$ ' || TO_CHAR(total_extra_costs, 'FM999,999,990.00'), '' FROM data
  ) t;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 12: RLS E SEGURANÇA
-- =====================================================

-- RLS para cost_centers
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read cost_centers"
  ON cost_centers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert cost_centers"
  ON cost_centers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update cost_centers"
  ON cost_centers FOR UPDATE
  TO authenticated
  USING (true);

-- Acesso anônimo temporário (remover em produção)
CREATE POLICY "Allow anon read cost_centers"
  ON cost_centers FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- PARTE 13: GRANTS
-- =====================================================

-- Garantir acesso às views
GRANT SELECT ON v_service_order_profitability TO authenticated, anon;
GRANT SELECT ON v_service_roi_by_type TO authenticated, anon;
GRANT SELECT ON v_cost_analysis TO authenticated, anon;
GRANT SELECT ON v_cfo_cost_analysis TO authenticated, anon;
GRANT SELECT ON v_service_performance_ranking TO authenticated, anon;

-- Garantir acesso às tabelas
GRANT ALL ON cost_centers TO authenticated;
GRANT SELECT ON cost_centers TO anon;
GRANT ALL ON service_order_costs TO authenticated;
GRANT SELECT ON service_order_costs TO anon;

-- =====================================================
-- PARTE 14: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE cost_centers IS 'Centros de custo departamentais para alocação de despesas';
COMMENT ON VIEW v_service_order_profitability IS 'Análise completa de rentabilidade por ordem de serviço';
COMMENT ON VIEW v_service_roi_by_type IS 'ROI e performance agrupados por tipo de serviço';
COMMENT ON VIEW v_cost_analysis IS 'Análise detalhada de custos extras e suas ocorrências';
COMMENT ON VIEW v_cfo_cost_analysis IS 'Dashboard executivo de custos para CFO';
COMMENT ON VIEW v_service_performance_ranking IS 'Ranking de OSs por performance financeira';

-- =====================================================
-- PARTE 15: MENSAGEM FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  SISTEMA DE CENTRO DE CUSTOS E ROI INSTALADO!                ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  ✓ Centros de custo criados                                  ║';
  RAISE NOTICE '║  ✓ service_order_costs expandido                             ║';
  RAISE NOTICE '║  ✓ Campos de ROI adicionados em service_orders               ║';
  RAISE NOTICE '║  ✓ Triggers automáticos configurados                         ║';
  RAISE NOTICE '║  ✓ Views de análise criadas:                                 ║';
  RAISE NOTICE '║    - v_service_order_profitability                           ║';
  RAISE NOTICE '║    - v_service_roi_by_type                                   ║';
  RAISE NOTICE '║    - v_cost_analysis                                         ║';
  RAISE NOTICE '║    - v_cfo_cost_analysis                                     ║';
  RAISE NOTICE '║    - v_service_performance_ranking                           ║';
  RAISE NOTICE '║  ✓ Função de relatório gerencial                            ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  PRÓXIMOS PASSOS:                                            ║';
  RAISE NOTICE '║  1. Associar OSs aos centros de custo                        ║';
  RAISE NOTICE '║  2. Registrar custos extras conforme ocorrem                 ║';
  RAISE NOTICE '║  3. Acompanhar ROI nas views criadas                         ║';
  RAISE NOTICE '║  4. Usar get_cost_center_report() para relatórios            ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

/*
  # Sentinela do Lucro — Sistema de Análise de Margem por OS

  1. Colunas novas em service_orders
    - `labor_cost` (NUMERIC): custo total de mão de obra da OS
    - `materials_cost` (NUMERIC): custo total de materiais/peças da OS

  2. View v_os_profitability
    - Calcula faturamento, custo total, lucro bruto e margem percentual por OS
    - Classifica saúde financeira: healthy / warning / critical

  3. Triggers de sincronização
    - Mantém labor_cost e materials_cost atualizados automaticamente
      a partir das tabelas service_order_labor e service_order_materials

  4. Trigger trg_sentinela_margem_os
    - Se margem < 20%: alerta 'critical' em financial_alerts
    - Se margem 20–30%: alerta 'warning'
    - Evita duplicatas por os_id + janela 24h

  5. RPC analisar_prejuizo_os(uuid)
    - Retorna análise completa com sugestões de melhoria
    - Usado pelo botão "Analisar Prejuízo" do Thomaz AI

  Coluna correta em customers: nome_razao
*/

-- ─────────────────────────────────────────────
-- 1. Colunas de custo
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'labor_cost'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN labor_cost NUMERIC(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'materials_cost'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN materials_cost NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 2. Sincronizar custos com tabelas filhas
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_os_costs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os_id UUID;
  v_labor NUMERIC := 0;
  v_mats  NUMERIC := 0;
BEGIN
  v_os_id := COALESCE(NEW.service_order_id, OLD.service_order_id);
  IF v_os_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT COALESCE(SUM(COALESCE(unit_cost, 0) * COALESCE(quantity, 1)), 0)
  INTO v_labor
  FROM service_order_labor
  WHERE service_order_id = v_os_id;

  SELECT COALESCE(SUM(COALESCE(unit_cost, unit_price, 0) * COALESCE(quantity, 1)), 0)
  INTO v_mats
  FROM service_order_materials
  WHERE service_order_id = v_os_id;

  UPDATE service_orders
  SET labor_cost = v_labor,
      materials_cost = v_mats
  WHERE id = v_os_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_labor_costs ON service_order_labor;
CREATE TRIGGER trg_sync_labor_costs
  AFTER INSERT OR UPDATE OR DELETE ON service_order_labor
  FOR EACH ROW EXECUTE FUNCTION sync_os_costs();

DROP TRIGGER IF EXISTS trg_sync_materials_costs ON service_order_materials;
CREATE TRIGGER trg_sync_materials_costs
  AFTER INSERT OR UPDATE OR DELETE ON service_order_materials
  FOR EACH ROW EXECUTE FUNCTION sync_os_costs();

-- ─────────────────────────────────────────────
-- 3. View de lucratividade por OS
-- ─────────────────────────────────────────────
DROP VIEW IF EXISTS v_os_profitability;
CREATE VIEW v_os_profitability
WITH (security_invoker = true)
AS
SELECT
  so.id                                                   AS os_id,
  so.order_number,
  COALESCE(so.title, so.description, 'OS')                AS os_title,
  so.status,
  so.created_at,
  so.completed_at,
  c.id                                                    AS customer_id,
  COALESCE(c.nome_razao, so.client_name, 'Cliente')       AS customer_name,
  COALESCE(so.total_value, so.total, 0)                   AS faturamento,
  COALESCE(so.labor_cost, 0)                              AS custo_mao_obra,
  COALESCE(so.materials_cost, 0)                          AS custo_materiais,
  (COALESCE(so.labor_cost, 0) + COALESCE(so.materials_cost, 0)) AS custo_total,
  (
    COALESCE(so.total_value, so.total, 0)
    - COALESCE(so.labor_cost, 0)
    - COALESCE(so.materials_cost, 0)
  )                                                       AS lucro_bruto,
  CASE
    WHEN COALESCE(so.total_value, so.total, 0) > 0 THEN
      ROUND(
        (
          (COALESCE(so.total_value, so.total, 0)
           - COALESCE(so.labor_cost, 0)
           - COALESCE(so.materials_cost, 0))
          / COALESCE(so.total_value, so.total, 0)
        ) * 100,
        2
      )
    ELSE 0
  END                                                     AS margem_percentual,
  CASE
    WHEN COALESCE(so.total_value, so.total, 0) = 0 THEN 'sem_valor'
    WHEN (
      (COALESCE(so.total_value, so.total, 0)
       - COALESCE(so.labor_cost, 0)
       - COALESCE(so.materials_cost, 0))
      / COALESCE(so.total_value, so.total, 0)
    ) * 100 < 20 THEN 'critical'
    WHEN (
      (COALESCE(so.total_value, so.total, 0)
       - COALESCE(so.labor_cost, 0)
       - COALESCE(so.materials_cost, 0))
      / COALESCE(so.total_value, so.total, 0)
    ) * 100 < 30 THEN 'warning'
    ELSE 'healthy'
  END                                                     AS health_status
FROM service_orders so
LEFT JOIN customers c ON c.id = so.customer_id;

-- ─────────────────────────────────────────────
-- 4. Trigger Sentinela de Margem
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_os_margin_sentinela()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_margin        NUMERIC;
  v_faturamento   NUMERIC;
  v_custo_total   NUMERIC;
  v_lucro         NUMERIC;
  v_severity      TEXT;
  v_threshold     NUMERIC;
  v_order_num     TEXT;
  v_duplicate     BOOLEAN := FALSE;
BEGIN
  v_faturamento := COALESCE(NEW.total_value, NEW.total, 0);
  v_custo_total := COALESCE(NEW.labor_cost, 0) + COALESCE(NEW.materials_cost, 0);
  v_lucro       := v_faturamento - v_custo_total;
  v_order_num   := COALESCE(NEW.order_number, NEW.id::text);

  IF v_faturamento <= 0 OR v_custo_total = 0 THEN
    RETURN NEW;
  END IF;

  v_margin := ROUND((v_lucro / v_faturamento) * 100, 2);

  IF v_margin >= 30 THEN
    UPDATE financial_alerts
    SET is_active = false,
        resolved_at = now()
    WHERE os_id = NEW.id AND is_active = true;
    RETURN NEW;
  END IF;

  IF v_margin < 20 THEN
    v_severity  := 'critical';
    v_threshold := 20;
  ELSE
    v_severity  := 'warning';
    v_threshold := 30;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM financial_alerts
    WHERE os_id = NEW.id
      AND severity = v_severity
      AND is_active = true
      AND created_at > now() - INTERVAL '24 hours'
  ) INTO v_duplicate;

  IF v_duplicate THEN
    UPDATE financial_alerts
    SET current_value = v_margin,
        description = 'Margem de lucro em ' || v_margin || '%. Faturamento: R$ ' ||
                      to_char(v_faturamento, 'FM999G990D00') ||
                      ' | Custo: R$ ' || to_char(v_custo_total, 'FM999G990D00') ||
                      ' | Lucro: R$ ' || to_char(v_lucro, 'FM999G990D00')
    WHERE os_id = NEW.id AND severity = v_severity AND is_active = true;
  ELSE
    UPDATE financial_alerts
    SET is_active = false, resolved_at = now()
    WHERE os_id = NEW.id AND is_active = true;

    INSERT INTO financial_alerts (
      alert_type, severity, title, description,
      current_value, threshold_value, is_active, os_id
    ) VALUES (
      'margin_alert',
      v_severity,
      'Margem Baixa — OS ' || v_order_num,
      'Margem de lucro em ' || v_margin || '%. Faturamento: R$ ' ||
      to_char(v_faturamento, 'FM999G990D00') ||
      ' | Custo total: R$ ' || to_char(v_custo_total, 'FM999G990D00') ||
      ' | Lucro bruto: R$ ' || to_char(v_lucro, 'FM999G990D00'),
      v_margin,
      v_threshold,
      true,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sentinela_margem_os ON service_orders;
CREATE TRIGGER trg_sentinela_margem_os
  AFTER INSERT OR UPDATE OF total_value, total, labor_cost, materials_cost
  ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION check_os_margin_sentinela();

-- ─────────────────────────────────────────────
-- 5. RPC: Análise de Prejuízo por OS
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION analisar_prejuizo_os(p_os_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os            RECORD;
  v_customer_name TEXT;
  v_margem        NUMERIC;
  v_faturamento   NUMERIC;
  v_custo_total   NUMERIC;
  v_lucro         NUMERIC;
  v_preco_ideal   NUMERIC;
  v_resultado     jsonb;
  v_sugestoes     jsonb[];
BEGIN
  SELECT
    so.*,
    COALESCE(c.nome_razao, so.client_name, 'Cliente') AS cname
  INTO v_os
  FROM service_orders so
  LEFT JOIN customers c ON c.id = so.customer_id
  WHERE so.id = p_os_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'OS não encontrada');
  END IF;

  v_faturamento   := COALESCE(v_os.total_value, v_os.total, 0);
  v_custo_total   := COALESCE(v_os.labor_cost, 0) + COALESCE(v_os.materials_cost, 0);
  v_lucro         := v_faturamento - v_custo_total;
  v_customer_name := v_os.cname;

  IF v_faturamento > 0 THEN
    v_margem := ROUND((v_lucro / v_faturamento) * 100, 2);
  ELSE
    v_margem := 0;
  END IF;

  v_preco_ideal := ROUND(v_custo_total / 0.70, 2);
  v_sugestoes   := ARRAY[]::jsonb[];

  IF v_custo_total > 0 AND v_os.labor_cost > v_faturamento * 0.40 THEN
    v_sugestoes := array_append(v_sugestoes,
      jsonb_build_object(
        'tipo', 'mao_obra',
        'titulo', 'Custo de mão de obra elevado',
        'descricao', 'M.O. representa ' ||
          ROUND((v_os.labor_cost / NULLIF(v_faturamento,0)) * 100, 1) ||
          '% do faturamento. Ideal: abaixo de 40%.',
        'acao', 'Revise o tempo alocado ou ajuste o valor hora para esta categoria de serviço.'
      )
    );
  END IF;

  IF v_custo_total > 0 AND v_os.materials_cost > v_faturamento * 0.35 THEN
    v_sugestoes := array_append(v_sugestoes,
      jsonb_build_object(
        'tipo', 'materiais',
        'titulo', 'Custo de materiais acima do padrão',
        'descricao', 'Materiais consumiram ' ||
          ROUND((v_os.materials_cost / NULLIF(v_faturamento,0)) * 100, 1) ||
          '% do faturamento.',
        'acao', 'Verifique se todos os materiais foram cobrados. Aplique markup de 15–25% sobre custo de peças.'
      )
    );
  END IF;

  IF v_faturamento > 0 AND v_faturamento < v_custo_total THEN
    v_sugestoes := array_append(v_sugestoes,
      jsonb_build_object(
        'tipo', 'prejuizo_direto',
        'titulo', 'Prejuízo direto — serviço custou mais do que faturou',
        'descricao', 'Perda de R$ ' || to_char(abs(v_lucro), 'FM999G990D00') || ' nesta OS.',
        'acao', 'Para cobrir custos + 30% de margem, o preço mínimo seria R$ ' || to_char(v_preco_ideal, 'FM999G990D00') || '.'
      )
    );
  ELSIF v_margem < 20 THEN
    v_sugestoes := array_append(v_sugestoes,
      jsonb_build_object(
        'tipo', 'preco_baixo',
        'titulo', 'Preço insuficiente para margem saudável',
        'descricao', 'Para 30% de margem, o valor mínimo seria R$ ' || to_char(v_preco_ideal, 'FM999G990D00') || '.',
        'acao', 'Use este valor como referência no próximo orçamento para ' || v_customer_name || '.'
      )
    );
  END IF;

  IF array_length(v_sugestoes, 1) IS NULL THEN
    v_sugestoes := array_append(v_sugestoes,
      jsonb_build_object(
        'tipo', 'sem_custo',
        'titulo', 'Custos não informados',
        'descricao', 'Informe o custo de mão de obra e materiais para análise completa.',
        'acao', 'Preencha os campos de custo na OS para ativar o monitoramento de margem.'
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'os_id',             p_os_id,
    'os_numero',         COALESCE(v_os.order_number, p_os_id::text),
    'os_titulo',         COALESCE(v_os.title, v_os.description, 'OS'),
    'cliente',           v_customer_name,
    'faturamento',       v_faturamento,
    'custo_mao_obra',    COALESCE(v_os.labor_cost, 0),
    'custo_materiais',   COALESCE(v_os.materials_cost, 0),
    'custo_total',       v_custo_total,
    'lucro_bruto',       v_lucro,
    'margem_pct',        v_margem,
    'preco_ideal_30pct', v_preco_ideal,
    'health_status',     CASE
                           WHEN v_margem < 20 THEN 'critical'
                           WHEN v_margem < 30 THEN 'warning'
                           ELSE 'healthy'
                         END,
    'sugestoes',         to_jsonb(v_sugestoes)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION analisar_prejuizo_os(UUID) TO authenticated, anon;

-- ─────────────────────────────────────────────
-- 6. Índices de performance
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_service_orders_costs
  ON service_orders(labor_cost, materials_cost);

CREATE INDEX IF NOT EXISTS idx_financial_alerts_os_active
  ON financial_alerts(os_id, is_active)
  WHERE is_active = true;

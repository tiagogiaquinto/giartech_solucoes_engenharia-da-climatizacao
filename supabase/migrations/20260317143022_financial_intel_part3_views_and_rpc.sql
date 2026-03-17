/*
  # Parte 3: View de Resumo Financeiro por OS + RPC KPIs do CFO

  - v_os_financial_summary: Bruto - Impostos - Materiais - MO - Extras = Margem
  - get_cfo_kpis_period(): todos os KPIs para o Dashboard do CFO com período customizável
*/

-- ============================================================
-- VIEW: RESUMO FINANCEIRO POR OS
-- ============================================================
DROP VIEW IF EXISTS v_os_financial_summary CASCADE;
CREATE VIEW v_os_financial_summary AS
WITH tax_total AS (
  SELECT COALESCE(SUM(rate_percentual), 0) AS aliquota
  FROM tax_rates WHERE is_active = true AND applies_to = 'servicos'
),
mat_costs AS (
  SELECT service_order_id, COALESCE(SUM(total_price), 0) AS total
  FROM service_order_materials GROUP BY service_order_id
),
team_costs AS (
  SELECT service_order_id, COALESCE(SUM(custo_total_mao_obra), 0) AS total
  FROM service_order_team GROUP BY service_order_id
),
labor_costs AS (
  SELECT service_order_id, COALESCE(SUM(custo_total), 0) AS total
  FROM service_order_labor GROUP BY service_order_id
),
extra_costs AS (
  SELECT service_order_id, COALESCE(SUM(amount), 0) AS total
  FROM service_order_costs GROUP BY service_order_id
)
SELECT
  so.id                                                         AS service_order_id,
  so.order_number,
  so.status,
  so.scheduled_at,
  c.nome_razao                                                  AS customer_name,
  COALESCE(so.total_amount, 0)                                  AS valor_bruto,
  ROUND(COALESCE(so.total_amount,0) * t.aliquota / 100.0, 2)   AS valor_impostos,
  t.aliquota                                                    AS aliquota_total_impostos,
  COALESCE(mat.total, 0)                                        AS custo_materiais,
  COALESCE(tm.total, 0) + COALESCE(lb.total, 0)                AS custo_mao_obra,
  COALESCE(ex.total, 0)                                         AS custo_extras,
  COALESCE(mat.total,0) + COALESCE(tm.total,0) + COALESCE(lb.total,0) + COALESCE(ex.total,0) AS custo_total,
  ROUND(
    COALESCE(so.total_amount,0)
    - ROUND(COALESCE(so.total_amount,0) * t.aliquota / 100.0, 2)
    - COALESCE(mat.total,0) - COALESCE(tm.total,0) - COALESCE(lb.total,0) - COALESCE(ex.total,0),
  2) AS margem_liquida,
  CASE WHEN COALESCE(so.total_amount,0) > 0 THEN ROUND((
    COALESCE(so.total_amount,0)
    - ROUND(COALESCE(so.total_amount,0) * t.aliquota / 100.0, 2)
    - COALESCE(mat.total,0) - COALESCE(tm.total,0) - COALESCE(lb.total,0) - COALESCE(ex.total,0)
  ) / COALESCE(so.total_amount,0) * 100.0, 2) ELSE 0 END       AS percentual_margem
FROM service_orders so
CROSS JOIN tax_total t
LEFT JOIN customers   c   ON c.id = so.customer_id
LEFT JOIN mat_costs   mat ON mat.service_order_id = so.id
LEFT JOIN team_costs  tm  ON tm.service_order_id  = so.id
LEFT JOIN labor_costs lb  ON lb.service_order_id  = so.id
LEFT JOIN extra_costs ex  ON ex.service_order_id  = so.id;

GRANT SELECT ON v_os_financial_summary TO anon, authenticated;

-- ============================================================
-- RPC: KPIs DO CFO POR PERÍODO
-- ============================================================
DROP FUNCTION IF EXISTS get_cfo_kpis_period(date, date);
CREATE FUNCTION get_cfo_kpis_period(
  p_start_date date DEFAULT (date_trunc('month', CURRENT_DATE))::date,
  p_end_date   date DEFAULT CURRENT_DATE
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_fat     numeric := 0;
  v_imp     numeric := 0;
  v_mat     numeric := 0;
  v_mo      numeric := 0;
  v_ext     numeric := 0;
  v_desp    numeric := 0;
  v_pessoal numeric := 0;
  v_aliq    numeric := 0;
  v_os_cnt  int     := 0;
  v_cli     int     := 0;
  v_ticket  numeric := 0;
  v_dias    int     := 0;
BEGIN
  v_dias := GREATEST(p_end_date - p_start_date + 1, 1);

  SELECT COALESCE(SUM(rate_percentual),0) INTO v_aliq
  FROM tax_rates WHERE is_active=true AND applies_to='servicos';

  SELECT COUNT(*), COALESCE(SUM(total_amount),0)
  INTO v_os_cnt, v_fat
  FROM service_orders
  WHERE status IN ('concluido','concluída','finalizado','fechado','completed','done')
    AND scheduled_at::date BETWEEN p_start_date AND p_end_date;

  SELECT COUNT(DISTINCT customer_id) INTO v_cli
  FROM service_orders
  WHERE status IN ('concluido','concluída','finalizado','fechado','completed','done')
    AND scheduled_at::date BETWEEN p_start_date AND p_end_date;

  v_imp := ROUND(v_fat * v_aliq / 100.0, 2);

  SELECT COALESCE(SUM(som.total_price),0) INTO v_mat
  FROM service_order_materials som
  JOIN service_orders so ON so.id = som.service_order_id
  WHERE so.status IN ('concluido','concluída','finalizado','fechado','completed','done')
    AND so.scheduled_at::date BETWEEN p_start_date AND p_end_date;

  SELECT
    COALESCE(SUM(COALESCE(sot.custo_total_mao_obra,0)),0)
    + COALESCE(SUM(COALESCE(sol.custo_total,0)),0)
  INTO v_mo
  FROM service_orders so
  LEFT JOIN service_order_team  sot ON sot.service_order_id = so.id
  LEFT JOIN service_order_labor sol ON sol.service_order_id = so.id
  WHERE so.status IN ('concluido','concluída','finalizado','fechado','completed','done')
    AND so.scheduled_at::date BETWEEN p_start_date AND p_end_date;

  SELECT COALESCE(SUM(soc.amount),0) INTO v_ext
  FROM service_order_costs soc
  JOIN service_orders so ON so.id = soc.service_order_id
  WHERE so.scheduled_at::date BETWEEN p_start_date AND p_end_date;

  SELECT COALESCE(SUM(fe.valor),0) INTO v_desp
  FROM finance_entries fe
  WHERE fe.tipo IN ('despesa','saida','saída','expense')
    AND fe.status IN ('pago','paid','concluido','confirmado')
    AND COALESCE(fe.data_vencimento, fe.data)::date BETWEEN p_start_date AND p_end_date;

  SELECT COALESCE(SUM(salary * (1.0 + COALESCE(encargos_percentual,68.0)/100.0)),0)
  INTO v_pessoal FROM employees WHERE active = true;
  v_pessoal := ROUND(v_pessoal * v_dias / 30.0, 2);

  IF v_os_cnt > 0 THEN v_ticket := ROUND(v_fat / v_os_cnt, 2); END IF;

  RETURN jsonb_build_object(
    'periodo_inicio',         p_start_date,
    'periodo_fim',            p_end_date,
    'faturamento_bruto',      v_fat,
    'total_impostos',         v_imp,
    'aliquota_impostos',      v_aliq,
    'custo_materiais',        v_mat,
    'custo_mao_obra',         v_mo,
    'custo_extras',           v_ext,
    'custo_total_pessoal',    v_pessoal,
    'total_despesas_fixas',   v_desp,
    'lucro_liquido',          v_fat - v_imp - v_mat - v_mo - v_ext - v_desp,
    'ebitda',                 v_fat - v_imp - v_mat - v_mo - v_ext,
    'ebitda_margem',          CASE WHEN v_fat>0 THEN ROUND((v_fat-v_imp-v_mat-v_mo-v_ext)/v_fat*100.0,2) ELSE 0 END,
    'margem_liquida_pct',     CASE WHEN v_fat>0 THEN ROUND((v_fat-v_imp-v_mat-v_mo-v_ext-v_desp)/v_fat*100.0,2) ELSE 0 END,
    'qtd_os_fechadas',        v_os_cnt,
    'qtd_clientes_atendidos', v_cli,
    'ticket_medio',           v_ticket
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_cfo_kpis_period(date, date) TO anon, authenticated;

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_so_status_sched  ON service_orders(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_fe_tipo_status   ON finance_entries(tipo, status);

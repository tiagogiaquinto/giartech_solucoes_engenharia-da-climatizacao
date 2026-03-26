/*
  # Corrige get_cfo_kpis_period — colunas de data corretas em finance_entries

  - Substitui referência inexistente 'data_competencia' pelas colunas reais:
    data, data_vencimento, data_pagamento
  - Mantém toda a lógica de impostos (16.33%) e margem líquida real
*/

CREATE OR REPLACE FUNCTION public.get_cfo_kpis_period(
  p_start_date date DEFAULT date_trunc('month', CURRENT_DATE)::date,
  p_end_date   date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Alíquota total de impostos (soma de tax_rates ativas para serviços)
  SELECT COALESCE(SUM(rate_percentual), 16.33) INTO v_aliq
  FROM tax_rates
  WHERE is_active = true AND applies_to = 'servicos';

  IF v_aliq IS NULL OR v_aliq = 0 THEN
    v_aliq := 16.33;
  END IF;

  -- Faturamento bruto = receitas recebidas no período
  -- Usa COALESCE(data_pagamento, data_vencimento, data) para maior precisão
  SELECT COALESCE(SUM(valor), 0) INTO v_fat
  FROM finance_entries
  WHERE tipo IN ('receita', 'entrada')
    AND status IN ('recebido', 'pago', 'paid', 'confirmado')
    AND COALESCE(data_pagamento, data_vencimento, data)::date
        BETWEEN p_start_date AND p_end_date;

  -- Impostos sobre faturamento
  v_imp := ROUND(v_fat * v_aliq / 100.0, 2);

  -- Custo de materiais
  SELECT COALESCE(SUM(som.total_price), 0) INTO v_mat
  FROM service_order_materials som
  JOIN service_orders so ON so.id = som.service_order_id
  WHERE COALESCE(so.service_date, so.created_at::date)
        BETWEEN p_start_date AND p_end_date;

  -- Custo de mão de obra
  SELECT
    COALESCE(SUM(COALESCE(sot.custo_total_mao_obra, 0)), 0)
    + COALESCE(SUM(COALESCE(sol.custo_total, 0)), 0)
  INTO v_mo
  FROM service_orders so
  LEFT JOIN service_order_team  sot ON sot.service_order_id = so.id
  LEFT JOIN service_order_labor sol ON sol.service_order_id = so.id
  WHERE COALESCE(so.service_date, so.created_at::date)
        BETWEEN p_start_date AND p_end_date;

  -- Custos extras
  SELECT COALESCE(SUM(soc.amount), 0) INTO v_ext
  FROM service_order_costs soc
  JOIN service_orders so ON so.id = soc.service_order_id
  WHERE COALESCE(so.service_date, so.created_at::date)
        BETWEEN p_start_date AND p_end_date;

  -- Despesas pagas no período
  SELECT COALESCE(SUM(fe.valor), 0) INTO v_desp
  FROM finance_entries fe
  WHERE fe.tipo IN ('despesa', 'saida', 'saída', 'expense')
    AND fe.status IN ('pago', 'paid', 'concluido', 'confirmado')
    AND COALESCE(fe.data_pagamento, fe.data_vencimento, fe.data)::date
        BETWEEN p_start_date AND p_end_date;

  -- Custo pessoal proporcional
  SELECT COALESCE(SUM(salary * (1.0 + COALESCE(encargos_percentual, 68.0) / 100.0)), 0)
  INTO v_pessoal
  FROM employees WHERE active = true;
  v_pessoal := ROUND(v_pessoal * v_dias / 30.0, 2);

  -- OS no período
  SELECT COUNT(*), COALESCE(AVG(NULLIF(total_value, 0)), 0)
  INTO v_os_cnt, v_ticket
  FROM service_orders
  WHERE COALESCE(service_date, created_at::date)
        BETWEEN p_start_date AND p_end_date;

  SELECT COUNT(DISTINCT COALESCE(customer_id::text, client_name)) INTO v_cli
  FROM service_orders
  WHERE COALESCE(service_date, created_at::date)
        BETWEEN p_start_date AND p_end_date;

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
    'ebitda_margem',
      CASE WHEN v_fat > 0
        THEN ROUND((v_fat - v_imp - v_mat - v_mo - v_ext) / v_fat * 100.0, 2)
        ELSE 0 END,
    'margem_liquida_pct',
      CASE WHEN v_fat > 0
        THEN ROUND((v_fat - v_imp - v_mat - v_mo - v_ext - v_desp) / v_fat * 100.0, 2)
        ELSE 0 END,
    'qtd_os_fechadas',        v_os_cnt,
    'qtd_clientes_atendidos', v_cli,
    'ticket_medio',           ROUND(v_ticket, 2)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_cfo_kpis_period(date, date) TO anon;
GRANT EXECUTE ON FUNCTION public.get_cfo_kpis_period(date, date) TO authenticated;

/*
  # Sistema de Relatório Semanal de Desempenho

  ## O que este sistema faz
  Gera um relatório consolidado toda semana com:
  - Faturamento, custos e lucro líquido
  - Taxa de conclusão das OS
  - Comparativo com a semana anterior
  - Insight automático gerado pelo Thomaz AI
  - Histórico de relatórios enviados

  ## Tabelas criadas
  - `weekly_report_schedules`: Configuração de dia/hora/destinos
  - `weekly_report_history`: Histórico completo dos relatórios

  ## Views criadas
  - `v_weekly_performance_summary`: KPIs semana atual vs anterior
  - `v_weekly_team_performance`: Ranking de produtividade da equipe

  ## Funções criadas
  - `get_weekly_kpis(start, end)`: KPIs de qualquer período
  - `generate_weekly_report_text()`: Texto formatado do relatório

  ## Segurança
  - RLS habilitado em todas as novas tabelas
  - Funções SECURITY DEFINER com search_path fixo
*/

DROP VIEW IF EXISTS v_weekly_performance_summary CASCADE;
DROP VIEW IF EXISTS v_weekly_team_performance CASCADE;
DROP FUNCTION IF EXISTS generate_weekly_report_text() CASCADE;
DROP FUNCTION IF EXISTS get_weekly_kpis(timestamptz, timestamptz) CASCADE;

-- ─── 1. Tabela de configuração do agendamento ────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_report_schedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active       boolean NOT NULL DEFAULT true,
  day_of_week     integer NOT NULL DEFAULT 0,
  hour_of_day     integer NOT NULL DEFAULT 20,
  send_whatsapp   boolean NOT NULL DEFAULT true,
  send_email      boolean NOT NULL DEFAULT false,
  email_recipient text,
  custom_intro    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weekly_report_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_report_schedules' AND policyname='Authenticated can manage weekly schedules') THEN
    CREATE POLICY "Authenticated can manage weekly schedules"
      ON weekly_report_schedules FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_report_schedules' AND policyname='Authenticated can insert weekly schedules') THEN
    CREATE POLICY "Authenticated can insert weekly schedules"
      ON weekly_report_schedules FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_report_schedules' AND policyname='Authenticated can update weekly schedules') THEN
    CREATE POLICY "Authenticated can update weekly schedules"
      ON weekly_report_schedules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON weekly_report_schedules TO anon;

INSERT INTO weekly_report_schedules (is_active, day_of_week, hour_of_day, send_whatsapp, send_email)
SELECT true, 0, 20, true, false
WHERE NOT EXISTS (SELECT 1 FROM weekly_report_schedules LIMIT 1);

-- ─── 2. Tabela de histórico de relatórios ────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_report_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start      date NOT NULL,
  week_end        date NOT NULL,
  total_oss       integer NOT NULL DEFAULT 0,
  faturamento     numeric(12,2) NOT NULL DEFAULT 0,
  custos_totais   numeric(12,2) NOT NULL DEFAULT 0,
  lucro_liquido   numeric(12,2) NOT NULL DEFAULT 0,
  margem_pct      numeric(6,2)  NOT NULL DEFAULT 0,
  taxa_conclusao  numeric(6,2)  NOT NULL DEFAULT 0,
  var_faturamento numeric(6,2)  NOT NULL DEFAULT 0,
  report_text     text,
  sent_whatsapp   boolean NOT NULL DEFAULT false,
  sent_email      boolean NOT NULL DEFAULT false,
  whatsapp_status text NOT NULL DEFAULT 'pending',
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weekly_report_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_report_history' AND policyname='Authenticated can view report history') THEN
    CREATE POLICY "Authenticated can view report history"
      ON weekly_report_history FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_report_history' AND policyname='Authenticated can insert report history') THEN
    CREATE POLICY "Authenticated can insert report history"
      ON weekly_report_history FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='weekly_report_history' AND policyname='Authenticated can update report history') THEN
    CREATE POLICY "Authenticated can update report history"
      ON weekly_report_history FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON weekly_report_history TO anon;
CREATE INDEX IF NOT EXISTS idx_weekly_report_history_week ON weekly_report_history(week_start DESC);

-- ─── 3. Função auxiliar: KPIs de um período ──────────────────────────────────
CREATE OR REPLACE FUNCTION get_weekly_kpis(
  p_start timestamptz DEFAULT date_trunc('week', now()),
  p_end   timestamptz DEFAULT now()
)
RETURNS TABLE (
  total_oss        bigint,
  concluidas       bigint,
  faturamento      numeric,
  custos_materiais numeric,
  custos_mao_obra  numeric,
  custos_extras    numeric,
  custo_total      numeric,
  lucro_liquido    numeric,
  margem_pct       numeric,
  taxa_conclusao   numeric,
  ticket_medio     numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(so.id)::bigint AS total_oss,
    COUNT(so.id) FILTER (WHERE LOWER(so.status) IN ('completed','concluido','finalizado','concluída','finalizada'))::bigint AS concluidas,
    COALESCE(SUM(COALESCE(so.total_amount, so.total_value, 0)), 0) AS faturamento,
    COALESCE(SUM(COALESCE(so.materials_cost, 0)), 0) AS custos_materiais,
    COALESCE(SUM(COALESCE(so.labor_cost, 0)), 0) AS custos_mao_obra,
    COALESCE(SUM(COALESCE(so.unit_cost, 0)), 0) AS custos_extras,
    COALESCE(SUM(COALESCE(so.materials_cost,0) + COALESCE(so.labor_cost,0) + COALESCE(so.unit_cost,0)), 0) AS custo_total,
    COALESCE(SUM(COALESCE(so.total_amount, so.total_value, 0))
      - SUM(COALESCE(so.materials_cost,0) + COALESCE(so.labor_cost,0) + COALESCE(so.unit_cost,0)), 0) AS lucro_liquido,
    CASE
      WHEN COALESCE(SUM(COALESCE(so.total_amount, so.total_value, 0)), 0) > 0 THEN
        ROUND(
          (COALESCE(SUM(COALESCE(so.total_amount, so.total_value, 0)), 0)
           - COALESCE(SUM(COALESCE(so.materials_cost,0) + COALESCE(so.labor_cost,0) + COALESCE(so.unit_cost,0)), 0))
          / COALESCE(SUM(COALESCE(so.total_amount, so.total_value, 0)), 1) * 100, 2)
      ELSE 0
    END AS margem_pct,
    CASE
      WHEN COUNT(so.id) > 0 THEN
        ROUND(COUNT(so.id) FILTER (WHERE LOWER(so.status) IN ('completed','concluido','finalizado','concluída','finalizada'))::numeric / COUNT(so.id)::numeric * 100, 2)
      ELSE 0
    END AS taxa_conclusao,
    CASE
      WHEN COUNT(so.id) > 0 THEN
        ROUND(COALESCE(SUM(COALESCE(so.total_amount, so.total_value, 0)), 0) / COUNT(so.id), 2)
      ELSE 0
    END AS ticket_medio
  FROM service_orders so
  WHERE so.created_at >= p_start
    AND so.created_at <  p_end;
END;
$$;

-- ─── 4. View performance semanal ─────────────────────────────────────────────
CREATE OR REPLACE VIEW v_weekly_performance_summary AS
WITH
  semana_atual AS (
    SELECT * FROM get_weekly_kpis(date_trunc('week', now()), now())
  ),
  semana_anterior AS (
    SELECT * FROM get_weekly_kpis(
      date_trunc('week', now()) - INTERVAL '7 days',
      date_trunc('week', now())
    )
  )
SELECT
  date_trunc('week', now())::date                        AS semana_inicio,
  (date_trunc('week', now()) + INTERVAL '6 days')::date AS semana_fim,
  sa.total_oss,
  sa.concluidas,
  sa.faturamento,
  sa.custos_materiais,
  sa.custos_mao_obra,
  sa.custos_extras,
  sa.custo_total,
  sa.lucro_liquido,
  sa.margem_pct,
  sa.taxa_conclusao,
  sa.ticket_medio,
  COALESCE(sa_ant.faturamento, 0)    AS faturamento_semana_anterior,
  COALESCE(sa_ant.lucro_liquido, 0)  AS lucro_semana_anterior,
  COALESCE(sa_ant.taxa_conclusao, 0) AS taxa_conclusao_semana_anterior,
  CASE
    WHEN COALESCE(sa_ant.faturamento, 0) > 0
    THEN ROUND((sa.faturamento - sa_ant.faturamento) / sa_ant.faturamento * 100, 2)
    ELSE 0
  END AS variacao_faturamento_pct,
  CASE
    WHEN COALESCE(sa_ant.lucro_liquido, 0) <> 0
    THEN ROUND((sa.lucro_liquido - sa_ant.lucro_liquido) / ABS(sa_ant.lucro_liquido) * 100, 2)
    ELSE 0
  END AS variacao_lucro_pct
FROM semana_atual sa, semana_anterior sa_ant;

GRANT SELECT ON v_weekly_performance_summary TO anon, authenticated;

-- ─── 5. View ranking da equipe na semana ────────────────────────────────────
CREATE OR REPLACE VIEW v_weekly_team_performance AS
SELECT
  e.name                                AS tecnico_nome,
  COUNT(DISTINCT sot.service_order_id)  AS total_oss_semana,
  COUNT(DISTINCT sot.service_order_id) FILTER (
    WHERE LOWER(so.status) IN ('completed','concluido','finalizado','concluída','finalizada')
  )                                     AS oss_concluidas,
  COALESCE(SUM(COALESCE(so.total_amount, so.total_value, 0)), 0) AS faturamento_equipe,
  ROUND(
    COUNT(DISTINCT sot.service_order_id) FILTER (
      WHERE LOWER(so.status) IN ('completed','concluido','finalizado','concluída','finalizada')
    )::numeric / NULLIF(COUNT(DISTINCT sot.service_order_id), 0) * 100
  , 2)                                  AS taxa_conclusao_pct
FROM employees e
JOIN service_order_team sot ON sot.employee_id = e.id
JOIN service_orders so      ON so.id = sot.service_order_id
WHERE so.created_at >= date_trunc('week', now())
GROUP BY e.id, e.name
ORDER BY faturamento_equipe DESC;

GRANT SELECT ON v_weekly_team_performance TO anon, authenticated;

-- ─── 6. Função: gera texto do relatório ──────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_weekly_report_text()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kpis         RECORD;
  v_report       text;
  v_var_fat      numeric;
  v_var_icon     text;
  v_insight      text;
  v_app_url      text;
  v_top_tech     RECORD;
BEGIN
  SELECT * INTO v_kpis FROM v_weekly_performance_summary LIMIT 1;

  v_var_fat  := COALESCE(v_kpis.variacao_faturamento_pct, 0);
  v_var_icon := CASE WHEN v_var_fat >= 0 THEN '📈 +' ELSE '📉 ' END;

  SELECT value INTO v_app_url FROM company_settings WHERE key = 'app_url' LIMIT 1;
  v_app_url := COALESCE(v_app_url, 'https://app.giartech.com.br');

  SELECT tecnico_nome, oss_concluidas INTO v_top_tech
  FROM v_weekly_team_performance
  WHERE oss_concluidas > 0
  ORDER BY oss_concluidas DESC LIMIT 1;

  IF v_kpis.taxa_conclusao < 60 THEN
    v_insight := 'Alerta: taxa de conclusão baixa (' || v_kpis.taxa_conclusao || '%). Revisar gargalos operacionais.';
  ELSIF v_kpis.taxa_conclusao < 80 THEN
    v_insight := 'Semana razoável. Ainda há espaço para melhorar o ritmo de finalização.';
  ELSIF v_var_fat >= 10 THEN
    v_insight := 'Faturamento crescendo ' || v_var_fat || '% vs semana passada. Operação acelerando!';
  ELSIF v_kpis.margem_pct >= 35 THEN
    v_insight := 'Margem acima de 35%. Controle de custos excelente esta semana.';
  ELSIF v_kpis.lucro_liquido < 0 THEN
    v_insight := 'Atenção: resultado negativo esta semana. Revisar precificação e custos urgente.';
  ELSE
    v_insight := 'Operação saudável. Manter o ritmo e focar nas OS em aberto.';
  END IF;

  v_report :=
    '📊 *RELATÓRIO SEMANAL GIARTECH*' || E'\n' ||
    '━━━━━━━━━━━━━━━━━━━━━━' || E'\n' ||
    '📅 ' || TO_CHAR(v_kpis.semana_inicio, 'DD/MM') || ' a ' || TO_CHAR(v_kpis.semana_fim, 'DD/MM/YYYY') || E'\n\n' ||
    '💰 *Faturamento:* R$ ' || TO_CHAR(COALESCE(v_kpis.faturamento, 0), 'FM999G999D00') || E'\n' ||
    '    ' || v_var_icon || v_var_fat::text || '% vs semana anterior' || E'\n' ||
    '📦 *Custo Operacional:* R$ ' || TO_CHAR(COALESCE(v_kpis.custo_total, 0), 'FM999G999D00') || E'\n' ||
    '✅ *Lucro Líquido:* R$ ' || TO_CHAR(COALESCE(v_kpis.lucro_liquido, 0), 'FM999G999D00') || E'\n' ||
    '📊 *Margem:* ' || COALESCE(v_kpis.margem_pct, 0)::text || '%' || E'\n' ||
    '🎫 *Ticket Médio:* R$ ' || TO_CHAR(COALESCE(v_kpis.ticket_medio, 0), 'FM999G999D00') || E'\n\n' ||
    '📋 *Ordens de Serviço*' || E'\n' ||
    '    Total: ' || COALESCE(v_kpis.total_oss, 0)::text ||
    '  |  Concluídas: ' || COALESCE(v_kpis.concluidas, 0)::text || E'\n' ||
    '    Taxa de conclusão: ' || COALESCE(v_kpis.taxa_conclusao, 0)::text || '%';

  IF v_top_tech.tecnico_nome IS NOT NULL THEN
    v_report := v_report || E'\n\n' ||
      '🏆 *Destaque da Semana*' || E'\n' ||
      '    ' || v_top_tech.tecnico_nome || ' — ' || v_top_tech.oss_concluidas::text || ' OS concluídas';
  END IF;

  v_report := v_report || E'\n\n' ||
    '━━━━━━━━━━━━━━━━━━━━━━' || E'\n' ||
    '💡 *Insight Thomaz AI:* ' || v_insight || E'\n\n' ||
    '🔗 ' || v_app_url || '/cfo-dashboard';

  RETURN v_report;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_weekly_report_text() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_kpis(timestamptz, timestamptz) TO anon, authenticated;

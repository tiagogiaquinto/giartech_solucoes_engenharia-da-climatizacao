/*
  # Análises Avançadas Nível 2 - Versão Corrigida
  
  Análises Comparativas para Tomada de Decisão
*/

-- 1. TENDÊNCIAS MENSAIS
CREATE OR REPLACE VIEW v_tendencias_mensais AS
WITH monthly_data AS (
  SELECT
    DATE_TRUNC('month', created_at) as mes,
    COUNT(DISTINCT id) as total_os,
    COALESCE(SUM(total_value), 0) as faturamento,
    COALESCE(AVG(total_value), 0) as ticket_medio,
    COALESCE(SUM(lucro_total), 0) as lucro,
    COUNT(DISTINCT customer_id) as clientes_ativos
  FROM service_orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', created_at)
)
SELECT
  mes,
  total_os,
  faturamento,
  ticket_medio,
  lucro,
  clientes_ativos,
  LAG(faturamento) OVER (ORDER BY mes) as faturamento_mes_anterior,
  ROUND(((faturamento - LAG(faturamento) OVER (ORDER BY mes)) / NULLIF(LAG(faturamento) OVER (ORDER BY mes), 0)) * 100, 2) as crescimento_percent,
  ROUND(AVG(faturamento) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) as media_movel_3m,
  CASE
    WHEN faturamento > LAG(faturamento) OVER (ORDER BY mes) THEN 'Crescimento'
    WHEN faturamento < LAG(faturamento) OVER (ORDER BY mes) THEN 'Queda'
    ELSE 'Estável'
  END as tendencia
FROM monthly_data
ORDER BY mes DESC;

-- 2. RETENÇÃO DE CLIENTES SIMPLIFICADA
CREATE OR REPLACE VIEW v_retencao_clientes AS
WITH customer_first_purchase AS (
  SELECT
    customer_id,
    MIN(created_at) as primeira_compra,
    DATE_TRUNC('month', MIN(created_at)) as cohort_month
  FROM service_orders
  GROUP BY customer_id
),
customer_purchases AS (
  SELECT
    cfp.customer_id,
    cfp.cohort_month,
    COUNT(DISTINCT so.id) as total_compras,
    SUM(so.total_value) as valor_total,
    MAX(so.created_at) as ultima_compra,
    EXTRACT(DAY FROM (CURRENT_DATE - MAX(so.created_at))) as dias_desde_ultima_compra
  FROM customer_first_purchase cfp
  LEFT JOIN service_orders so ON so.customer_id = cfp.customer_id
  GROUP BY cfp.customer_id, cfp.cohort_month
)
SELECT
  cohort_month,
  COUNT(DISTINCT customer_id) as total_clientes,
  COUNT(DISTINCT CASE WHEN total_compras > 1 THEN customer_id END) as clientes_recorrentes,
  ROUND((COUNT(DISTINCT CASE WHEN total_compras > 1 THEN customer_id END)::numeric / NULLIF(COUNT(DISTINCT customer_id), 0)) * 100, 2) as taxa_retencao_percent,
  ROUND(AVG(total_compras), 2) as media_compras_por_cliente,
  ROUND(AVG(valor_total), 2) as ltv_medio,
  COUNT(DISTINCT CASE WHEN dias_desde_ultima_compra <= 30 THEN customer_id END) as clientes_ativos_30d,
  COUNT(DISTINCT CASE WHEN dias_desde_ultima_compra > 90 THEN customer_id END) as clientes_inativos_90d
FROM customer_purchases
GROUP BY cohort_month
ORDER BY cohort_month DESC;

-- 3. CICLO DE VENDAS
CREATE OR REPLACE VIEW v_ciclo_vendas AS
SELECT
  COUNT(*) as total_os,
  ROUND(AVG(EXTRACT(DAY FROM (updated_at - created_at))), 1) as ciclo_medio_dias,
  ROUND(MIN(EXTRACT(DAY FROM (updated_at - created_at))), 1) as ciclo_minimo_dias,
  ROUND(MAX(EXTRACT(DAY FROM (updated_at - created_at))), 1) as ciclo_maximo_dias,
  COUNT(CASE WHEN EXTRACT(DAY FROM (updated_at - created_at)) < 7 THEN 1 END) as os_rapidas_7d,
  COUNT(CASE WHEN EXTRACT(DAY FROM (updated_at - created_at)) > 30 THEN 1 END) as os_lentas_30d,
  ROUND((COUNT(CASE WHEN EXTRACT(DAY FROM (updated_at - created_at)) < 7 THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as percentual_rapidas
FROM service_orders
WHERE status IN ('concluido', 'completed')
  AND created_at >= CURRENT_DATE - INTERVAL '90 days';

-- 4. SAZONALIDADE
CREATE OR REPLACE VIEW v_sazonalidade AS
SELECT
  TO_CHAR(created_at, 'Day') as dia_semana,
  EXTRACT(DOW FROM created_at) as dia_num,
  COUNT(*) as total_os,
  COALESCE(SUM(total_value), 0) as faturamento,
  ROUND(AVG(total_value), 2) as ticket_medio,
  ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM service_orders WHERE created_at >= CURRENT_DATE - INTERVAL '90 days')) * 100, 2) as percentual_do_total
FROM service_orders
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
ORDER BY dia_num;

-- 5. PREVISÃO AVANÇADA
CREATE OR REPLACE VIEW v_previsao_avancada AS
SELECT
  (SELECT ROUND(AVG(faturamento), 2) FROM (
    SELECT DATE_TRUNC('month', created_at) as mes, SUM(total_value) as faturamento
    FROM service_orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      AND created_at < DATE_TRUNC('month', CURRENT_DATE)
      AND status IN ('concluido', 'completed')
    GROUP BY DATE_TRUNC('month', created_at)
  ) sub) as media_historica_6m,
  
  (SELECT COALESCE(SUM(total_value), 0) FROM service_orders 
   WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
   AND status IN ('concluido', 'completed')) as realizado_mes_atual,
  
  (SELECT COALESCE(SUM(total_value), 0) FROM service_orders 
   WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
   AND status IN ('em_andamento', 'in_progress')) as em_execucao,
  
  (SELECT COALESCE(SUM(total_value), 0) FROM service_orders 
   WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
   AND status = 'cotacao') as em_cotacao,
  
  (SELECT COALESCE(SUM(total_value), 0) FROM service_orders 
   WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
   AND status IN ('concluido', 'completed')) +
  (SELECT COALESCE(SUM(total_value), 0) FROM service_orders 
   WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
   AND status IN ('em_andamento', 'in_progress')) as previsao_conservadora,
  
  EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day') - CURRENT_DATE) as dias_restantes;

COMMENT ON VIEW v_tendencias_mensais IS 'Tendências mensais com crescimento e média móvel';
COMMENT ON VIEW v_retencao_clientes IS 'Taxa de retenção e LTV por cohort';
COMMENT ON VIEW v_ciclo_vendas IS 'Tempo médio do ciclo completo de vendas';
COMMENT ON VIEW v_sazonalidade IS 'Padrões de sazonalidade por dia da semana';
COMMENT ON VIEW v_previsao_avancada IS 'Previsão de faturamento com cenários';

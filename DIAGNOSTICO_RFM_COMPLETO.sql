-- ================================================
-- DIAGNÓSTICO E CORREÇÃO COMPLETA - ANÁLISE RFM
-- Execute este SQL no Supabase SQL Editor
-- ================================================

-- ==================================
-- 1. VERIFICAR VIEWS RFM
-- ==================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '1. VERIFICANDO VIEWS RFM';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- Verificar v_customer_rfm_metrics
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'v_customer_rfm_metrics'
  )
  THEN '✓ View v_customer_rfm_metrics EXISTE'
  ELSE '✗ View v_customer_rfm_metrics NÃO EXISTE - PRECISA CRIAR'
  END as status;

-- Verificar v_customer_rfm_segments
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'v_customer_rfm_segments'
  )
  THEN '✓ View v_customer_rfm_segments EXISTE'
  ELSE '✗ View v_customer_rfm_segments NÃO EXISTE - PRECISA CRIAR'
  END as status;

-- Verificar v_rfm_summary
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'v_rfm_summary'
  )
  THEN '✓ View v_rfm_summary EXISTE'
  ELSE '✗ View v_rfm_summary NÃO EXISTE - PRECISA CRIAR'
  END as status;

-- ==================================
-- 2. TESTAR DADOS DAS VIEWS
-- ==================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '2. TESTANDO DADOS DAS VIEWS';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- Testar v_rfm_summary (resumo por segmento)
SELECT
  segment,
  count as clientes,
  ROUND(avg_recency::numeric, 1) as dias_media,
  ROUND(avg_frequency::numeric, 1) as freq_media,
  ROUND(total_value::numeric, 2) as valor_total
FROM v_rfm_summary
ORDER BY total_value DESC;

-- Testar v_customer_rfm_segments (top 20 clientes)
SELECT
  segment,
  customer_name,
  email,
  recency_days,
  frequency_count,
  ROUND(monetary_value::numeric, 2) as valor,
  rfm_total
FROM v_customer_rfm_segments
ORDER BY monetary_value DESC
LIMIT 20;

-- ==================================
-- 3. VERIFICAR DADOS BASE
-- ==================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '3. VERIFICANDO DADOS BASE';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- Estatísticas gerais
SELECT
  'Clientes Cadastrados' as metrica,
  COUNT(*) as total
FROM customers
UNION ALL
SELECT
  'OSs Concluídas' as metrica,
  COUNT(*) as total
FROM service_orders
WHERE status = 'concluido'
UNION ALL
SELECT
  'OSs com Valor > 0' as metrica,
  COUNT(*) as total
FROM service_orders
WHERE status = 'concluido' AND total_amount > 0
UNION ALL
SELECT
  'Clientes com OSs' as metrica,
  COUNT(DISTINCT customer_id) as total
FROM service_orders
WHERE status = 'concluido';

-- Top 10 clientes por valor
SELECT
  c.name as cliente,
  c.email,
  COUNT(so.id) as total_os,
  ROUND(SUM(so.total_amount)::numeric, 2) as valor_total,
  MAX(so.completion_date) as ultima_os
FROM customers c
JOIN service_orders so ON so.customer_id = c.id
WHERE so.status = 'concluido'
  AND so.total_amount > 0
GROUP BY c.id, c.name, c.email
ORDER BY SUM(so.total_amount) DESC
LIMIT 10;

-- ==================================
-- 4. CRIAR VIEWS SE NÃO EXISTIREM
-- ==================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '4. CRIANDO VIEWS SE NECESSÁRIO';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- v_customer_rfm_metrics
CREATE OR REPLACE VIEW v_customer_rfm_metrics AS
WITH customer_metrics AS (
  SELECT
    c.id as customer_id,
    c.name as customer_name,
    c.email,
    COALESCE(EXTRACT(DAY FROM (NOW() - MAX(so.completion_date))), 999) as recency_days,
    COUNT(so.id) as frequency_count,
    COALESCE(SUM(so.total_amount), 0) as monetary_value
  FROM customers c
  LEFT JOIN service_orders so ON so.customer_id = c.id
    AND so.status = 'concluido'
    AND so.completion_date IS NOT NULL
  GROUP BY c.id, c.name, c.email
),
rfm_scores AS (
  SELECT
    *,
    NTILE(5) OVER (ORDER BY recency_days ASC) as r_score,
    NTILE(5) OVER (ORDER BY frequency_count DESC) as f_score,
    NTILE(5) OVER (ORDER BY monetary_value DESC) as m_score
  FROM customer_metrics
  WHERE frequency_count > 0
)
SELECT
  *,
  (r_score + f_score + m_score) as rfm_total
FROM rfm_scores;

-- v_customer_rfm_segments
CREATE OR REPLACE VIEW v_customer_rfm_segments AS
WITH rfm_data AS (
  SELECT * FROM v_customer_rfm_metrics
)
SELECT
  *,
  CASE
    WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
    WHEN r_score >= 3 AND f_score >= 4 AND m_score >= 3 THEN 'Loyal'
    WHEN r_score >= 4 AND f_score <= 2 AND m_score >= 3 THEN 'Potential'
    WHEN r_score <= 2 AND f_score >= 3 AND m_score >= 3 THEN 'At Risk'
    WHEN r_score <= 2 AND f_score <= 2 THEN 'Lost'
    WHEN r_score >= 4 AND f_score <= 1 THEN 'New'
    ELSE 'Other'
  END as segment
FROM rfm_data;

-- v_rfm_summary
CREATE OR REPLACE VIEW v_rfm_summary AS
SELECT
  segment,
  COUNT(*) as count,
  AVG(recency_days) as avg_recency,
  AVG(frequency_count) as avg_frequency,
  SUM(monetary_value) as total_value
FROM v_customer_rfm_segments
GROUP BY segment
ORDER BY total_value DESC;

-- ==================================
-- 5. VERIFICAR PERMISSÕES
-- ==================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '5. AJUSTANDO PERMISSÕES';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- Garantir acesso anônimo às views
GRANT SELECT ON v_customer_rfm_metrics TO anon, authenticated;
GRANT SELECT ON v_customer_rfm_segments TO anon, authenticated;
GRANT SELECT ON v_rfm_summary TO anon, authenticated;

-- ==================================
-- 6. TESTE FINAL
-- ==================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '6. TESTE FINAL - RESULTADO';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- Resumo por segmento
SELECT
  '📊 DISTRIBUIÇÃO POR SEGMENTO' as titulo,
  segment,
  count as clientes,
  ROUND(avg_recency::numeric, 0) || ' dias' as recencia_media,
  ROUND(avg_frequency::numeric, 1) || ' OSs' as freq_media,
  'R$ ' || ROUND(total_value::numeric, 2) as valor_total
FROM v_rfm_summary
ORDER BY total_value DESC;

-- Top 5 Champions
SELECT
  '🏆 TOP 5 CHAMPIONS' as titulo,
  customer_name,
  email,
  recency_days || ' dias' as ultima_compra,
  frequency_count || ' OSs' as total_os,
  'R$ ' || ROUND(monetary_value::numeric, 2) as valor_total
FROM v_customer_rfm_segments
WHERE segment = 'Champions'
ORDER BY monetary_value DESC
LIMIT 5;

-- Clientes em risco
SELECT
  '⚠️ CLIENTES EM RISCO' as titulo,
  customer_name,
  email,
  recency_days || ' dias sem comprar' as alerta,
  frequency_count || ' OSs anteriores' as historico,
  'R$ ' || ROUND(monetary_value::numeric, 2) as valor_historico
FROM v_customer_rfm_segments
WHERE segment = 'At Risk'
ORDER BY monetary_value DESC
LIMIT 5;

-- ==================================
-- 7. ESTATÍSTICAS FINAIS
-- ==================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ DIAGNÓSTICO COMPLETO';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

SELECT
  'Total de Clientes' as metrica,
  (SELECT COUNT(*) FROM customers)::text as valor
UNION ALL
SELECT
  'Clientes Segmentados',
  (SELECT COUNT(*) FROM v_customer_rfm_segments)::text
UNION ALL
SELECT
  'Champions',
  (SELECT COUNT(*) FROM v_customer_rfm_segments WHERE segment = 'Champions')::text
UNION ALL
SELECT
  'Loyal',
  (SELECT COUNT(*) FROM v_customer_rfm_segments WHERE segment = 'Loyal')::text
UNION ALL
SELECT
  'At Risk',
  (SELECT COUNT(*) FROM v_customer_rfm_segments WHERE segment = 'At Risk')::text
UNION ALL
SELECT
  'Lost',
  (SELECT COUNT(*) FROM v_customer_rfm_segments WHERE segment = 'Lost')::text
UNION ALL
SELECT
  'Valor Total OSs',
  'R$ ' || ROUND((SELECT SUM(total_value) FROM v_rfm_summary)::numeric, 2)::text;

-- ==================================
-- ✅ SQL CONCLUÍDO
-- ==================================

SELECT
  '=====================================' as linha,
  '✅ DIAGNÓSTICO RFM COMPLETO' as status,
  'Views criadas e testadas com sucesso!' as resultado,
  'Acesse /customer-rfm no sistema' as proximo_passo,
  '=====================================' as linha2;

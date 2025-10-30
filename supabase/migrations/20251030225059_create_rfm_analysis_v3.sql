/*
  # Sistema de Análise RFM v3
  
  Análise de Recência, Frequência e Valor Monetário dos clientes
*/

CREATE OR REPLACE VIEW v_customer_rfm_metrics AS
WITH customer_stats AS (
  SELECT 
    c.id as customer_id,
    COALESCE(c.nome_fantasia, c.nome_razao) as customer_name,
    c.email,
    
    -- Recência em dias
    COALESCE(
      (CURRENT_DATE - MAX(so.created_at::date))::integer,
      9999
    ) as recency_days,
    
    -- Frequência de compras
    COUNT(DISTINCT so.id)::integer as frequency_count,
    
    -- Valor monetário total
    COALESCE(SUM(so.total_amount), 0)::numeric as monetary_value
    
  FROM customers c
  LEFT JOIN service_orders so ON so.customer_id = c.id
    AND so.status IN ('concluido', 'completed')
  GROUP BY c.id, c.nome_fantasia, c.nome_razao, c.email
)
SELECT 
  customer_id,
  customer_name,
  email,
  recency_days,
  frequency_count,
  monetary_value,
  
  -- Scores RFM (1-5)
  CASE 
    WHEN recency_days <= 30 THEN 5
    WHEN recency_days <= 60 THEN 4
    WHEN recency_days <= 90 THEN 3
    WHEN recency_days <= 180 THEN 2
    ELSE 1
  END as r_score,
  
  CASE 
    WHEN frequency_count >= 10 THEN 5
    WHEN frequency_count >= 7 THEN 4
    WHEN frequency_count >= 4 THEN 3
    WHEN frequency_count >= 2 THEN 2
    ELSE 1
  END as f_score,
  
  CASE 
    WHEN monetary_value >= 50000 THEN 5
    WHEN monetary_value >= 20000 THEN 4
    WHEN monetary_value >= 10000 THEN 3
    WHEN monetary_value >= 5000 THEN 2
    WHEN monetary_value > 0 THEN 1
    ELSE 0
  END as m_score
  
FROM customer_stats;

CREATE OR REPLACE VIEW v_customer_rfm_segments AS
SELECT 
  customer_id,
  customer_name,
  email,
  recency_days,
  frequency_count,
  monetary_value,
  r_score,
  f_score,
  m_score,
  (r_score + f_score + m_score) as rfm_total,
  
  CASE 
    WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
    WHEN f_score >= 4 AND m_score >= 3 THEN 'Loyal'
    WHEN r_score >= 3 AND f_score >= 3 THEN 'Potential'
    WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
    WHEN r_score <= 2 AND f_score <= 2 THEN 'Lost'
    WHEN frequency_count = 0 THEN 'New'
    ELSE 'Other'
  END as segment
  
FROM v_customer_rfm_metrics;

CREATE OR REPLACE VIEW v_rfm_summary AS
SELECT 
  segment,
  COUNT(*) as count,
  ROUND(AVG(recency_days)) as avg_recency,
  ROUND(AVG(frequency_count)) as avg_frequency,
  ROUND(SUM(monetary_value)) as total_value
FROM v_customer_rfm_segments
GROUP BY segment
ORDER BY total_value DESC;

COMMENT ON VIEW v_customer_rfm_metrics IS 'Métricas RFM por cliente';
COMMENT ON VIEW v_customer_rfm_segments IS 'Segmentação de clientes por RFM';
COMMENT ON VIEW v_rfm_summary IS 'Resumo por segmento';

/*
  # Adicionar Status de Cotação/Orçamento - Versão Final

  1. Alterações
    - Adicionar status 'cotacao' e 'orcamento'
    - Criar estrutura para análise de conversão
    - Adicionar colunas de rastreamento

  2. Novo Fluxo
    cotacao → pendente → em_andamento → concluido
*/

-- Remover constraint antiga
ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;

-- Adicionar constraint com novos status incluindo cotação
ALTER TABLE service_orders ADD CONSTRAINT service_orders_status_check 
CHECK (status IN (
  'cotacao', 'orcamento', 'quote', 'budget',
  'pendente', 'aberta', 'pending', 'open',
  'em_andamento', 'pausado', 'in_progress', 'paused',
  'concluido', 'finalizada', 'completed', 'finished',
  'cancelada', 'cancelado', 'cancelled', 'excluida', 'deleted'
));

-- Criar índice para análise
CREATE INDEX IF NOT EXISTS idx_service_orders_status_created 
ON service_orders(status, created_at);

-- Adicionar coluna origem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'origem'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN origem text DEFAULT 'manual';
    COMMENT ON COLUMN service_orders.origem IS 'Origem: manual, cotacao_aprovada, telefone, whatsapp';
  END IF;
END $$;

-- Adicionar coluna data_aprovacao_cotacao
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'data_aprovacao_cotacao'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN data_aprovacao_cotacao timestamptz;
    COMMENT ON COLUMN service_orders.data_aprovacao_cotacao IS 'Data de aprovação da cotação';
  END IF;
END $$;

-- View para taxa de conversão (sem usar valor_total)
CREATE OR REPLACE VIEW v_conversion_rate AS
SELECT 
  COUNT(*) FILTER (WHERE status IN ('cotacao', 'orcamento', 'quote', 'budget')) as total_cotacoes,
  COUNT(*) FILTER (WHERE status NOT IN ('cotacao', 'orcamento', 'quote', 'budget', 'cancelada', 'cancelado', 'cancelled')) as total_os_aprovadas,
  COUNT(*) FILTER (WHERE status IN ('concluido', 'finalizada', 'completed', 'finished')) as total_concluidas,
  COUNT(*) FILTER (WHERE status IN ('cancelada', 'cancelado', 'cancelled')) as total_canceladas,
  ROUND(
    COUNT(*) FILTER (WHERE status NOT IN ('cotacao', 'orcamento', 'quote', 'budget', 'cancelada', 'cancelado', 'cancelled'))::numeric * 100.0 / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('cotacao', 'orcamento', 'quote', 'budget')), 0), 
    2
  ) as taxa_conversao_cotacao_para_os,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('concluido', 'finalizada', 'completed', 'finished'))::numeric * 100.0 / 
    NULLIF(COUNT(*) FILTER (WHERE status NOT IN ('cotacao', 'orcamento', 'quote', 'budget', 'cancelada', 'cancelado', 'cancelled')), 0), 
    2
  ) as taxa_conclusao_os
FROM service_orders;

-- View para funil mensal
CREATE OR REPLACE VIEW v_conversion_funnel_monthly AS
SELECT 
  DATE_TRUNC('month', created_at)::date as mes,
  COUNT(*) FILTER (WHERE status IN ('cotacao', 'orcamento', 'quote', 'budget')) as cotacoes,
  COUNT(*) FILTER (WHERE status IN ('pendente', 'aberta', 'pending', 'open')) as os_pendentes,
  COUNT(*) FILTER (WHERE status IN ('em_andamento', 'in_progress')) as os_em_andamento,
  COUNT(*) FILTER (WHERE status IN ('concluido', 'finalizada', 'completed', 'finished')) as os_concluidas,
  COUNT(*) FILTER (WHERE status IN ('cancelada', 'cancelado', 'cancelled')) as os_canceladas,
  COUNT(*) as total
FROM service_orders
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- Função para estatísticas de conversão
CREATE OR REPLACE FUNCTION get_conversion_stats()
RETURNS TABLE (
  total_cotacoes bigint,
  total_convertidas bigint,
  total_concluidas bigint,
  taxa_conversao numeric,
  taxa_conclusao numeric,
  tempo_medio_conversao interval
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('cotacao', 'orcamento', 'quote', 'budget')) as total_cotacoes,
    COUNT(*) FILTER (WHERE status NOT IN ('cotacao', 'orcamento', 'quote', 'budget', 'cancelada', 'cancelado', 'cancelled')) as total_convertidas,
    COUNT(*) FILTER (WHERE status IN ('concluido', 'finalizada', 'completed', 'finished')) as total_concluidas,
    ROUND(
      COUNT(*) FILTER (WHERE status NOT IN ('cotacao', 'orcamento', 'quote', 'budget', 'cancelada', 'cancelado', 'cancelled'))::numeric * 100.0 / 
      NULLIF(COUNT(*) FILTER (WHERE status IN ('cotacao', 'orcamento', 'quote', 'budget')), 0), 
      2
    ) as taxa_conversao,
    ROUND(
      COUNT(*) FILTER (WHERE status IN ('concluido', 'finalizada', 'completed', 'finished'))::numeric * 100.0 / 
      NULLIF(COUNT(*) FILTER (WHERE status NOT IN ('cotacao', 'orcamento', 'quote', 'budget', 'cancelada', 'cancelado', 'cancelled')), 0), 
      2
    ) as taxa_conclusao,
    AVG(data_aprovacao_cotacao - created_at) FILTER (WHERE data_aprovacao_cotacao IS NOT NULL) as tempo_medio_conversao
  FROM service_orders;
END;
$$;

COMMENT ON CONSTRAINT service_orders_status_check ON service_orders IS 'Status incluindo cotação para análise de conversão';
COMMENT ON VIEW v_conversion_rate IS 'Métricas de conversão de cotação para OS';
COMMENT ON VIEW v_conversion_funnel_monthly IS 'Funil de conversão por mês';
COMMENT ON FUNCTION get_conversion_stats IS 'Estatísticas completas de conversão';

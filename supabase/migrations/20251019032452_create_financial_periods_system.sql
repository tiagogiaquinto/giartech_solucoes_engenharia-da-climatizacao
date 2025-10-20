/*
  # Sistema Completo de Períodos Financeiros

  ## Objetivo
  Criar tabela de períodos financeiros e popular com dados dos últimos 24 meses

  ## 1. Nova Tabela
  - `financial_periods` - Armazena períodos mensais, trimestrais e anuais

  ## 2. Dados Iniciais
  - Últimos 24 meses
  - Últimos 8 trimestres
  - Últimos 3 anos

  ## 3. Segurança
  - RLS habilitado
  - Acesso anônimo permitido para leitura
*/

-- ============================================================================
-- 1. CRIAR TABELA DE PERÍODOS FINANCEIROS
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name text NOT NULL,
  period_type text NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  fiscal_year integer NOT NULL,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(period_type, start_date, end_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_periods_type ON financial_periods(period_type);
CREATE INDEX IF NOT EXISTS idx_financial_periods_dates ON financial_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_financial_periods_year ON financial_periods(fiscal_year);

-- ============================================================================
-- 2. HABILITAR RLS
-- ============================================================================

ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;

-- Policy para leitura (todos podem ler)
CREATE POLICY "Allow anonymous read access to financial_periods"
  ON financial_periods
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated read access to financial_periods"
  ON financial_periods
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy para inserção (apenas authenticated)
CREATE POLICY "Allow authenticated insert to financial_periods"
  ON financial_periods
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy para atualização (apenas authenticated)
CREATE POLICY "Allow authenticated update to financial_periods"
  ON financial_periods
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. FUNÇÃO PARA GERAR PERÍODOS AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_financial_periods(
  p_start_date date DEFAULT DATE_TRUNC('year', CURRENT_DATE - INTERVAL '2 years')::date,
  p_end_date date DEFAULT (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year')::date
)
RETURNS void AS $$
DECLARE
  v_date date;
  v_month_start date;
  v_month_end date;
  v_quarter_start date;
  v_quarter_end date;
  v_year_start date;
  v_year_end date;
  v_fiscal_year integer;
BEGIN
  -- Gerar períodos mensais
  v_date := DATE_TRUNC('month', p_start_date)::date;
  
  WHILE v_date <= p_end_date LOOP
    v_month_start := v_date;
    v_month_end := (v_date + INTERVAL '1 month' - INTERVAL '1 day')::date;
    v_fiscal_year := EXTRACT(YEAR FROM v_date)::integer;
    
    INSERT INTO financial_periods (
      period_name,
      period_type,
      start_date,
      end_date,
      fiscal_year
    ) VALUES (
      TO_CHAR(v_date, 'Mon/YYYY'),
      'monthly',
      v_month_start,
      v_month_end,
      v_fiscal_year
    )
    ON CONFLICT (period_type, start_date, end_date) DO NOTHING;
    
    v_date := v_date + INTERVAL '1 month';
  END LOOP;

  -- Gerar períodos trimestrais
  v_date := DATE_TRUNC('quarter', p_start_date)::date;
  
  WHILE v_date <= p_end_date LOOP
    v_quarter_start := v_date;
    v_quarter_end := (v_date + INTERVAL '3 months' - INTERVAL '1 day')::date;
    v_fiscal_year := EXTRACT(YEAR FROM v_date)::integer;
    
    INSERT INTO financial_periods (
      period_name,
      period_type,
      start_date,
      end_date,
      fiscal_year
    ) VALUES (
      'Q' || EXTRACT(QUARTER FROM v_date)::text || '/' || EXTRACT(YEAR FROM v_date)::text,
      'quarterly',
      v_quarter_start,
      v_quarter_end,
      v_fiscal_year
    )
    ON CONFLICT (period_type, start_date, end_date) DO NOTHING;
    
    v_date := v_date + INTERVAL '3 months';
  END LOOP;

  -- Gerar períodos anuais
  v_date := DATE_TRUNC('year', p_start_date)::date;
  
  WHILE v_date <= p_end_date LOOP
    v_year_start := v_date;
    v_year_end := (v_date + INTERVAL '1 year' - INTERVAL '1 day')::date;
    v_fiscal_year := EXTRACT(YEAR FROM v_date)::integer;
    
    INSERT INTO financial_periods (
      period_name,
      period_type,
      start_date,
      end_date,
      fiscal_year
    ) VALUES (
      EXTRACT(YEAR FROM v_date)::text,
      'annual',
      v_year_start,
      v_year_end,
      v_fiscal_year
    )
    ON CONFLICT (period_type, start_date, end_date) DO NOTHING;
    
    v_date := v_date + INTERVAL '1 year';
  END LOOP;

  RAISE NOTICE 'Períodos financeiros gerados com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. POPULAR COM DADOS INICIAIS
-- ============================================================================

-- Gerar períodos dos últimos 2 anos até o próximo ano
SELECT generate_financial_periods(
  (DATE_TRUNC('year', CURRENT_DATE - INTERVAL '2 years'))::date,
  (DATE_TRUNC('year', CURRENT_DATE + INTERVAL '1 year') + INTERVAL '1 year' - INTERVAL '1 day')::date
);

-- ============================================================================
-- 5. TRIGGER PARA ATUALIZAR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_financial_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_financial_periods_updated_at ON financial_periods;

CREATE TRIGGER trigger_update_financial_periods_updated_at
  BEFORE UPDATE ON financial_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_periods_updated_at();

-- ============================================================================
-- 6. COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE financial_periods IS 'Períodos financeiros para análise e relatórios (mensal, trimestral, anual)';
COMMENT ON FUNCTION generate_financial_periods IS 'Gera automaticamente períodos financeiros para um intervalo de datas';

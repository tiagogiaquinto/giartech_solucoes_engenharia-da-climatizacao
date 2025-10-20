/*
  # Sistema Completo de Indicadores Financeiros Avançados

  ## Objetivo
  Implementar sistema robusto de análise financeira com:
  - EBITDA (Earnings Before Interest, Taxes, Depreciation and Amortization)
  - Margens (Bruta, Operacional, Líquida)
  - Capital de Giro
  - ROI (Return on Investment)
  - Fluxo de Caixa (Operacional, Investimento, Financiamento)
  - Análise de DRE (Demonstrativo de Resultado do Exercício)
  - Índices de Liquidez
  - Ponto de Equilíbrio
  - EBIT, EVA, Payback

  ## 1. Novas Tabelas

  ### financial_periods
  Períodos fiscais para análise (mensal, trimestral, anual)

  ### financial_indicators
  Armazena indicadores calculados por período

  ### cash_flow_entries
  Entradas detalhadas de fluxo de caixa categorizadas

  ### working_capital_items
  Itens que compõem o capital de giro (ativos e passivos circulantes)

  ### depreciation_schedule
  Cronograma de depreciação de ativos

  ### financial_goals
  Metas financeiras por indicador e período

  ## 2. Views Calculadas

  Criação de views SQL para cálculos automáticos dos indicadores

  ## 3. Security

  RLS habilitado em todas as tabelas
*/

-- ============================================================================
-- 1. TABELA: PERÍODOS FINANCEIROS
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type text NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly', 'custom')),
  period_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  fiscal_year integer NOT NULL,
  is_closed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_period UNIQUE (period_type, start_date, end_date)
);

ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on financial_periods"
  ON financial_periods FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_financial_periods_dates
  ON financial_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_financial_periods_type
  ON financial_periods(period_type);

-- ============================================================================
-- 2. TABELA: INDICADORES FINANCEIROS CALCULADOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid REFERENCES financial_periods(id) ON DELETE CASCADE,

  -- RECEITAS E CUSTOS
  total_revenue numeric(15,2) DEFAULT 0,
  cogs numeric(15,2) DEFAULT 0,
  gross_profit numeric(15,2) DEFAULT 0,
  gross_margin_percent numeric(5,2) DEFAULT 0,

  -- DESPESAS OPERACIONAIS
  operating_expenses numeric(15,2) DEFAULT 0,
  sales_expenses numeric(15,2) DEFAULT 0,
  administrative_expenses numeric(15,2) DEFAULT 0,
  depreciation numeric(15,2) DEFAULT 0,
  amortization numeric(15,2) DEFAULT 0,

  -- EBIT E EBITDA
  ebit numeric(15,2) DEFAULT 0,
  ebitda numeric(15,2) DEFAULT 0,
  ebitda_margin_percent numeric(5,2) DEFAULT 0,

  -- RESULTADO LÍQUIDO
  financial_result numeric(15,2) DEFAULT 0,
  taxes numeric(15,2) DEFAULT 0,
  net_income numeric(15,2) DEFAULT 0,
  net_margin_percent numeric(5,2) DEFAULT 0,

  -- CAPITAL DE GIRO
  current_assets numeric(15,2) DEFAULT 0,
  current_liabilities numeric(15,2) DEFAULT 0,
  working_capital numeric(15,2) DEFAULT 0,
  working_capital_ratio numeric(5,2) DEFAULT 0,

  -- FLUXO DE CAIXA
  operating_cash_flow numeric(15,2) DEFAULT 0,
  investing_cash_flow numeric(15,2) DEFAULT 0,
  financing_cash_flow numeric(15,2) DEFAULT 0,
  net_cash_flow numeric(15,2) DEFAULT 0,

  -- ÍNDICES DE LIQUIDEZ
  current_ratio numeric(5,2) DEFAULT 0,
  quick_ratio numeric(5,2) DEFAULT 0,
  cash_ratio numeric(5,2) DEFAULT 0,

  -- RENTABILIDADE
  roi_percent numeric(5,2) DEFAULT 0,
  roe_percent numeric(5,2) DEFAULT 0,
  roa_percent numeric(5,2) DEFAULT 0,

  -- PONTO DE EQUILÍBRIO
  break_even_point numeric(15,2) DEFAULT 0,
  safety_margin_percent numeric(5,2) DEFAULT 0,

  -- EVA (Economic Value Added)
  eva numeric(15,2) DEFAULT 0,

  -- METADADOS
  calculation_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE financial_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on financial_indicators"
  ON financial_indicators FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_financial_indicators_period
  ON financial_indicators(period_id);

-- ============================================================================
-- 3. TABELA: FLUXO DE CAIXA DETALHADO
-- ============================================================================

CREATE TABLE IF NOT EXISTS cash_flow_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid REFERENCES financial_periods(id) ON DELETE CASCADE,
  entry_date date NOT NULL,

  -- CLASSIFICAÇÃO
  flow_type text NOT NULL CHECK (flow_type IN ('operating', 'investing', 'financing')),
  category text NOT NULL,
  subcategory text,

  -- VALORES
  description text NOT NULL,
  amount numeric(15,2) NOT NULL,
  is_inflow boolean NOT NULL,

  -- RELACIONAMENTOS
  finance_entry_id uuid,
  service_order_id uuid,
  purchase_id uuid,

  -- METADADOS
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cash_flow_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on cash_flow_entries"
  ON cash_flow_entries FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_period
  ON cash_flow_entries(period_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_date
  ON cash_flow_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_type
  ON cash_flow_entries(flow_type);

-- ============================================================================
-- 4. TABELA: ITENS DO CAPITAL DE GIRO
-- ============================================================================

CREATE TABLE IF NOT EXISTS working_capital_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid REFERENCES financial_periods(id) ON DELETE CASCADE,

  -- CLASSIFICAÇÃO
  item_type text NOT NULL CHECK (item_type IN ('current_asset', 'current_liability')),
  category text NOT NULL,
  description text NOT NULL,

  -- VALORES
  amount numeric(15,2) NOT NULL,
  due_date date,

  -- RELACIONAMENTOS
  customer_id uuid,
  supplier_id uuid,

  -- METADADOS
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE working_capital_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on working_capital_items"
  ON working_capital_items FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_working_capital_items_period
  ON working_capital_items(period_id);
CREATE INDEX IF NOT EXISTS idx_working_capital_items_type
  ON working_capital_items(item_type);

-- ============================================================================
-- 5. TABELA: CRONOGRAMA DE DEPRECIAÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS depreciation_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ATIVO
  asset_name text NOT NULL,
  asset_category text,
  purchase_date date NOT NULL,
  purchase_value numeric(15,2) NOT NULL,

  -- DEPRECIAÇÃO
  depreciation_method text DEFAULT 'linear' CHECK (depreciation_method IN ('linear', 'declining_balance', 'units_of_production')),
  useful_life_years integer NOT NULL,
  residual_value numeric(15,2) DEFAULT 0,

  -- CÁLCULO
  annual_depreciation numeric(15,2) GENERATED ALWAYS AS (
    CASE
      WHEN depreciation_method = 'linear'
      THEN (purchase_value - residual_value) / useful_life_years
      ELSE 0
    END
  ) STORED,

  monthly_depreciation numeric(15,2) GENERATED ALWAYS AS (
    CASE
      WHEN depreciation_method = 'linear'
      THEN (purchase_value - residual_value) / useful_life_years / 12
      ELSE 0
    END
  ) STORED,

  -- STATUS
  is_active boolean DEFAULT true,
  start_depreciation_date date,

  -- METADADOS
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE depreciation_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on depreciation_schedule"
  ON depreciation_schedule FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_active
  ON depreciation_schedule(is_active);

-- ============================================================================
-- 6. TABELA: METAS FINANCEIRAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid REFERENCES financial_periods(id) ON DELETE CASCADE,

  -- INDICADOR
  indicator_name text NOT NULL,
  indicator_category text NOT NULL,

  -- META
  target_value numeric(15,2) NOT NULL,
  actual_value numeric(15,2),
  unit text DEFAULT 'currency',

  -- STATUS
  achievement_percent numeric(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN target_value > 0
      THEN (actual_value / target_value * 100)
      ELSE 0
    END
  ) STORED,

  status text GENERATED ALWAYS AS (
    CASE
      WHEN actual_value IS NULL THEN 'pending'
      WHEN actual_value >= target_value THEN 'achieved'
      WHEN actual_value >= (target_value * 0.8) THEN 'on_track'
      ELSE 'below_target'
    END
  ) STORED,

  -- METADADOS
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on financial_goals"
  ON financial_goals FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_financial_goals_period
  ON financial_goals(period_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_indicator
  ON financial_goals(indicator_name);

-- ============================================================================
-- 7. VIEW: RESUMO FINANCEIRO POR PERÍODO
-- ============================================================================

CREATE OR REPLACE VIEW v_financial_summary AS
SELECT
  fp.id as period_id,
  fp.period_name,
  fp.period_type,
  fp.start_date,
  fp.end_date,
  fp.fiscal_year,

  -- RECEITAS E DESPESAS
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' AND fe.status IN ('recebido', 'a_receber') THEN fe.valor ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' AND fe.status IN ('pago', 'a_pagar') THEN fe.valor ELSE 0 END), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' AND fe.status IN ('recebido', 'a_receber') THEN fe.valor ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' AND fe.status IN ('pago', 'a_pagar') THEN fe.valor ELSE 0 END), 0) as net_result,

  -- FLUXO DE CAIXA REALIZADO
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' AND fe.status = 'recebido' THEN fe.valor ELSE 0 END), 0) as cash_inflow,
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' AND fe.status = 'pago' THEN fe.valor ELSE 0 END), 0) as cash_outflow,
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' AND fe.status = 'recebido' THEN fe.valor ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' AND fe.status = 'pago' THEN fe.valor ELSE 0 END), 0) as net_cash_flow,

  -- CONTAS A RECEBER E PAGAR
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' AND fe.status = 'a_receber' THEN fe.valor ELSE 0 END), 0) as accounts_receivable,
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' AND fe.status = 'a_pagar' THEN fe.valor ELSE 0 END), 0) as accounts_payable

FROM financial_periods fp
LEFT JOIN finance_entries fe ON fe.data >= fp.start_date AND fe.data <= fp.end_date
GROUP BY fp.id, fp.period_name, fp.period_type, fp.start_date, fp.end_date, fp.fiscal_year
ORDER BY fp.start_date DESC;

-- ============================================================================
-- 8. VIEW: ANÁLISE DE MARGEM POR PERÍODO
-- ============================================================================

CREATE OR REPLACE VIEW v_margin_analysis AS
SELECT
  fp.id as period_id,
  fp.period_name,
  fp.start_date,
  fp.end_date,

  -- RECEITAS
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) as total_revenue,

  -- CUSTOS (CMV/CPV)
  COALESCE(SUM(CASE
    WHEN fe.tipo = 'despesa'
    AND fc.category_type = 'cogs'
    THEN fe.valor ELSE 0 END), 0) as cogs,

  -- MARGEM BRUTA
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) -
  COALESCE(SUM(CASE
    WHEN fe.tipo = 'despesa'
    AND fc.category_type = 'cogs'
    THEN fe.valor ELSE 0 END), 0) as gross_profit,

  CASE
    WHEN SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) > 0
    THEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) -
          SUM(CASE WHEN fe.tipo = 'despesa' AND fc.category_type = 'cogs' THEN fe.valor ELSE 0 END)) /
          SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) * 100)
    ELSE 0
  END as gross_margin_percent,

  -- DESPESAS OPERACIONAIS
  COALESCE(SUM(CASE
    WHEN fe.tipo = 'despesa'
    AND fc.category_type = 'operating'
    THEN fe.valor ELSE 0 END), 0) as operating_expenses,

  -- MARGEM OPERACIONAL (EBIT)
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' AND fc.category_type IN ('cogs', 'operating') THEN fe.valor ELSE 0 END), 0) as ebit,

  CASE
    WHEN SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) > 0
    THEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) -
          SUM(CASE WHEN fe.tipo = 'despesa' AND fc.category_type IN ('cogs', 'operating') THEN fe.valor ELSE 0 END)) /
          SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) * 100)
    ELSE 0
  END as operating_margin_percent

FROM financial_periods fp
LEFT JOIN finance_entries fe ON fe.data >= fp.start_date AND fe.data <= fp.end_date
LEFT JOIN financial_categories fc ON fe.category_id = fc.id
GROUP BY fp.id, fp.period_name, fp.start_date, fp.end_date
ORDER BY fp.start_date DESC;

-- ============================================================================
-- 9. VIEW: CAPITAL DE GIRO POR PERÍODO
-- ============================================================================

CREATE OR REPLACE VIEW v_working_capital AS
SELECT
  fp.id as period_id,
  fp.period_name,
  fp.start_date,
  fp.end_date,

  -- ATIVO CIRCULANTE
  COALESCE(SUM(CASE WHEN wc.item_type = 'current_asset' THEN wc.amount ELSE 0 END), 0) as current_assets,

  -- PASSIVO CIRCULANTE
  COALESCE(SUM(CASE WHEN wc.item_type = 'current_liability' THEN wc.amount ELSE 0 END), 0) as current_liabilities,

  -- CAPITAL DE GIRO
  COALESCE(SUM(CASE WHEN wc.item_type = 'current_asset' THEN wc.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN wc.item_type = 'current_liability' THEN wc.amount ELSE 0 END), 0) as working_capital,

  -- ÍNDICE DE LIQUIDEZ CORRENTE
  CASE
    WHEN SUM(CASE WHEN wc.item_type = 'current_liability' THEN wc.amount ELSE 0 END) > 0
    THEN SUM(CASE WHEN wc.item_type = 'current_asset' THEN wc.amount ELSE 0 END) /
         SUM(CASE WHEN wc.item_type = 'current_liability' THEN wc.amount ELSE 0 END)
    ELSE 0
  END as current_ratio

FROM financial_periods fp
LEFT JOIN working_capital_items wc ON wc.period_id = fp.id
GROUP BY fp.id, fp.period_name, fp.start_date, fp.end_date
ORDER BY fp.start_date DESC;

-- ============================================================================
-- 10. FUNÇÃO: CALCULAR EBITDA
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_ebitda(
  p_period_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS TABLE (
  revenue numeric,
  cogs numeric,
  operating_expenses numeric,
  ebitda numeric,
  ebitda_margin numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- RECEITA TOTAL
    COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) as revenue,

    -- CUSTO DOS PRODUTOS/SERVIÇOS VENDIDOS
    COALESCE(SUM(CASE
      WHEN fe.tipo = 'despesa' AND fc.category_type = 'cogs'
      THEN fe.valor ELSE 0 END), 0) as cogs,

    -- DESPESAS OPERACIONAIS (exceto depreciação e amortização)
    COALESCE(SUM(CASE
      WHEN fe.tipo = 'despesa'
      AND fc.category_type = 'operating'
      AND fc.name NOT ILIKE '%deprecia%'
      AND fc.name NOT ILIKE '%amortiza%'
      THEN fe.valor ELSE 0 END), 0) as operating_expenses,

    -- EBITDA = Receita - COGS - Despesas Operacionais
    COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' AND fc.category_type IN ('cogs', 'operating')
      AND fc.name NOT ILIKE '%deprecia%'
      AND fc.name NOT ILIKE '%amortiza%'
      THEN fe.valor ELSE 0 END), 0) as ebitda,

    -- MARGEM EBITDA
    CASE
      WHEN SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) > 0
      THEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) -
            SUM(CASE WHEN fe.tipo = 'despesa' AND fc.category_type IN ('cogs', 'operating')
              AND fc.name NOT ILIKE '%deprecia%'
              AND fc.name NOT ILIKE '%amortiza%'
              THEN fe.valor ELSE 0 END)) /
            SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) * 100)
      ELSE 0
    END as ebitda_margin

  FROM finance_entries fe
  LEFT JOIN financial_categories fc ON fe.category_id = fc.id
  WHERE fe.data >= p_start_date AND fe.data <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. FUNÇÃO: CALCULAR ROI
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_roi(
  p_period_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS TABLE (
  total_investment numeric,
  total_return numeric,
  roi_percent numeric,
  roi_category text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- INVESTIMENTO TOTAL
    COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END), 0) as total_investment,

    -- RETORNO TOTAL (Receita - Despesa)
    COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END), 0) as total_return,

    -- ROI = (Retorno - Investimento) / Investimento * 100
    CASE
      WHEN SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END) > 0
      THEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) -
            SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END)) /
            SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END) * 100)
      ELSE 0
    END as roi_percent,

    -- CLASSIFICAÇÃO DO ROI
    CASE
      WHEN SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END) = 0 THEN 'no_investment'
      WHEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) -
            SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END)) /
            SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END) * 100) > 20 THEN 'excellent'
      WHEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) -
            SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END)) /
            SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END) * 100) > 10 THEN 'good'
      WHEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) -
            SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END)) /
            SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END) * 100) > 0 THEN 'positive'
      ELSE 'negative'
    END as roi_category

  FROM finance_entries fe
  WHERE fe.data >= p_start_date AND fe.data <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. TRIGGER: ATUALIZAR TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_periods_updated_at
  BEFORE UPDATE ON financial_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_indicators_updated_at
  BEFORE UPDATE ON financial_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_flow_entries_updated_at
  BEFORE UPDATE ON cash_flow_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_working_capital_items_updated_at
  BEFORE UPDATE ON working_capital_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_depreciation_schedule_updated_at
  BEFORE UPDATE ON depreciation_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. INSERIR PERÍODOS PADRÃO (ÚLTIMO ANO)
-- ============================================================================

DO $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM CURRENT_DATE);
  v_month integer;
BEGIN
  -- CRIAR PERÍODO ANUAL
  INSERT INTO financial_periods (period_type, period_name, start_date, end_date, fiscal_year)
  VALUES (
    'yearly',
    'Ano ' || v_year,
    (v_year || '-01-01')::date,
    (v_year || '-12-31')::date,
    v_year
  ) ON CONFLICT DO NOTHING;

  -- CRIAR PERÍODOS MENSAIS
  FOR v_month IN 1..12 LOOP
    INSERT INTO financial_periods (period_type, period_name, start_date, end_date, fiscal_year)
    VALUES (
      'monthly',
      to_char((v_year || '-' || v_month || '-01')::date, 'Mon/YYYY'),
      (v_year || '-' || v_month || '-01')::date,
      (DATE_TRUNC('month', (v_year || '-' || v_month || '-01')::date) + INTERVAL '1 month - 1 day')::date,
      v_year
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- CRIAR PERÍODOS TRIMESTRAIS
  FOR v_month IN 1..4 LOOP
    INSERT INTO financial_periods (period_type, period_name, start_date, end_date, fiscal_year)
    VALUES (
      'quarterly',
      'Q' || v_month || '/' || v_year,
      (v_year || '-' || ((v_month-1)*3 + 1) || '-01')::date,
      (DATE_TRUNC('month', (v_year || '-' || (v_month*3) || '-01')::date) + INTERVAL '1 month - 1 day')::date,
      v_year
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

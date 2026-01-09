/*
  # Filtros e Calendário de Recorrências Financeiras

  Criação de views e funções para:
  - Visualizar recorrências ativas do ano
  - Ver quais meses cada recorrência estará ativa
  - Filtros por período, tipo, categoria
  - Calendário mensal de recorrências
*/

-- =====================================================
-- FUNÇÃO: EXPANDIR RECORRÊNCIAS PARA O ANO
-- =====================================================

CREATE OR REPLACE FUNCTION expand_recurrence_for_year(
  p_entry_id uuid,
  p_year integer DEFAULT NULL
)
RETURNS TABLE (
  mes integer,
  mes_nome text,
  data_vencimento date,
  valor numeric,
  status_previsto text,
  ja_gerado boolean
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_entry finance_entries%ROWTYPE;
  v_current_date date;
  v_end_of_year date;
  v_target_year integer;
  v_month integer;
  v_month_name text;
BEGIN
  -- Definir ano
  v_target_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::integer);
  v_end_of_year := (v_target_year || '-12-31')::date;
  
  -- Buscar lançamento
  SELECT * INTO v_entry FROM finance_entries WHERE id = p_entry_id;
  
  IF NOT FOUND OR NOT v_entry.is_recurring THEN
    RETURN;
  END IF;
  
  -- Começar da data inicial ou início do ano
  v_current_date := GREATEST(
    v_entry.recurrence_start_date,
    (v_target_year || '-01-01')::date
  );
  
  -- Se já passou do fim, não retorna nada
  IF v_current_date > v_end_of_year THEN
    RETURN;
  END IF;
  
  -- Gerar todas as datas do ano
  LOOP
    -- Verificar se passou do fim do ano
    EXIT WHEN v_current_date > v_end_of_year;
    
    -- Verificar se passou da data final da recorrência
    EXIT WHEN v_entry.recurrence_end_date IS NOT NULL 
      AND v_current_date > v_entry.recurrence_end_date;
    
    -- Verificar contador
    EXIT WHEN v_entry.recurrence_count IS NOT NULL 
      AND v_entry.generated_count >= v_entry.recurrence_count;
    
    v_month := EXTRACT(MONTH FROM v_current_date)::integer;
    v_month_name := CASE v_month
      WHEN 1 THEN 'Janeiro'
      WHEN 2 THEN 'Fevereiro'
      WHEN 3 THEN 'Março'
      WHEN 4 THEN 'Abril'
      WHEN 5 THEN 'Maio'
      WHEN 6 THEN 'Junho'
      WHEN 7 THEN 'Julho'
      WHEN 8 THEN 'Agosto'
      WHEN 9 THEN 'Setembro'
      WHEN 10 THEN 'Outubro'
      WHEN 11 THEN 'Novembro'
      WHEN 12 THEN 'Dezembro'
    END;
    
    -- Retornar linha
    RETURN QUERY SELECT
      v_month,
      v_month_name,
      v_current_date,
      v_entry.valor,
      CASE
        WHEN v_current_date < CURRENT_DATE THEN 'vencido'
        WHEN v_current_date = CURRENT_DATE THEN 'hoje'
        ELSE 'futuro'
      END::text,
      EXISTS(
        SELECT 1 FROM finance_entries
        WHERE recurrence_parent_id = p_entry_id
          AND data_vencimento = v_current_date
      );
    
    -- Calcular próxima data
    v_current_date := calculate_next_recurrence_date(
      v_current_date,
      v_entry.recurrence_frequency,
      v_entry.recurrence_day
    );
  END LOOP;
END;
$$;

-- =====================================================
-- VIEW: CALENDÁRIO ANUAL DE RECORRÊNCIAS
-- =====================================================

CREATE OR REPLACE VIEW v_recurrence_annual_calendar AS
SELECT
  fe.id as recurrence_id,
  fe.descricao,
  fe.valor,
  fe.tipo,
  fe.categoria,
  fe.recurrence_frequency as frequencia,
  fe.recurrence_status as status,
  
  -- Cliente/Fornecedor
  COALESCE(c.nome_razao, s.name) as cliente_fornecedor,
  
  -- Datas importantes
  fe.recurrence_start_date as data_inicio,
  fe.recurrence_end_date as data_fim,
  
  -- Controle
  fe.recurrence_count as total_previsto,
  fe.generated_count as ja_gerados,
  
  -- Calcular ocorrências no ano atual
  (
    SELECT COUNT(*)
    FROM expand_recurrence_for_year(fe.id, EXTRACT(YEAR FROM CURRENT_DATE)::integer)
  ) as ocorrencias_ano_atual,
  
  -- Total projetado para o ano
  (
    SELECT SUM(valor)
    FROM expand_recurrence_for_year(fe.id, EXTRACT(YEAR FROM CURRENT_DATE)::integer)
  ) as valor_total_ano,
  
  -- Próxima ocorrência
  fe.next_generation_date as proxima_data,
  
  -- Meses ativos (array)
  (
    SELECT array_agg(DISTINCT mes ORDER BY mes)
    FROM expand_recurrence_for_year(fe.id, EXTRACT(YEAR FROM CURRENT_DATE)::integer)
  ) as meses_ativos,
  
  -- Nomes dos meses (texto)
  (
    SELECT string_agg(DISTINCT mes_nome, ', ' ORDER BY mes_nome)
    FROM expand_recurrence_for_year(fe.id, EXTRACT(YEAR FROM CURRENT_DATE)::integer)
  ) as meses_ativos_nomes

FROM finance_entries fe
LEFT JOIN customers c ON c.id = fe.customer_id
LEFT JOIN suppliers s ON s.id = fe.supplier_id
WHERE fe.is_recurring = true
  AND fe.recurrence_status IN ('ativo', 'pausado')
ORDER BY fe.tipo, fe.descricao;

-- =====================================================
-- VIEW: RECORRÊNCIAS EXPANDIDAS DO ANO
-- =====================================================

CREATE OR REPLACE VIEW v_recurrence_expanded_year AS
SELECT
  fe.id as recurrence_id,
  fe.descricao,
  fe.valor,
  fe.tipo,
  fe.categoria,
  fe.recurrence_frequency as frequencia,
  fe.recurrence_status as status,
  
  -- Dados da expansão
  exp.mes,
  exp.mes_nome,
  exp.data_vencimento,
  exp.valor as valor_mes,
  exp.status_previsto,
  exp.ja_gerado,
  
  -- Cliente/Fornecedor
  COALESCE(c.nome_razao, s.name) as cliente_fornecedor,
  c.id as customer_id,
  s.id as supplier_id,
  
  -- Informações úteis
  CASE 
    WHEN exp.ja_gerado THEN 'Gerado'
    WHEN exp.status_previsto = 'vencido' THEN 'Não gerado (vencido)'
    WHEN exp.status_previsto = 'hoje' THEN 'Gerar hoje'
    ELSE 'A gerar'
  END as status_geracao

FROM finance_entries fe
LEFT JOIN customers c ON c.id = fe.customer_id
LEFT JOIN suppliers s ON s.id = fe.supplier_id
CROSS JOIN LATERAL expand_recurrence_for_year(fe.id, EXTRACT(YEAR FROM CURRENT_DATE)::integer) exp
WHERE fe.is_recurring = true
ORDER BY exp.data_vencimento, fe.descricao;

-- =====================================================
-- VIEW: RESUMO MENSAL DE RECORRÊNCIAS
-- =====================================================

CREATE OR REPLACE VIEW v_recurrence_monthly_summary AS
SELECT
  mes,
  mes_nome,
  
  -- Totais por tipo
  COUNT(*) as total_lancamentos,
  COUNT(*) FILTER (WHERE tipo = 'entrada') as total_receitas,
  COUNT(*) FILTER (WHERE tipo = 'saida') as total_despesas,
  
  -- Valores
  SUM(valor) as valor_total,
  SUM(valor) FILTER (WHERE tipo = 'entrada') as valor_receitas,
  SUM(valor) FILTER (WHERE tipo = 'saida') as valor_despesas,
  SUM(valor) FILTER (WHERE tipo = 'entrada') - SUM(valor) FILTER (WHERE tipo = 'saida') as saldo_previsto,
  
  -- Status de geração
  COUNT(*) FILTER (WHERE ja_gerado) as ja_gerados,
  COUNT(*) FILTER (WHERE NOT ja_gerado) as pendentes_geracao,
  
  -- Lista de descrições
  string_agg(DISTINCT descricao, ', ' ORDER BY descricao) as lancamentos

FROM v_recurrence_expanded_year
GROUP BY mes, mes_nome
ORDER BY mes;

-- =====================================================
-- VIEW: RECORRÊNCIAS POR CATEGORIA E MÊS
-- =====================================================

CREATE OR REPLACE VIEW v_recurrence_by_category_month AS
SELECT
  mes,
  mes_nome,
  tipo,
  categoria,
  
  COUNT(*) as quantidade,
  SUM(valor) as valor_total,
  
  string_agg(descricao, ', ' ORDER BY descricao) as lancamentos
  
FROM v_recurrence_expanded_year
GROUP BY mes, mes_nome, tipo, categoria
ORDER BY mes, tipo, valor_total DESC;

-- =====================================================
-- FUNÇÃO: BUSCAR RECORRÊNCIAS POR FILTROS
-- =====================================================

CREATE OR REPLACE FUNCTION filter_recurrences(
  p_tipo text DEFAULT NULL,
  p_categoria text DEFAULT NULL,
  p_frequencia text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_mes integer DEFAULT NULL,
  p_ano integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  descricao text,
  valor numeric,
  tipo text,
  categoria text,
  frequencia text,
  status text,
  cliente_fornecedor text,
  data_vencimento date,
  mes integer,
  mes_nome text,
  ja_gerado boolean
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.recurrence_id,
    v.descricao,
    v.valor,
    v.tipo,
    v.categoria,
    v.frequencia,
    v.status,
    v.cliente_fornecedor,
    v.data_vencimento,
    v.mes,
    v.mes_nome,
    v.ja_gerado
  FROM v_recurrence_expanded_year v
  WHERE (p_tipo IS NULL OR v.tipo = p_tipo)
    AND (p_categoria IS NULL OR v.categoria = p_categoria)
    AND (p_frequencia IS NULL OR v.frequencia = p_frequencia)
    AND (p_status IS NULL OR v.status = p_status)
    AND (p_mes IS NULL OR v.mes = p_mes)
    AND (p_ano IS NULL OR EXTRACT(YEAR FROM v.data_vencimento)::integer = p_ano)
  ORDER BY v.data_vencimento, v.descricao;
END;
$$;

-- =====================================================
-- FUNÇÃO: BUSCAR RECORRÊNCIAS DE UM MÊS ESPECÍFICO
-- =====================================================

CREATE OR REPLACE FUNCTION get_recurrences_for_month(
  p_mes integer,
  p_ano integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  descricao text,
  valor numeric,
  tipo text,
  categoria text,
  data_vencimento date,
  cliente_fornecedor text,
  ja_gerado boolean,
  status_geracao text
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_ano integer;
BEGIN
  v_ano := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::integer);
  
  RETURN QUERY
  SELECT
    v.recurrence_id,
    v.descricao,
    v.valor,
    v.tipo,
    v.categoria,
    v.data_vencimento,
    v.cliente_fornecedor,
    v.ja_gerado,
    v.status_geracao
  FROM v_recurrence_expanded_year v
  WHERE v.mes = p_mes
    AND EXTRACT(YEAR FROM v.data_vencimento)::integer = v_ano
  ORDER BY v.data_vencimento, v.tipo, v.descricao;
END;
$$;

-- =====================================================
-- VIEW: VISÃO GERAL DO ANO (DASHBOARD)
-- =====================================================

CREATE OR REPLACE VIEW v_recurrence_year_overview AS
SELECT
  -- Totais gerais
  (SELECT COUNT(DISTINCT recurrence_id) FROM v_recurrence_expanded_year) as total_recorrencias,
  (SELECT COUNT(*) FROM v_recurrence_expanded_year) as total_ocorrencias_ano,
  
  -- Por tipo
  (SELECT COUNT(DISTINCT recurrence_id) FROM v_recurrence_expanded_year WHERE tipo = 'entrada') as recorrencias_entrada,
  (SELECT COUNT(DISTINCT recurrence_id) FROM v_recurrence_expanded_year WHERE tipo = 'saida') as recorrencias_saida,
  
  -- Valores
  (SELECT SUM(valor) FROM v_recurrence_expanded_year) as valor_total_ano,
  (SELECT SUM(valor) FROM v_recurrence_expanded_year WHERE tipo = 'entrada') as receitas_totais_ano,
  (SELECT SUM(valor) FROM v_recurrence_expanded_year WHERE tipo = 'saida') as despesas_totais_ano,
  (SELECT SUM(valor) FROM v_recurrence_expanded_year WHERE tipo = 'entrada') - 
    (SELECT SUM(valor) FROM v_recurrence_expanded_year WHERE tipo = 'saida') as saldo_previsto_ano,
  
  -- Status
  (SELECT COUNT(*) FROM v_recurrence_expanded_year WHERE ja_gerado) as ja_gerados,
  (SELECT COUNT(*) FROM v_recurrence_expanded_year WHERE NOT ja_gerado) as pendentes_geracao,
  
  -- Média mensal
  (SELECT AVG(valor_total) FROM v_recurrence_monthly_summary) as media_mensal,
  (SELECT AVG(valor_receitas) FROM v_recurrence_monthly_summary) as media_receitas_mes,
  (SELECT AVG(valor_despesas) FROM v_recurrence_monthly_summary) as media_despesas_mes,
  
  -- Mês com mais movimentação
  (SELECT mes_nome FROM v_recurrence_monthly_summary ORDER BY valor_total DESC LIMIT 1) as mes_maior_valor,
  (SELECT valor_total FROM v_recurrence_monthly_summary ORDER BY valor_total DESC LIMIT 1) as maior_valor_mes;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION expand_recurrence_for_year IS 'Expande uma recorrência específica para todos os meses do ano';
COMMENT ON FUNCTION filter_recurrences IS 'Filtra recorrências por tipo, categoria, frequência, status, mês';
COMMENT ON FUNCTION get_recurrences_for_month IS 'Busca todas as recorrências de um mês específico';

COMMENT ON VIEW v_recurrence_annual_calendar IS 'Calendário anual mostrando em quais meses cada recorrência está ativa';
COMMENT ON VIEW v_recurrence_expanded_year IS 'Todas as recorrências expandidas mês a mês para o ano atual';
COMMENT ON VIEW v_recurrence_monthly_summary IS 'Resumo mensal de todas as recorrências (totais, valores, status)';
COMMENT ON VIEW v_recurrence_by_category_month IS 'Recorrências agrupadas por categoria e mês';
COMMENT ON VIEW v_recurrence_year_overview IS 'Visão geral do ano inteiro (dashboard)';

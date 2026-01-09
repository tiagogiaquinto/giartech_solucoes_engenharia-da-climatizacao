-- =====================================================
-- TESTE E DEMONSTRAÇÃO DOS FILTROS DE RECORRÊNCIA
-- =====================================================

-- =====================================================
-- 1. VER CALENDÁRIO ANUAL DE TODAS AS RECORRÊNCIAS
-- =====================================================

-- Mostra em quais meses cada recorrência está ativa
SELECT
  descricao,
  tipo,
  CONCAT('R$ ', ROUND(valor, 2)) as valor_unitario,
  frequencia,
  meses_ativos_nomes,
  ocorrencias_ano_atual,
  CONCAT('R$ ', ROUND(valor_total_ano, 2)) as total_ano,
  status
FROM v_recurrence_annual_calendar
ORDER BY valor_total_ano DESC;

-- =====================================================
-- 2. RESUMO MENSAL DO ANO
-- =====================================================

-- Totais de cada mês (receitas, despesas, saldo)
SELECT
  mes,
  mes_nome,
  total_lancamentos,
  CONCAT('R$ ', ROUND(valor_receitas, 2)) as receitas,
  CONCAT('R$ ', ROUND(valor_despesas, 2)) as despesas,
  CONCAT('R$ ', ROUND(saldo_previsto, 2)) as saldo,
  ja_gerados || ' gerados | ' || pendentes_geracao || ' pendentes' as status
FROM v_recurrence_monthly_summary
ORDER BY mes;

-- =====================================================
-- 3. DASHBOARD DO ANO COMPLETO
-- =====================================================

SELECT
  total_recorrencias as "Total de Recorrências",
  total_ocorrencias_ano as "Ocorrências no Ano",
  CONCAT('R$ ', ROUND(receitas_totais_ano, 2)) as "Receitas Totais",
  CONCAT('R$ ', ROUND(despesas_totais_ano, 2)) as "Despesas Totais",
  CONCAT('R$ ', ROUND(saldo_previsto_ano, 2)) as "Saldo Previsto",
  CONCAT('R$ ', ROUND(media_mensal, 2)) as "Média Mensal",
  mes_maior_valor as "Mês com Maior Valor",
  CONCAT('R$ ', ROUND(maior_valor_mes, 2)) as "Valor do Pico",
  ja_gerados as "Já Gerados",
  pendentes_geracao as "Pendentes"
FROM v_recurrence_year_overview;

-- =====================================================
-- 4. FILTRAR RECORRÊNCIAS POR TIPO
-- =====================================================

-- Apenas RECEITAS (entradas)
SELECT
  descricao,
  valor,
  mes_nome,
  data_vencimento,
  cliente_fornecedor,
  ja_gerado
FROM filter_recurrences(
  p_tipo := 'entrada'
)
ORDER BY data_vencimento
LIMIT 20;

-- Apenas DESPESAS (saídas)
SELECT
  descricao,
  valor,
  mes_nome,
  data_vencimento,
  cliente_fornecedor,
  ja_gerado
FROM filter_recurrences(
  p_tipo := 'saida'
)
ORDER BY data_vencimento
LIMIT 20;

-- =====================================================
-- 5. FILTRAR POR FREQUÊNCIA
-- =====================================================

-- Apenas recorrências MENSAIS
SELECT
  descricao,
  tipo,
  valor,
  meses_ativos_nomes,
  valor_total_ano
FROM v_recurrence_annual_calendar
WHERE frequencia = 'mensal'
ORDER BY valor_total_ano DESC;

-- Apenas recorrências TRIMESTRAIS
SELECT
  descricao,
  tipo,
  valor,
  meses_ativos_nomes,
  valor_total_ano
FROM v_recurrence_annual_calendar
WHERE frequencia = 'trimestral'
ORDER BY valor_total_ano DESC;

-- Apenas recorrências ANUAIS
SELECT
  descricao,
  tipo,
  valor,
  meses_ativos_nomes,
  valor_total_ano
FROM v_recurrence_annual_calendar
WHERE frequencia = 'anual'
ORDER BY valor_total_ano DESC;

-- =====================================================
-- 6. FILTRAR POR MÊS ESPECÍFICO
-- =====================================================

-- Ver TODAS as recorrências de JANEIRO
SELECT
  descricao,
  tipo,
  valor,
  data_vencimento,
  cliente_fornecedor,
  ja_gerado,
  status_geracao
FROM get_recurrences_for_month(1, 2026)
ORDER BY tipo, data_vencimento;

-- Ver TODAS as recorrências de JUNHO
SELECT
  descricao,
  tipo,
  valor,
  data_vencimento,
  cliente_fornecedor,
  ja_gerado,
  status_geracao
FROM get_recurrences_for_month(6, 2026)
ORDER BY tipo, data_vencimento;

-- Ver TODAS as recorrências de DEZEMBRO
SELECT
  descricao,
  tipo,
  valor,
  data_vencimento,
  cliente_fornecedor,
  ja_gerado,
  status_geracao
FROM get_recurrences_for_month(12, 2026)
ORDER BY tipo, data_vencimento;

-- =====================================================
-- 7. FILTRAR POR CATEGORIA
-- =====================================================

-- Ver recorrências de FOLHA DE PAGAMENTO
SELECT
  descricao,
  mes_nome,
  data_vencimento,
  valor,
  ja_gerado
FROM filter_recurrences(
  p_categoria := 'Folha de Pagamento'
)
ORDER BY data_vencimento;

-- Ver recorrências de DESPESAS FIXAS
SELECT
  descricao,
  mes_nome,
  data_vencimento,
  valor,
  ja_gerado
FROM filter_recurrences(
  p_categoria := 'Despesas Fixas'
)
ORDER BY data_vencimento;

-- =====================================================
-- 8. FILTROS COMBINADOS
-- =====================================================

-- Receitas MENSAIS de um mês específico
SELECT * FROM filter_recurrences(
  p_tipo := 'entrada',
  p_frequencia := 'mensal',
  p_mes := 3  -- Março
)
ORDER BY data_vencimento;

-- Despesas ATIVAS de FOLHA DE PAGAMENTO
SELECT * FROM filter_recurrences(
  p_tipo := 'saida',
  p_categoria := 'Folha de Pagamento',
  p_status := 'ativo'
)
ORDER BY data_vencimento;

-- Receitas TRIMESTRAIS em ABRIL
SELECT * FROM filter_recurrences(
  p_tipo := 'entrada',
  p_frequencia := 'trimestral',
  p_mes := 4  -- Abril
)
ORDER BY data_vencimento;

-- =====================================================
-- 9. ANÁLISES ESPECÍFICAS
-- =====================================================

-- Top 10 maiores recorrências do ano
SELECT
  descricao,
  tipo,
  frequencia,
  CONCAT('R$ ', ROUND(valor, 2)) as valor_unitario,
  ocorrencias_ano_atual,
  CONCAT('R$ ', ROUND(valor_total_ano, 2)) as total_ano,
  meses_ativos_nomes
FROM v_recurrence_annual_calendar
ORDER BY valor_total_ano DESC
LIMIT 10;

-- Recorrências por categoria (agregado)
SELECT
  tipo,
  categoria,
  COUNT(*) as quantidade,
  CONCAT('R$ ', ROUND(SUM(valor_total_ano), 2)) as total
FROM v_recurrence_annual_calendar
GROUP BY tipo, categoria
ORDER BY tipo, SUM(valor_total_ano) DESC;

-- Análise por frequência
SELECT
  frequencia,
  COUNT(*) as quantidade,
  CONCAT('R$ ', ROUND(SUM(valor_total_ano), 2)) as total_ano,
  CONCAT('R$ ', ROUND(AVG(valor), 2)) as valor_medio
FROM v_recurrence_annual_calendar
GROUP BY frequencia
ORDER BY SUM(valor_total_ano) DESC;

-- =====================================================
-- 10. PREVISÃO DE FLUXO DE CAIXA
-- =====================================================

-- Fluxo de caixa mensal com saldo acumulado
SELECT
  mes,
  mes_nome,
  CONCAT('R$ ', ROUND(valor_receitas, 2)) as receitas,
  CONCAT('R$ ', ROUND(valor_despesas, 2)) as despesas,
  CONCAT('R$ ', ROUND(saldo_previsto, 2)) as saldo_mes,
  CONCAT('R$ ', ROUND(SUM(saldo_previsto) OVER (ORDER BY mes), 2)) as saldo_acumulado
FROM v_recurrence_monthly_summary
ORDER BY mes;

-- =====================================================
-- 11. COMPARATIVO TRIMESTRAL
-- =====================================================

-- Totais por trimestre
SELECT
  'Q' || CEIL(mes::numeric / 3) as trimestre,
  CONCAT('R$ ', ROUND(SUM(valor_receitas), 2)) as receitas,
  CONCAT('R$ ', ROUND(SUM(valor_despesas), 2)) as despesas,
  CONCAT('R$ ', ROUND(SUM(saldo_previsto), 2)) as saldo
FROM v_recurrence_monthly_summary
GROUP BY CEIL(mes::numeric / 3)
ORDER BY trimestre;

-- =====================================================
-- 12. ANÁLISE DE COBERTURA
-- =====================================================

-- Verificar se receitas cobrem despesas em cada mês
SELECT
  mes_nome,
  CONCAT('R$ ', ROUND(valor_receitas, 2)) as receitas,
  CONCAT('R$ ', ROUND(valor_despesas, 2)) as despesas,
  CASE
    WHEN valor_receitas >= valor_despesas THEN '✓ Coberto'
    ELSE '✗ Déficit de R$ ' || ROUND(valor_despesas - valor_receitas, 2)
  END as status,
  ROUND((valor_receitas / NULLIF(valor_despesas, 0)) * 100, 2) || '%' as cobertura_percentual
FROM v_recurrence_monthly_summary
ORDER BY mes;

-- =====================================================
-- 13. RECORRÊNCIAS NÃO GERADAS
-- =====================================================

-- Ver quais recorrências ainda não foram geradas
SELECT
  descricao,
  tipo,
  mes_nome,
  data_vencimento,
  CONCAT('R$ ', ROUND(valor, 2)) as valor,
  status_geracao,
  status_previsto
FROM v_recurrence_expanded_year
WHERE NOT ja_gerado
ORDER BY data_vencimento
LIMIT 30;

-- Ver recorrências que deveriam ter sido geradas (vencidas)
SELECT
  descricao,
  tipo,
  data_vencimento,
  CONCAT('R$ ', ROUND(valor, 2)) as valor,
  status_geracao
FROM v_recurrence_expanded_year
WHERE NOT ja_gerado
  AND status_previsto = 'vencido'
ORDER BY data_vencimento;

-- =====================================================
-- 14. EXPANDIR RECORRÊNCIA ESPECÍFICA
-- =====================================================

-- Ver todas as ocorrências de UMA recorrência específica
-- (substituir 'UUID-AQUI' pelo ID real)
/*
SELECT
  mes,
  mes_nome,
  data_vencimento,
  CONCAT('R$ ', ROUND(valor, 2)) as valor,
  status_previsto,
  ja_gerado
FROM expand_recurrence_for_year('UUID-AQUI', 2026)
ORDER BY mes;
*/

-- =====================================================
-- 15. RELATÓRIOS CUSTOMIZADOS
-- =====================================================

-- Todas as receitas expandidas (mês a mês)
SELECT
  descricao,
  mes_nome,
  data_vencimento,
  CONCAT('R$ ', ROUND(valor, 2)) as valor,
  cliente_fornecedor,
  ja_gerado
FROM v_recurrence_expanded_year
WHERE tipo = 'entrada'
ORDER BY data_vencimento;

-- Todas as despesas expandidas (mês a mês)
SELECT
  descricao,
  mes_nome,
  data_vencimento,
  CONCAT('R$ ', ROUND(valor, 2)) as valor,
  cliente_fornecedor,
  ja_gerado
FROM v_recurrence_expanded_year
WHERE tipo = 'saida'
ORDER BY data_vencimento;

-- Meses com saldo negativo
SELECT
  mes_nome,
  CONCAT('R$ ', ROUND(valor_receitas, 2)) as receitas,
  CONCAT('R$ ', ROUND(valor_despesas, 2)) as despesas,
  CONCAT('R$ ', ROUND(saldo_previsto, 2)) as saldo_negativo
FROM v_recurrence_monthly_summary
WHERE saldo_previsto < 0
ORDER BY saldo_previsto;

-- =====================================================
-- 16. EXPORTAÇÃO PARA EXCEL/BI
-- =====================================================

-- Formato simples para exportação
SELECT
  descricao as "Descrição",
  tipo as "Tipo",
  categoria as "Categoria",
  frequencia as "Frequência",
  mes as "Mês (número)",
  mes_nome as "Mês",
  data_vencimento as "Data Vencimento",
  valor as "Valor",
  cliente_fornecedor as "Cliente/Fornecedor",
  ja_gerado as "Gerado",
  status_geracao as "Status"
FROM v_recurrence_expanded_year
ORDER BY data_vencimento;

-- =====================================================
-- FIM DOS TESTES
-- =====================================================

-- RESUMO:
--
-- Views disponíveis:
-- - v_recurrence_annual_calendar        (calendário anual)
-- - v_recurrence_expanded_year          (expandido mês a mês)
-- - v_recurrence_monthly_summary        (resumo mensal)
-- - v_recurrence_by_category_month      (por categoria e mês)
-- - v_recurrence_year_overview          (dashboard do ano)
--
-- Funções disponíveis:
-- - expand_recurrence_for_year(uuid, year)
-- - filter_recurrences(tipo, categoria, frequencia, status, mes, ano)
-- - get_recurrences_for_month(mes, ano)

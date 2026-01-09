/*
  TESTE: GERAÇÃO AUTOMÁTICA DE RECORRÊNCIAS

  Use estes SQLs para testar o sistema de geração automática
*/

-- ====================================================================
-- 1. VERIFICAR RECORRÊNCIAS EXISTENTES
-- ====================================================================

-- Ver todas as recorrências ativas
SELECT
  id,
  descricao,
  valor,
  tipo,
  recurrence_frequency AS frequencia,
  recurrence_day AS dia_do_mes,
  recurrence_status AS status,
  generated_count AS ja_gerados,
  last_generation_date AS ultima_geracao,
  next_generation_date AS proxima_geracao,
  auto_generate AS gera_automatico
FROM finance_entries
WHERE is_recurring = true
ORDER BY created_at;

-- ====================================================================
-- 2. GERAR TODOS OS LANÇAMENTOS (12 MESES)
-- ====================================================================

-- Chamada principal - gera tudo!
SELECT * FROM regenerate_all_recurrences();

/*
Resultado esperado:
{
  "success": true,
  "recurrences_processed": 5,
  "total_generated": 48,
  "total_errors": 0,
  "months_ahead": 12
}
*/

-- ====================================================================
-- 3. GERAR RECORRÊNCIA ESPECÍFICA
-- ====================================================================

-- Substituir UUID pela sua recorrência
SELECT * FROM regenerate_recurrence('SEU-UUID-AQUI');

/*
Resultado esperado:
{
  "success": true,
  "parent_id": "uuid...",
  "generated": 12,
  "errors": 0,
  "last_date": "2027-01-15"
}
*/

-- ====================================================================
-- 4. VERIFICAR LANÇAMENTOS GERADOS
-- ====================================================================

-- Ver todos os lançamentos futuros (próximos 12 meses)
SELECT
  data_vencimento AS data,
  descricao,
  valor,
  tipo,
  status,
  CASE
    WHEN recurrence_parent_id IS NOT NULL THEN '🔄 Gerado'
    ELSE '📌 Manual'
  END AS origem
FROM finance_entries
WHERE data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '12 months'
ORDER BY data_vencimento;

-- ====================================================================
-- 5. ESTATÍSTICAS POR RECORRÊNCIA
-- ====================================================================

-- Ver quantos foram gerados para cada recorrência
SELECT
  p.descricao AS recorrencia,
  p.valor AS valor_unitario,
  p.recurrence_frequency AS frequencia,
  p.generated_count AS total_gerados,
  COUNT(f.id) AS existem_na_base,
  p.valor * COUNT(f.id) AS valor_total_gerado
FROM finance_entries p
LEFT JOIN finance_entries f ON f.recurrence_parent_id = p.id
WHERE p.is_recurring = true
GROUP BY p.id, p.descricao, p.valor, p.recurrence_frequency, p.generated_count
ORDER BY p.descricao;

-- ====================================================================
-- 6. VERIFICAR PRÓXIMOS 3 MESES
-- ====================================================================

-- Lançamentos dos próximos 3 meses
SELECT
  TO_CHAR(data_vencimento, 'YYYY-MM') AS mes,
  COUNT(*) AS total_lancamentos,
  SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) AS receitas,
  SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) AS despesas,
  SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END) AS saldo
FROM finance_entries
WHERE data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 months'
  AND recurrence_parent_id IS NOT NULL
GROUP BY TO_CHAR(data_vencimento, 'YYYY-MM')
ORDER BY mes;

-- ====================================================================
-- 7. HISTÓRICO DE GERAÇÃO
-- ====================================================================

-- Ver histórico completo de gerações
SELECT
  p.descricao AS recorrencia,
  h.generation_date AS data_geracao,
  h.scheduled_date AS data_agendada,
  h.amount AS valor,
  h.status,
  h.generation_method AS metodo,
  h.error_message AS erro
FROM finance_recurrence_history h
JOIN finance_entries p ON p.id = h.parent_entry_id
ORDER BY h.generation_date DESC, h.scheduled_date
LIMIT 50;

-- ====================================================================
-- 8. CALENDÁRIO ANUAL
-- ====================================================================

-- Ver calendário completo do ano (via view)
SELECT
  descricao AS recorrencia,
  valor AS valor_mensal,
  frequencia,
  ocorrencias_ano_atual AS vezes_no_ano,
  valor_total_ano AS total_anual,
  meses_ativos_nomes AS meses
FROM v_recurrence_annual_calendar
ORDER BY valor_total_ano DESC;

-- ====================================================================
-- 9. RESUMO MENSAL
-- ====================================================================

-- Resumo mês a mês (via view)
SELECT
  mes_nome AS mes,
  total_lancamentos,
  ROUND(valor_receitas, 2) AS receitas,
  ROUND(valor_despesas, 2) AS despesas,
  ROUND(saldo_previsto, 2) AS saldo,
  ja_gerados,
  pendentes_geracao AS pendentes
FROM v_recurrence_monthly_summary
ORDER BY mes;

-- ====================================================================
-- 10. VISÃO GERAL DO ANO
-- ====================================================================

-- Dashboard completo do ano (via view)
SELECT
  total_recorrencias AS recorrencias,
  total_ocorrencias_ano AS ocorrencias,
  ROUND(receitas_totais_ano, 2) AS receitas_ano,
  ROUND(despesas_totais_ano, 2) AS despesas_ano,
  ROUND(saldo_previsto_ano, 2) AS saldo_ano,
  ROUND(media_mensal, 2) AS media_mes,
  mes_maior_valor AS mes_pico,
  ROUND(maior_valor_mes, 2) AS valor_pico
FROM v_recurrence_year_overview;

-- ====================================================================
-- 11. CRIAR RECORRÊNCIA DE TESTE
-- ====================================================================

-- Exemplo: Aluguel mensal de R$ 5.000
INSERT INTO finance_entries (
  descricao,
  valor,
  tipo,
  status,
  data,
  data_vencimento,
  is_recurring,
  recurrence_frequency,
  recurrence_day,
  recurrence_start_date,
  recurrence_status,
  auto_generate
)
VALUES (
  'Aluguel Escritório - TESTE',
  5000.00,
  'despesa',
  'a_pagar',
  CURRENT_DATE,
  CURRENT_DATE,
  true,
  'mensal',
  5,
  CURRENT_DATE,
  'ativo',
  true
)
RETURNING id;

-- Após inserir, sistema gera automaticamente os próximos 12 meses!
-- Verifique com: SELECT * FROM finance_entries WHERE descricao LIKE '%TESTE%' ORDER BY data_vencimento;

-- ====================================================================
-- 12. LIMPAR LANÇAMENTOS GERADOS (SE NECESSÁRIO)
-- ====================================================================

-- CUIDADO! Isso remove todos os lançamentos gerados automaticamente
-- Só use se precisar recomeçar os testes
/*
DELETE FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL;

-- Resetar contadores
UPDATE finance_entries
SET generated_count = 0,
    last_generation_date = NULL,
    next_generation_date = NULL
WHERE is_recurring = true;
*/

-- ====================================================================
-- 13. VERIFICAR PERFORMANCE
-- ====================================================================

-- Quantos lançamentos existem por status
SELECT
  status,
  COUNT(*) AS quantidade,
  SUM(valor) AS valor_total
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL
GROUP BY status
ORDER BY quantidade DESC;

-- ====================================================================
-- 14. PRÓXIMOS VENCIMENTOS
-- ====================================================================

-- Próximos 10 vencimentos de recorrências
SELECT
  data_vencimento AS vencimento,
  descricao,
  valor,
  tipo,
  status,
  DATE_PART('day', data_vencimento - CURRENT_DATE) AS dias_ate_vencer
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL
  AND data_vencimento >= CURRENT_DATE
ORDER BY data_vencimento
LIMIT 10;

-- ====================================================================
-- 15. ANÁLISE POR FREQUÊNCIA
-- ====================================================================

-- Quantas recorrências de cada tipo
SELECT
  recurrence_frequency AS frequencia,
  COUNT(*) AS quantidade,
  SUM(valor) AS valor_total_mensal,
  CASE recurrence_frequency
    WHEN 'mensal' THEN SUM(valor) * 12
    WHEN 'bimestral' THEN SUM(valor) * 6
    WHEN 'trimestral' THEN SUM(valor) * 4
    WHEN 'semestral' THEN SUM(valor) * 2
    WHEN 'anual' THEN SUM(valor) * 1
    ELSE 0
  END AS valor_total_anual
FROM finance_entries
WHERE is_recurring = true
  AND recurrence_status = 'ativo'
GROUP BY recurrence_frequency
ORDER BY quantidade DESC;

-- ====================================================================
-- 16. SIMULAR PRÓXIMO MÊS
-- ====================================================================

-- Ver o que vence no próximo mês
SELECT
  TO_CHAR(data_vencimento, 'DD/MM/YYYY') AS data,
  descricao,
  CASE
    WHEN tipo = 'receita' THEN '↗ Receita'
    WHEN tipo = 'despesa' THEN '↘ Despesa'
  END AS tipo,
  valor,
  status
FROM finance_entries
WHERE data_vencimento BETWEEN
  DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') AND
  DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + INTERVAL '1 month - 1 day'
  AND recurrence_parent_id IS NOT NULL
ORDER BY data_vencimento, tipo;

-- ====================================================================
-- 17. VERIFICAR DUPLICATAS
-- ====================================================================

-- Verificar se há duplicatas (não deveria ter!)
SELECT
  recurrence_parent_id,
  data_vencimento,
  COUNT(*) AS duplicatas
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL
GROUP BY recurrence_parent_id, data_vencimento
HAVING COUNT(*) > 1;

-- Se retornar vazio = OK! Não há duplicatas

-- ====================================================================
-- 18. PAUSAR/RETOMAR RECORRÊNCIA
-- ====================================================================

-- Pausar uma recorrência (substituir UUID)
-- SELECT * FROM pause_recurrence('SEU-UUID-AQUI');

-- Retomar uma recorrência (substituir UUID)
-- SELECT * FROM resume_recurrence('SEU-UUID-AQUI');

-- Cancelar uma recorrência (substituir UUID)
-- SELECT * FROM cancel_recurrence('SEU-UUID-AQUI', false);

-- ====================================================================
-- 19. RELATÓRIO EXECUTIVO
-- ====================================================================

-- Relatório completo para apresentação
SELECT
  '📊 RECORRÊNCIAS ATIVAS' AS categoria,
  COUNT(*)::text AS valor
FROM finance_entries
WHERE is_recurring = true AND recurrence_status = 'ativo'

UNION ALL

SELECT
  '✨ LANÇAMENTOS GERADOS',
  COUNT(*)::text
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL

UNION ALL

SELECT
  '📅 PRÓXIMOS 30 DIAS',
  COUNT(*)::text
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL
  AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'

UNION ALL

SELECT
  '💰 VALOR TOTAL (12 MESES)',
  TO_CHAR(SUM(valor), 'R$ 999,999,999.99')
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL
  AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '12 months'

UNION ALL

SELECT
  '📈 RECEITAS PREVISTAS',
  TO_CHAR(SUM(valor), 'R$ 999,999,999.99')
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL
  AND tipo = 'receita'
  AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '12 months'

UNION ALL

SELECT
  '📉 DESPESAS PREVISTAS',
  TO_CHAR(SUM(valor), 'R$ 999,999,999.99')
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL
  AND tipo = 'despesa'
  AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '12 months';

-- ====================================================================
-- 20. EXPORTAR CALENDÁRIO
-- ====================================================================

-- Exportar calendário completo para Excel/CSV
SELECT
  p.descricao AS "Recorrência",
  p.valor AS "Valor Unitário",
  p.recurrence_frequency AS "Frequência",
  f.data_vencimento AS "Data Vencimento",
  f.tipo AS "Tipo",
  f.status AS "Status",
  TO_CHAR(f.data_vencimento, 'YYYY-MM') AS "Mês/Ano",
  TO_CHAR(f.data_vencimento, 'Month') AS "Mês Nome",
  EXTRACT(YEAR FROM f.data_vencimento) AS "Ano"
FROM finance_entries f
JOIN finance_entries p ON p.id = f.recurrence_parent_id
WHERE f.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '12 months'
ORDER BY f.data_vencimento;

-- ====================================================================
-- FIM DOS TESTES
-- ====================================================================

/*
RESUMO DE USO:

1. Ver recorrências:        SQL #1
2. Gerar tudo (12 meses):   SQL #2
3. Ver gerados:             SQL #4
4. Estatísticas:            SQL #5
5. Próximos 3 meses:        SQL #6
6. Calendário anual:        SQL #8
7. Resumo mensal:           SQL #9
8. Visão geral:             SQL #10
9. Criar teste:             SQL #11
10. Relatório executivo:    SQL #19

FUNÇÃO PRINCIPAL:
SELECT * FROM regenerate_all_recurrences();

RESULTADO:
- Processa todas as recorrências ativas
- Gera próximos 12 meses
- Evita duplicatas
- Respeita limites
- Registra histórico
- Retorna estatísticas
*/

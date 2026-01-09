/*
  LIMPAR EXEMPLOS DE RECORRÊNCIAS

  Use este SQL se quiser REMOVER os lançamentos de exemplo
  que foram criados para demonstração.

  ATENÇÃO: Isso vai excluir:
    - 5 recorrências de exemplo (pais)
    - 38 lançamentos gerados (filhos)
*/

-- ====================================================================
-- OPÇÃO 1: LIMPAR APENAS OS EXEMPLOS
-- ====================================================================

-- Visualizar antes de excluir
SELECT
  'RECORRÊNCIAS QUE SERÃO EXCLUÍDAS' AS tipo,
  id,
  descricao,
  valor,
  tipo,
  recurrence_frequency AS frequencia
FROM finance_entries
WHERE is_recurring = true
  AND descricao IN (
    'Aluguel Escritório',
    'Mensalidade Sistema ERP',
    'Manutenção Preventiva Equipamentos',
    'Contrato Cliente VIP - Mensalidade',
    'Folha de Pagamento'
  );

-- Visualizar lançamentos gerados que serão excluídos
SELECT
  'LANÇAMENTOS GERADOS QUE SERÃO EXCLUÍDOS' AS tipo,
  COUNT(*) AS quantidade,
  SUM(valor) AS valor_total
FROM finance_entries
WHERE recurrence_parent_id IN (
  SELECT id FROM finance_entries
  WHERE is_recurring = true
    AND descricao IN (
      'Aluguel Escritório',
      'Mensalidade Sistema ERP',
      'Manutenção Preventiva Equipamentos',
      'Contrato Cliente VIP - Mensalidade',
      'Folha de Pagamento'
    )
);

-- EXECUTAR EXCLUSÃO (descomente para usar)
/*
-- 1. Excluir lançamentos gerados (filhos)
DELETE FROM finance_entries
WHERE recurrence_parent_id IN (
  SELECT id FROM finance_entries
  WHERE is_recurring = true
    AND descricao IN (
      'Aluguel Escritório',
      'Mensalidade Sistema ERP',
      'Manutenção Preventiva Equipamentos',
      'Contrato Cliente VIP - Mensalidade',
      'Folha de Pagamento'
    )
);

-- 2. Excluir recorrências (pais)
DELETE FROM finance_entries
WHERE is_recurring = true
  AND descricao IN (
    'Aluguel Escritório',
    'Mensalidade Sistema ERP',
    'Manutenção Preventiva Equipamentos',
    'Contrato Cliente VIP - Mensalidade',
    'Folha de Pagamento'
  );
*/

-- ====================================================================
-- OPÇÃO 2: LIMPAR TODAS AS RECORRÊNCIAS (CUIDADO!)
-- ====================================================================

-- Visualizar TODAS as recorrências antes de excluir
SELECT
  'TODAS AS RECORRÊNCIAS' AS tipo,
  COUNT(*) AS quantidade,
  SUM(valor) AS valor_total
FROM finance_entries
WHERE is_recurring = true;

-- Visualizar TODOS os lançamentos gerados
SELECT
  'TODOS OS LANÇAMENTOS GERADOS' AS tipo,
  COUNT(*) AS quantidade,
  SUM(valor) AS valor_total
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL;

-- EXECUTAR EXCLUSÃO TOTAL (descomente apenas se tiver certeza!)
/*
-- ATENÇÃO: Isso excluirá TODAS as recorrências, não apenas exemplos!

-- 1. Excluir todos os lançamentos gerados
DELETE FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL;

-- 2. Excluir todas as recorrências
DELETE FROM finance_entries
WHERE is_recurring = true;

-- 3. Limpar histórico
DELETE FROM finance_recurrence_history;
*/

-- ====================================================================
-- OPÇÃO 3: LIMPAR APENAS LANÇAMENTOS FUTUROS
-- ====================================================================

-- Visualizar lançamentos futuros que serão excluídos
SELECT
  'LANÇAMENTOS FUTUROS' AS tipo,
  COUNT(*) AS quantidade,
  MIN(data_vencimento) AS data_inicial,
  MAX(data_vencimento) AS data_final,
  SUM(valor) AS valor_total
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL
  AND data_vencimento > CURRENT_DATE;

-- EXECUTAR EXCLUSÃO FUTUROS (descomente para usar)
/*
DELETE FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL
  AND data_vencimento > CURRENT_DATE;
*/

-- ====================================================================
-- OPÇÃO 4: RESETAR CONTADOR SEM EXCLUIR
-- ====================================================================

-- Apenas reseta os contadores das recorrências
-- Mantém as recorrências, mas reseta contagem
/*
UPDATE finance_entries
SET
  generated_count = 0,
  last_generation_date = NULL,
  next_generation_date = NULL
WHERE is_recurring = true;
*/

-- ====================================================================
-- VERIFICAÇÃO APÓS LIMPEZA
-- ====================================================================

-- Execute após fazer a limpeza para confirmar
SELECT
  'Recorrências restantes' AS status,
  COUNT(*) AS quantidade
FROM finance_entries
WHERE is_recurring = true

UNION ALL

SELECT
  'Lançamentos gerados restantes',
  COUNT(*)
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL

UNION ALL

SELECT
  'Histórico restante',
  COUNT(*)
FROM finance_recurrence_history;

-- ====================================================================
-- RECRIAR EXEMPLOS (SE QUISER)
-- ====================================================================

-- Caso tenha excluído e queira recriar os exemplos
/*
-- Aluguel Mensal
INSERT INTO finance_entries (
  descricao, valor, tipo, status, data, data_vencimento,
  categoria, forma_pagamento,
  is_recurring, recurrence_frequency, recurrence_day,
  recurrence_start_date, recurrence_status, auto_generate
)
VALUES (
  'Aluguel Escritório', 5000.00, 'despesa', 'a_pagar',
  CURRENT_DATE, CURRENT_DATE,
  'Aluguel', 'transferencia',
  true, 'mensal', 5,
  CURRENT_DATE, 'ativo', true
);

-- Mensalidade Trimestral
INSERT INTO finance_entries (
  descricao, valor, tipo, status, data, data_vencimento,
  categoria, forma_pagamento,
  is_recurring, recurrence_frequency, recurrence_day,
  recurrence_start_date, recurrence_status, auto_generate
)
VALUES (
  'Mensalidade Sistema ERP', 1200.00, 'despesa', 'a_pagar',
  CURRENT_DATE, CURRENT_DATE,
  'Tecnologia', 'boleto',
  true, 'trimestral', 10,
  CURRENT_DATE, 'ativo', true
);

-- Manutenção Semestral
INSERT INTO finance_entries (
  descricao, valor, tipo, status, data, data_vencimento,
  categoria, forma_pagamento,
  is_recurring, recurrence_frequency, recurrence_day,
  recurrence_start_date, recurrence_status, auto_generate
)
VALUES (
  'Manutenção Preventiva Equipamentos', 3500.00, 'despesa', 'a_pagar',
  CURRENT_DATE, CURRENT_DATE,
  'Manutenção', 'transferencia',
  true, 'semestral', 15,
  CURRENT_DATE, 'ativo', true
);

-- Contrato Cliente Mensal
INSERT INTO finance_entries (
  descricao, valor, tipo, status, data, data_vencimento,
  categoria, forma_pagamento,
  is_recurring, recurrence_frequency, recurrence_day,
  recurrence_start_date, recurrence_status, auto_generate
)
VALUES (
  'Contrato Cliente VIP - Mensalidade', 8000.00, 'receita', 'a_receber',
  CURRENT_DATE, CURRENT_DATE,
  'Serviços', 'transferencia',
  true, 'mensal', 20,
  CURRENT_DATE, 'ativo', true
);

-- Folha de Pagamento
INSERT INTO finance_entries (
  descricao, valor, tipo, status, data, data_vencimento,
  categoria, forma_pagamento,
  is_recurring, recurrence_frequency, recurrence_day,
  recurrence_start_date, recurrence_status, auto_generate
)
VALUES (
  'Folha de Pagamento', 25000.00, 'despesa', 'a_pagar',
  CURRENT_DATE, CURRENT_DATE,
  'Salários', 'transferencia',
  true, 'mensal', 30,
  CURRENT_DATE, 'ativo', true
);

-- Aguarde... sistema vai gerar automaticamente os próximos 12 meses!
-- Depois execute:
SELECT COUNT(*) AS novos_lancamentos_gerados
FROM finance_entries
WHERE recurrence_parent_id IS NOT NULL;
*/

-- ====================================================================
-- NOTAS IMPORTANTES
-- ====================================================================

/*
1. SEMPRE visualize antes de excluir
   - Execute os SELECTs primeiro
   - Confirme que são os registros corretos

2. BACKUP recomendado
   - Faça backup do banco antes de excluir
   - Especialmente se for limpar tudo

3. CASCADE automático
   - Ao excluir recorrência (pai)
   - Sistema exclui lançamentos gerados (filhos)
   - Isso é por design (ON DELETE CASCADE)

4. Histórico
   - Fica preservado mesmo após excluir
   - Para limpar histórico, use DELETE específico

5. Recriar
   - Pode recriar a qualquer momento
   - Sistema gera automaticamente se auto_generate = true

6. Frontend
   - Atualizar página após exclusão
   - Ctrl + Shift + R
   - Lançamentos desaparecem da lista
*/

-- ====================================================================
-- COMANDOS RÁPIDOS
-- ====================================================================

-- Ver apenas exemplos
-- SELECT * FROM finance_entries WHERE descricao LIKE '%Aluguel Escritório%';

-- Ver todos recorrentes
-- SELECT * FROM finance_entries WHERE is_recurring = true;

-- Ver todos gerados
-- SELECT * FROM finance_entries WHERE recurrence_parent_id IS NOT NULL ORDER BY data_vencimento;

-- Contar total
-- SELECT COUNT(*) FROM finance_entries;

-- Ver histórico
-- SELECT * FROM finance_recurrence_history ORDER BY generation_date DESC LIMIT 20;

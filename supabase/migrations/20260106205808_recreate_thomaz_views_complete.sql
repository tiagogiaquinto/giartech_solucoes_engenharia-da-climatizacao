/*
  # Recriação Completa das Views do Thomaz

  ## Ajuste
  Recriar as views do zero com campos e tipos corretos:
  - Usar "receita" e "despesa" para tipo
  - Usar campos corretos das tabelas (nome_razao, etc)
  - Adicionar métricas expandidas

  ## Views Recriadas
  - v_thomaz_cash_flow_base
  - v_thomaz_cash_position
*/

-- Dropar views existentes
DROP VIEW IF EXISTS v_thomaz_cash_position CASCADE;
DROP VIEW IF EXISTS v_thomaz_cash_flow_base CASCADE;

-- 1. Criar v_thomaz_cash_flow_base com campos corretos
CREATE VIEW v_thomaz_cash_flow_base AS
SELECT
  fe.id,
  fe.descricao,
  fe.valor,
  fe.tipo,
  fe.status,
  fe.data,
  fe.data_vencimento,
  fe.data_pagamento,
  fe.due_date,
  fe.forma_pagamento,
  fe.observacoes,
  fe.created_at,
  fe.updated_at,
  
  -- Bank Account
  fe.bank_account_id,
  ba.account_name AS banco_conta,
  ba.bank_name AS banco_nome,
  ba.account_type AS banco_tipo,
  
  -- Category
  fe.category_id,
  fe.subcategory_id,
  fe.categoria AS categoria_nome_legado,
  fe.subcategoria AS subcategoria_nome_legado,
  cat.name AS categoria_nome,
  subcat.name AS subcategoria_nome,
  
  -- Related Entities
  fe.customer_id,
  c.nome_razao AS cliente_nome,
  c.nome_fantasia AS cliente_fantasia,
  COALESCE(c.cpf, c.cnpj) AS cliente_documento,
  c.tipo_pessoa AS cliente_tipo,
  
  fe.supplier_id,
  s.name AS fornecedor_nome,
  s.cnpj AS fornecedor_cnpj,
  
  fe.employee_id,
  e.name AS funcionario_nome,
  e.cpf AS funcionario_cpf,
  e.role AS funcionario_cargo,
  
  -- Recurrence
  fe.numero_parcelas,
  fe.intervalo_recorrencia,
  fe.data_fim_recorrencia,
  
  -- Classificações
  CASE 
    WHEN fe.tipo = 'receita' THEN 'Entrada'
    WHEN fe.tipo = 'despesa' THEN 'Saída'
    ELSE 'Indefinido'
  END AS tipo_display,
  
  CASE
    WHEN fe.status IN ('recebido', 'pago') THEN 'Realizado'
    WHEN fe.status IN ('a_receber', 'a_pagar') THEN 'Pendente'
    WHEN fe.status = 'cancelado' THEN 'Cancelado'
    ELSE 'Outro'
  END AS status_grupo,
  
  CASE
    WHEN fe.data <= CURRENT_DATE THEN 'Passado/Hoje'
    WHEN fe.data <= CURRENT_DATE + INTERVAL '7 days' THEN 'Próximos 7 dias'
    WHEN fe.data <= CURRENT_DATE + INTERVAL '30 days' THEN 'Próximos 30 dias'
    ELSE 'Futuro'
  END AS periodo_classificacao,
  
  -- Indicadores Financeiros
  CASE
    WHEN fe.data_vencimento IS NOT NULL AND fe.data_pagamento IS NOT NULL
      THEN (fe.data_pagamento - fe.data_vencimento)
    ELSE NULL
  END AS dias_atraso,
  
  CASE
    WHEN fe.tipo = 'receita' THEN fe.valor
    ELSE 0
  END AS valor_entrada,
  
  CASE
    WHEN fe.tipo = 'despesa' THEN fe.valor
    ELSE 0
  END AS valor_saida

FROM finance_entries fe
LEFT JOIN bank_accounts ba ON ba.id = fe.bank_account_id
LEFT JOIN financial_categories cat ON cat.id = fe.category_id
LEFT JOIN financial_categories subcat ON subcat.id = fe.subcategory_id
LEFT JOIN customers c ON c.id = fe.customer_id
LEFT JOIN suppliers s ON s.id = fe.supplier_id
LEFT JOIN employees e ON e.id = fe.employee_id
WHERE fe.status <> 'cancelado';

COMMENT ON VIEW v_thomaz_cash_flow_base IS 'View base de fluxo de caixa com todos os campos para análise do Thomaz AI';

-- 2. Criar v_thomaz_cash_position com tipo correto e métricas expandidas
CREATE VIEW v_thomaz_cash_position AS
SELECT
  ba.id                     AS bank_account_id,
  ba.account_name           AS conta,
  ba.bank_name              AS banco,
  ba.account_type           AS tipo_conta,
  ba.active                 AS ativa,

  -- Saldo calculado
  COALESCE(
    SUM(
      CASE
        WHEN fe.tipo = 'receita' THEN fe.valor
        WHEN fe.tipo = 'despesa' THEN -fe.valor
        ELSE 0
      END
    ), 0
  ) AS saldo_calculado,
  
  -- Contadores
  COUNT(fe.id) AS total_lancamentos,
  COUNT(CASE WHEN fe.tipo = 'receita' THEN 1 END) AS total_receitas,
  COUNT(CASE WHEN fe.tipo = 'despesa' THEN 1 END) AS total_despesas,
  
  -- Valores totais
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) AS valor_receitas,
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END), 0) AS valor_despesas,
  
  -- Última movimentação
  MAX(fe.data) AS ultima_movimentacao,
  MAX(fe.updated_at) AS ultima_atualizacao,
  
  -- Classificação do saldo
  CASE
    WHEN COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor WHEN fe.tipo = 'despesa' THEN -fe.valor ELSE 0 END), 0) < 0 
      THEN 'Negativo'
    WHEN COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor WHEN fe.tipo = 'despesa' THEN -fe.valor ELSE 0 END), 0) = 0 
      THEN 'Zerado'
    WHEN COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor WHEN fe.tipo = 'despesa' THEN -fe.valor ELSE 0 END), 0) < 5000 
      THEN 'Baixo'
    WHEN COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor WHEN fe.tipo = 'despesa' THEN -fe.valor ELSE 0 END), 0) < 20000 
      THEN 'Médio'
    ELSE 'Alto'
  END AS classificacao_saldo,
  
  -- Percentual de entradas vs saídas
  CASE
    WHEN SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) > 0
    THEN ROUND(
      (SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END) / 
       SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END)) * 100, 2
    )
    ELSE 0
  END AS percentual_despesas

FROM bank_accounts ba
LEFT JOIN finance_entries fe
  ON fe.bank_account_id = ba.id
  AND fe.status <> 'cancelado'

GROUP BY
  ba.id,
  ba.account_name,
  ba.bank_name,
  ba.account_type,
  ba.active;

COMMENT ON VIEW v_thomaz_cash_position IS 'View de posição de caixa atual por conta bancária com métricas completas';

-- Grants
GRANT SELECT ON v_thomaz_cash_flow_base TO authenticated, anon;
GRANT SELECT ON v_thomaz_cash_position TO authenticated, anon;

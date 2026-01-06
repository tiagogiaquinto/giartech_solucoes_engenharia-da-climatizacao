/*
  # Expansão da View v_thomaz_cash_flow_base

  ## Descrição
  Adiciona campos adicionais à view mantendo a estrutura existente
  para não quebrar as views dependentes (v_thomaz_cash_flow_intelligence, v_thomaz_cash_risk)

  ## Novos Campos Adicionados
  - data_pagamento (data de pagamento efetivo)
  - observacoes (observações do lançamento)
  - categoria_nome (nome da categoria)
  - subcategoria_nome (nome da subcategoria)
  - customer_id (ID do cliente)
  - supplier_id (ID do fornecedor)
  - employee_id (ID do funcionário)
  - numero_parcelas (número de parcelas)
  - intervalo_recorrencia (intervalo de recorrência)
  - data_fim_recorrencia (data fim da recorrência)
  - created_at (data de criação)
  - updated_at (data de atualização)

  ## Nota
  Mantém os campos originais para compatibilidade com views dependentes
*/

-- Expandir view mantendo compatibilidade
CREATE OR REPLACE VIEW v_thomaz_cash_flow_base AS
SELECT
    -- Campos originais (manter nomes)
    fe.id                           AS id,
    fe.data                         AS data_lancamento,
    fe.data_vencimento              AS data_vencimento,
    fe.tipo                         AS tipo_movimento,
    fe.valor                        AS valor,
    fe.status                       AS status,
    fe.descricao                    AS descricao,
    fe.category_id                  AS category_id,
    fe.subcategory_id               AS subcategory_id,
    fe.forma_pagamento              AS forma_pagamento,
    ba.id                           AS bank_account_id,
    ba.account_name                 AS conta,
    ba.bank_name                    AS banco,
    ba.account_type                 AS tipo_conta,

    -- Novos campos adicionados
    fe.data_pagamento               AS data_pagamento,
    fe.observacoes                  AS observacoes,
    fe.categoria                    AS categoria_nome,
    fe.subcategoria                 AS subcategoria_nome,
    fe.customer_id                  AS customer_id,
    fe.supplier_id                  AS supplier_id,
    fe.employee_id                  AS employee_id,
    fe.numero_parcelas              AS numero_parcelas,
    fe.intervalo_recorrencia        AS intervalo_recorrencia,
    fe.data_fim_recorrencia         AS data_fim_recorrencia,
    fe.created_at                   AS created_at,
    fe.updated_at                   AS updated_at

FROM finance_entries fe
LEFT JOIN bank_accounts ba ON ba.id = fe.bank_account_id;

-- Comentário
COMMENT ON VIEW v_thomaz_cash_flow_base IS 'View consolidada de fluxo de caixa para Thomaz AI - Expandida com campos adicionais mantendo compatibilidade';

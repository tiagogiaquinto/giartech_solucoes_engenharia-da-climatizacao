/*
  # View de Posição de Caixa por Conta Bancária

  ## Descrição
  View que calcula o saldo de cada conta bancária somando todas as entradas
  e saídas de lançamentos financeiros (excluindo cancelados).

  ## Campos
  - bank_account_id: ID da conta bancária
  - conta: Nome da conta
  - banco: Nome do banco
  - tipo_conta: Tipo de conta (corrente, poupança, etc)
  - ativa: Se a conta está ativa
  - saldo_calculado: Saldo calculado (entradas - saídas)

  ## Uso
  Esta view serve para o Thomaz AI fazer análises de:
  - Posição de caixa atual por conta
  - Distribuição de saldos entre contas
  - Identificação de contas com saldo negativo
  - Recomendações de transferências entre contas
  - Alertas de liquidez
*/

-- Criar view de posição de caixa
CREATE OR REPLACE VIEW v_thomaz_cash_position AS
SELECT
  ba.id                     AS bank_account_id,
  ba.account_name           AS conta,
  ba.bank_name              AS banco,
  ba.account_type           AS tipo_conta,
  ba.active                 AS ativa,

  COALESCE(
    SUM(
      CASE
        WHEN fe.tipo = 'entrada' THEN fe.valor
        WHEN fe.tipo = 'saida'   THEN -fe.valor
        ELSE 0
      END
    ), 0
  ) AS saldo_calculado

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

-- Comentário na view
COMMENT ON VIEW v_thomaz_cash_position IS 'View de posição de caixa atual por conta bancária para análises do Thomaz AI';

-- Grants
GRANT SELECT ON v_thomaz_cash_position TO authenticated, anon;

/*
  # Adicionar Lucro Potencial do Estoque ao Dashboard

  1. Alterações
    - Atualiza view v_dashboard_financial para incluir:
      - inventory_cost_value: Valor de custo do estoque
      - inventory_sale_value: Valor de venda do estoque
      - inventory_potential_profit: Lucro potencial do estoque
      - inventory_profit_margin: Margem de lucro do estoque (%)

  2. Detalhes
    - Calcula o valor de custo total: soma de (unit_cost * quantity)
    - Calcula o valor de venda total: soma de (unit_price * quantity)
    - Calcula o lucro potencial: valor_venda - valor_custo
    - Calcula a margem: (lucro / valor_custo) * 100
*/

-- Recriar a view v_dashboard_financial adicionando campos de estoque
CREATE OR REPLACE VIEW v_dashboard_financial AS
SELECT
  -- RECEITAS
  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'paid'
  ) as total_income_paid,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'pending'
  ) as total_income_pending,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'paid'
   AND date >= DATE_TRUNC('month', CURRENT_DATE)
  ) as income_current_month,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'paid'
   AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
   AND date < DATE_TRUNC('month', CURRENT_DATE)
  ) as income_last_month,

  -- DESPESAS
  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'paid'
  ) as total_expense_paid,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'pending'
  ) as total_expense_pending,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'paid'
   AND date >= DATE_TRUNC('month', CURRENT_DATE)
  ) as expense_current_month,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'paid'
   AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
   AND date < DATE_TRUNC('month', CURRENT_DATE)
  ) as expense_last_month,

  -- CONTAS A RECEBER
  (SELECT COUNT(*)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'pending'
  ) as accounts_receivable_count,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'pending'
  ) as accounts_receivable_value,

  -- CONTAS A PAGAR
  (SELECT COUNT(*)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'pending'
  ) as accounts_payable_count,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'pending'
  ) as accounts_payable_value,

  -- CONTAS VENCIDAS
  (SELECT COUNT(*)
   FROM financial_transactions
   WHERE status = 'pending'
   AND date < CURRENT_DATE
  ) as overdue_count,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE status = 'pending'
   AND date < CURRENT_DATE
  ) as overdue_value,

  -- SALDO EM CONTAS
  (SELECT COALESCE(SUM(current_balance), 0)
   FROM bank_accounts
   WHERE is_active = true
  ) as total_bank_balance,

  -- NÚMERO DE TRANSAÇÕES
  (SELECT COUNT(*)
   FROM financial_transactions
  ) as total_transactions,

  (SELECT COUNT(*)
   FROM financial_transactions
   WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  ) as transactions_current_month,

  -- LUCRO POTENCIAL DO ESTOQUE
  (SELECT COALESCE(SUM(unit_cost * quantity), 0)
   FROM materials
   WHERE quantity > 0
  ) as inventory_cost_value,

  (SELECT COALESCE(SUM(unit_price * quantity), 0)
   FROM materials
   WHERE quantity > 0
  ) as inventory_sale_value,

  (SELECT COALESCE(SUM((unit_price - unit_cost) * quantity), 0)
   FROM materials
   WHERE quantity > 0
  ) as inventory_potential_profit,

  (SELECT
    CASE
      WHEN SUM(unit_cost * quantity) > 0
      THEN (SUM((unit_price - unit_cost) * quantity) / SUM(unit_cost * quantity)) * 100
      ELSE 0
    END
   FROM materials
   WHERE quantity > 0
  ) as inventory_profit_margin;

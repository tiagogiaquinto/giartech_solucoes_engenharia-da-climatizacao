/*
  # Função para Buscar Contas Bancárias com Transações
  
  Cria função RPC que retorna todas as contas bancárias ativas com:
  - Dados da conta (nome, banco, saldo)
  - Total de transações vinculadas
  - Total de receitas recebidas
  - Total de despesas pagas
  - Saldo calculado com base nas transações
*/

-- Criar função para buscar contas com transações
CREATE OR REPLACE FUNCTION get_bank_accounts_with_transactions()
RETURNS TABLE (
  id uuid,
  account_name text,
  bank_name text,
  balance numeric,
  is_default boolean,
  total_transactions bigint,
  total_receitas numeric,
  total_despesas numeric,
  saldo_calculado numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ba.id,
    ba.account_name,
    ba.bank_name,
    ba.balance,
    ba.is_default,
    COUNT(fe.id) as total_transactions,
    COALESCE(SUM(CASE WHEN fe.tipo = 'receita' AND fe.status IN ('recebido', 'pago') THEN fe.valor ELSE 0 END), 0) as total_receitas,
    COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' AND fe.status IN ('recebido', 'pago') THEN fe.valor ELSE 0 END), 0) as total_despesas,
    ba.balance + 
      COALESCE(SUM(CASE WHEN fe.tipo = 'receita' AND fe.status IN ('recebido', 'pago') THEN fe.valor ELSE 0 END), 0) - 
      COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' AND fe.status IN ('recebido', 'pago') THEN fe.valor ELSE 0 END), 0) as saldo_calculado
  FROM bank_accounts ba
  LEFT JOIN finance_entries fe ON fe.bank_account_id = ba.id
  WHERE ba.active = true
  GROUP BY ba.id, ba.account_name, ba.bank_name, ba.balance, ba.is_default
  ORDER BY ba.is_default DESC, ba.account_name;
END;
$$;

-- Permitir acesso à função
GRANT EXECUTE ON FUNCTION get_bank_accounts_with_transactions() TO anon, authenticated;

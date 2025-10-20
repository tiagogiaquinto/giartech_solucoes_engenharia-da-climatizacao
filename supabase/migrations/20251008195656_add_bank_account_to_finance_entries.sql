/*
  # Integração de Contas Bancárias com Lançamentos Financeiros

  1. Alterações na tabela finance_entries
    - Adiciona coluna bank_account_id para vincular lançamentos a contas
    - Adiciona foreign key para garantir integridade

  2. Triggers para atualizar saldo automaticamente
    - Trigger para INSERT: aumenta/diminui saldo conforme tipo de lançamento
    - Trigger para UPDATE: ajusta saldo se valor ou conta mudarem
    - Trigger para DELETE: reverte o impacto no saldo

  3. Função para recalcular saldo de uma conta
    - Útil para correções e auditoria
*/

-- Adiciona coluna para vincular lançamentos a contas bancárias
ALTER TABLE finance_entries 
ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- Cria índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_finance_entries_bank_account 
ON finance_entries(bank_account_id);

-- Função para atualizar saldo da conta quando um lançamento é inserido
CREATE OR REPLACE FUNCTION update_bank_balance_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atualiza se o lançamento está pago e tem conta vinculada
  IF NEW.status = 'pago' AND NEW.bank_account_id IS NOT NULL THEN
    IF NEW.tipo = 'receita' THEN
      -- Receita aumenta o saldo
      UPDATE bank_accounts 
      SET balance = COALESCE(balance, 0) + NEW.valor,
          updated_at = now()
      WHERE id = NEW.bank_account_id;
    ELSIF NEW.tipo = 'despesa' THEN
      -- Despesa diminui o saldo
      UPDATE bank_accounts 
      SET balance = COALESCE(balance, 0) - NEW.valor,
          updated_at = now()
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar saldo quando um lançamento é atualizado
CREATE OR REPLACE FUNCTION update_bank_balance_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Reverte o impacto do lançamento antigo
  IF OLD.status = 'pago' AND OLD.bank_account_id IS NOT NULL THEN
    IF OLD.tipo = 'receita' THEN
      UPDATE bank_accounts 
      SET balance = COALESCE(balance, 0) - OLD.valor,
          updated_at = now()
      WHERE id = OLD.bank_account_id;
    ELSIF OLD.tipo = 'despesa' THEN
      UPDATE bank_accounts 
      SET balance = COALESCE(balance, 0) + OLD.valor,
          updated_at = now()
      WHERE id = OLD.bank_account_id;
    END IF;
  END IF;
  
  -- Aplica o impacto do lançamento novo
  IF NEW.status = 'pago' AND NEW.bank_account_id IS NOT NULL THEN
    IF NEW.tipo = 'receita' THEN
      UPDATE bank_accounts 
      SET balance = COALESCE(balance, 0) + NEW.valor,
          updated_at = now()
      WHERE id = NEW.bank_account_id;
    ELSIF NEW.tipo = 'despesa' THEN
      UPDATE bank_accounts 
      SET balance = COALESCE(balance, 0) - NEW.valor,
          updated_at = now()
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar saldo quando um lançamento é deletado
CREATE OR REPLACE FUNCTION update_bank_balance_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Reverte o impacto do lançamento deletado
  IF OLD.status = 'pago' AND OLD.bank_account_id IS NOT NULL THEN
    IF OLD.tipo = 'receita' THEN
      UPDATE bank_accounts 
      SET balance = COALESCE(balance, 0) - OLD.valor,
          updated_at = now()
      WHERE id = OLD.bank_account_id;
    ELSIF OLD.tipo = 'despesa' THEN
      UPDATE bank_accounts 
      SET balance = COALESCE(balance, 0) + OLD.valor,
          updated_at = now()
      WHERE id = OLD.bank_account_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Cria os triggers
DROP TRIGGER IF EXISTS trigger_update_bank_balance_insert ON finance_entries;
CREATE TRIGGER trigger_update_bank_balance_insert
  AFTER INSERT ON finance_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_balance_on_insert();

DROP TRIGGER IF EXISTS trigger_update_bank_balance_update ON finance_entries;
CREATE TRIGGER trigger_update_bank_balance_update
  AFTER UPDATE ON finance_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_balance_on_update();

DROP TRIGGER IF EXISTS trigger_update_bank_balance_delete ON finance_entries;
CREATE TRIGGER trigger_update_bank_balance_delete
  AFTER DELETE ON finance_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_balance_on_delete();

-- Função auxiliar para recalcular saldo de uma conta específica
CREATE OR REPLACE FUNCTION recalculate_bank_balance(account_id uuid)
RETURNS void AS $$
DECLARE
  total_receitas numeric;
  total_despesas numeric;
  saldo_final numeric;
BEGIN
  -- Calcula total de receitas pagas
  SELECT COALESCE(SUM(valor), 0) INTO total_receitas
  FROM finance_entries
  WHERE bank_account_id = account_id
    AND tipo = 'receita'
    AND status = 'pago';
  
  -- Calcula total de despesas pagas
  SELECT COALESCE(SUM(valor), 0) INTO total_despesas
  FROM finance_entries
  WHERE bank_account_id = account_id
    AND tipo = 'despesa'
    AND status = 'pago';
  
  -- Calcula saldo final
  saldo_final := total_receitas - total_despesas;
  
  -- Atualiza a conta
  UPDATE bank_accounts
  SET balance = saldo_final,
      updated_at = now()
  WHERE id = account_id;
END;
$$ LANGUAGE plpgsql;

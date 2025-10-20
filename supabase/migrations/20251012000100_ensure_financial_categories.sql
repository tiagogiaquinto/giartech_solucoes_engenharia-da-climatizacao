/*
  # Garantir Categorias Financeiras

  1. Objetivo
    - Criar categorias financeiras padrão se não existirem
    - Garantir estrutura DRE completa

  2. Categorias
    - Receitas: Vendas, Serviços, Comissões
    - Despesas: Folha, Materiais, Impostos, Aluguel, etc
*/

-- Criar categorias de receita se não existirem
INSERT INTO financial_categories (name, nature, dre_grupo, active)
VALUES
  ('Vendas de Serviços', 'receita', 'Receita Operacional Bruta', true),
  ('Vendas de Produtos', 'receita', 'Receita Operacional Bruta', true),
  ('Comissões Recebidas', 'receita', 'Outras Receitas', true),
  ('Receitas Financeiras', 'receita', 'Receitas Financeiras', true)
ON CONFLICT (name) DO NOTHING;

-- Criar categorias de despesa se não existirem
INSERT INTO financial_categories (name, nature, dre_grupo, active)
VALUES
  ('Folha de Pagamento', 'despesa', 'Despesas com Pessoal', true),
  ('Encargos Trabalhistas', 'despesa', 'Despesas com Pessoal', true),
  ('Compra de Materiais', 'despesa', 'Custo das Mercadorias Vendidas', true),
  ('Aluguel', 'despesa', 'Despesas Operacionais', true),
  ('Energia Elétrica', 'despesa', 'Despesas Operacionais', true),
  ('Internet e Telefone', 'despesa', 'Despesas Operacionais', true),
  ('Manutenção de Equipamentos', 'despesa', 'Despesas Operacionais', true),
  ('Marketing e Publicidade', 'despesa', 'Despesas Comerciais', true),
  ('Combustível', 'despesa', 'Despesas Operacionais', true),
  ('Impostos e Taxas', 'despesa', 'Impostos', true),
  ('Despesas Bancárias', 'despesa', 'Despesas Financeiras', true),
  ('Juros Pagos', 'despesa', 'Despesas Financeiras', true)
ON CONFLICT (name) DO NOTHING;

-- Garantir que existe pelo menos uma conta bancária
INSERT INTO bank_accounts (
  bank_name,
  account_type,
  account_number,
  agency,
  current_balance,
  is_active,
  is_default
)
VALUES (
  'Conta Principal',
  'checking',
  '00001-0',
  '0001',
  0,
  true,
  true
)
ON CONFLICT DO NOTHING;

-- Atualizar transações sem categoria
UPDATE financial_transactions
SET category_id = (
  SELECT id FROM financial_categories
  WHERE nature = financial_transactions.type
  LIMIT 1
)
WHERE category_id IS NULL;

-- Atualizar transações sem conta bancária
UPDATE financial_transactions
SET bank_account_id = (
  SELECT id FROM bank_accounts
  WHERE is_default = true
  LIMIT 1
)
WHERE bank_account_id IS NULL;

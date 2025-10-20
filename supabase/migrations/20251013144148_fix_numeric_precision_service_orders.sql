/*
  # Corrigir Precisão Numérica em Service Orders

  ## Problema
  - Campos `desconto_percentual` e `margem_lucro` com precision 5, scale 2
  - Limite máximo: 999.99
  - Margem de lucro pode ultrapassar esse valor

  ## Solução
  - Aumentar precision para 10 em ambos os campos
  - Novo limite: 99,999,999.99

  ## Campos Alterados
  - `desconto_percentual`: numeric(5,2) → numeric(10,2)
  - `margem_lucro`: numeric(5,2) → numeric(10,2)
*/

-- Aumentar precisão do campo desconto_percentual
ALTER TABLE service_orders 
ALTER COLUMN desconto_percentual TYPE numeric(10,2);

-- Aumentar precisão do campo margem_lucro
ALTER TABLE service_orders 
ALTER COLUMN margem_lucro TYPE numeric(10,2);

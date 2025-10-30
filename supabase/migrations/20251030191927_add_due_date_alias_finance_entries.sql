/*
  # Adicionar Alias due_date para data_vencimento

  Cria uma coluna computada que serve como alias para data_vencimento
  para manter compatibilidade com código que usa due_date
*/

-- Adicionar coluna gerada que mapeia data_vencimento
ALTER TABLE finance_entries 
ADD COLUMN IF NOT EXISTS due_date date 
GENERATED ALWAYS AS (data_vencimento) STORED;

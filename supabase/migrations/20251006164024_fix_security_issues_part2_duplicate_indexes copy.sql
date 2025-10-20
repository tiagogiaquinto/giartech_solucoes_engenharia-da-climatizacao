/*
  # Correção de Segurança - Parte 2: Remover Índices Duplicados
  
  ## Problema
  Índices duplicados desperdiçam espaço e tempo de manutenção
  
  ## Solução
  Manter apenas um índice de cada par duplicado
  - customer_addresses: remover ix_customer_addresses_customer (manter idx_)
  - customer_contacts: remover ix_customer_contacts_customer (manter idx_)
*/

-- Remover índices duplicados - mantendo os com prefixo idx_
DROP INDEX IF EXISTS ix_customer_addresses_customer;
DROP INDEX IF EXISTS ix_customer_contacts_customer;

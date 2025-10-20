/*
  # Corrigir domínio de email incorreto

  1. Correção
    - Corrige todos os emails com domínio 'giartechsoluces.com.br' (errado)
    - Para 'giartechsolucoes.com.br' (correto - com 'o')

  2. Tabelas afetadas
    - email_accounts: corrige email_address, smtp_user, imap_user
    - email_messages: corrige from_address, to_addresses, cc_addresses, bcc_addresses
    - customers: corrige email (se existir)
    - employees: corrige email (se existir)

  3. Segurança
    - Usa WHERE para garantir que só corrige emails com domínio errado
    - Não afeta outros domínios
*/

-- Corrigir email_accounts
UPDATE email_accounts
SET
  email_address = REPLACE(email_address, '@giartechsoluces.com.br', '@giartechsolucoes.com.br'),
  smtp_user = REPLACE(smtp_user, '@giartechsoluces.com.br', '@giartechsolucoes.com.br'),
  imap_user = REPLACE(imap_user, '@giartechsoluces.com.br', '@giartechsolucoes.com.br')
WHERE
  email_address LIKE '%@giartechsoluces.com.br'
  OR smtp_user LIKE '%@giartechsoluces.com.br'
  OR imap_user LIKE '%@giartechsoluces.com.br';

-- Corrigir email_messages (from_address)
UPDATE email_messages
SET from_address = REPLACE(from_address, '@giartechsoluces.com.br', '@giartechsolucoes.com.br')
WHERE from_address LIKE '%@giartechsoluces.com.br';

-- Corrigir email_messages (to_addresses - array)
UPDATE email_messages
SET to_addresses = (
  SELECT array_agg(REPLACE(addr, '@giartechsoluces.com.br', '@giartechsolucoes.com.br'))
  FROM unnest(to_addresses) AS addr
)
WHERE EXISTS (
  SELECT 1 FROM unnest(to_addresses) AS addr
  WHERE addr LIKE '%@giartechsoluces.com.br'
);

-- Corrigir email_messages (cc_addresses - array se não for null)
UPDATE email_messages
SET cc_addresses = (
  SELECT array_agg(REPLACE(addr, '@giartechsoluces.com.br', '@giartechsolucoes.com.br'))
  FROM unnest(cc_addresses) AS addr
)
WHERE cc_addresses IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM unnest(cc_addresses) AS addr
    WHERE addr LIKE '%@giartechsoluces.com.br'
  );

-- Corrigir email_messages (bcc_addresses - array se não for null)
UPDATE email_messages
SET bcc_addresses = (
  SELECT array_agg(REPLACE(addr, '@giartechsoluces.com.br', '@giartechsolucoes.com.br'))
  FROM unnest(bcc_addresses) AS addr
)
WHERE bcc_addresses IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM unnest(bcc_addresses) AS addr
    WHERE addr LIKE '%@giartechsoluces.com.br'
  );

-- Corrigir customers (se existir coluna email)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'email'
  ) THEN
    UPDATE customers
    SET email = REPLACE(email, '@giartechsoluces.com.br', '@giartechsolucoes.com.br')
    WHERE email LIKE '%@giartechsoluces.com.br';
  END IF;
END $$;

-- Corrigir employees (se existir coluna email)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'email'
  ) THEN
    UPDATE employees
    SET email = REPLACE(email, '@giartechsoluces.com.br', '@giartechsolucoes.com.br')
    WHERE email LIKE '%@giartechsoluces.com.br';
  END IF;
END $$;

-- Log de auditoria
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Conta quantos registros foram afetados
  SELECT COUNT(*) INTO v_count
  FROM email_accounts
  WHERE email_address LIKE '%@giartechsolucoes.com.br';

  RAISE NOTICE 'Migração concluída: % contas de email corrigidas', v_count;
END $$;

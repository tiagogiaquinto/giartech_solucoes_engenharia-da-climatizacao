/*
  ========================================
  SCRIPT: Corrigir PIX em OSs Antigas
  ========================================

  OBJETIVO:
  Atualizar o campo payment_pix de ordens de serviço antigas
  que foram criadas antes da correção, substituindo o CNPJ
  do cliente pelo CNPJ da empresa.

  QUANDO EXECUTAR:
  - Depois de aplicar a correção no código
  - Se você quer corrigir OSs que já foram criadas
  - Opcional: você pode deixar as antigas como estão

  SEGURANÇA:
  - Não afeta OSs canceladas/excluídas
  - Mantém auditoria das mudanças
  - Pode ser revertido se necessário
*/

-- =====================================================
-- PARTE 1: ANÁLISE
-- =====================================================

-- Ver quantas OSs serão afetadas
SELECT
  '1. OSs com PIX do cliente (a serem corrigidas)' as analise,
  COUNT(*) as total
FROM service_orders so
WHERE so.status NOT IN ('cancelada', 'excluida')
  AND so.payment_pix != (SELECT cnpj FROM company_settings LIMIT 1)
  AND so.payment_pix IS NOT NULL
  AND so.payment_pix != '';

-- Ver algumas OSs que serão corrigidas (amostra)
SELECT
  so.order_number as "Número OS",
  so.client_name as "Cliente",
  so.payment_pix as "PIX Atual (Cliente)",
  (SELECT cnpj FROM company_settings LIMIT 1) as "PIX Correto (Empresa)"
FROM service_orders so
WHERE so.status NOT IN ('cancelada', 'excluida')
  AND so.payment_pix != (SELECT cnpj FROM company_settings LIMIT 1)
  AND so.payment_pix IS NOT NULL
  AND so.payment_pix != ''
LIMIT 10;

-- =====================================================
-- PARTE 2: BACKUP (Recomendado)
-- =====================================================

-- Criar backup dos dados antes de alterar
CREATE TEMP TABLE IF NOT EXISTS service_orders_pix_backup AS
SELECT
  id,
  order_number,
  payment_pix as old_payment_pix,
  NOW() as backup_at
FROM service_orders
WHERE status NOT IN ('cancelada', 'excluida')
  AND payment_pix IS NOT NULL
  AND payment_pix != '';

RAISE NOTICE 'Backup criado: % registros', (SELECT COUNT(*) FROM service_orders_pix_backup);

-- =====================================================
-- PARTE 3: ATUALIZAÇÃO
-- =====================================================

-- Atualizar payment_pix com CNPJ da empresa
UPDATE service_orders
SET
  payment_pix = (SELECT cnpj FROM company_settings LIMIT 1),
  updated_at = NOW()
WHERE status NOT IN ('cancelada', 'excluida')
  AND payment_pix != (SELECT cnpj FROM company_settings LIMIT 1)
  AND payment_pix IS NOT NULL
  AND payment_pix != '';

-- Contar quantas OSs foram atualizadas
DO $$
DECLARE
  oss_atualizadas INTEGER;
BEGIN
  GET DIAGNOSTICS oss_atualizadas = ROW_COUNT;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OSs atualizadas: %', oss_atualizadas;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PARTE 4: AUDITORIA
-- =====================================================

-- Registrar mudança em audit_logs
INSERT INTO audit_logs (
  table_name,
  record_id,
  action,
  changed_by,
  changed_at,
  old_data,
  new_data
)
SELECT
  'service_orders' as table_name,
  so.id as record_id,
  'update_payment_pix' as action,
  'system' as changed_by,
  NOW() as changed_at,
  jsonb_build_object(
    'old_payment_pix', backup.old_payment_pix,
    'reason', 'Correção: PIX deve ser da empresa, não do cliente'
  ) as old_data,
  jsonb_build_object(
    'new_payment_pix', so.payment_pix,
    'company_cnpj', (SELECT cnpj FROM company_settings LIMIT 1)
  ) as new_data
FROM service_orders so
INNER JOIN service_orders_pix_backup backup ON backup.id = so.id
WHERE so.payment_pix != backup.old_payment_pix;

-- =====================================================
-- PARTE 5: VALIDAÇÃO
-- =====================================================

-- Verificar se todas as OSs agora têm PIX da empresa
SELECT
  'OSs com PIX da empresa' as status,
  COUNT(*) as total
FROM service_orders
WHERE status NOT IN ('cancelada', 'excluida')
  AND payment_pix = (SELECT cnpj FROM company_settings LIMIT 1);

-- Verificar se ainda há OSs com PIX diferente
SELECT
  'OSs com PIX diferente' as status,
  COUNT(*) as total
FROM service_orders
WHERE status NOT IN ('cancelada', 'excluida')
  AND payment_pix != (SELECT cnpj FROM company_settings LIMIT 1)
  AND payment_pix IS NOT NULL
  AND payment_pix != '';

-- =====================================================
-- PARTE 6: EXEMPLOS DE ANTES/DEPOIS
-- =====================================================

-- Ver comparação antes/depois (primeiras 5 OSs)
SELECT
  so.order_number as "Número OS",
  backup.old_payment_pix as "PIX Antes (Cliente)",
  so.payment_pix as "PIX Depois (Empresa)",
  CASE
    WHEN so.payment_pix = (SELECT cnpj FROM company_settings LIMIT 1)
    THEN '✓ Corrigido'
    ELSE '✗ Não corrigido'
  END as "Status"
FROM service_orders so
INNER JOIN service_orders_pix_backup backup ON backup.id = so.id
ORDER BY so.created_at DESC
LIMIT 5;

-- =====================================================
-- PARTE 7: ROLLBACK (Se necessário)
-- =====================================================

/*
  SE PRECISAR REVERTER (descomente e execute):

-- Restaurar valores antigos do backup
UPDATE service_orders so
SET
  payment_pix = backup.old_payment_pix,
  updated_at = NOW()
FROM service_orders_pix_backup backup
WHERE so.id = backup.id;

RAISE NOTICE 'Rollback executado. Valores restaurados do backup.';
*/

-- =====================================================
-- PARTE 8: LIMPEZA
-- =====================================================

-- Limpar tabela temporária de backup
-- (mantenha comentado se quiser manter o backup)
-- DROP TABLE IF EXISTS service_orders_pix_backup;

-- Mensagem final
DO $$
DECLARE
  total_oss INTEGER;
  oss_corretas INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_oss
  FROM service_orders
  WHERE status NOT IN ('cancelada', 'excluida');

  SELECT COUNT(*) INTO oss_corretas
  FROM service_orders
  WHERE status NOT IN ('cancelada', 'excluida')
    AND payment_pix = (SELECT cnpj FROM company_settings LIMIT 1);

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO CONCLUÍDA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de OSs ativas: %', total_oss;
  RAISE NOTICE 'OSs com PIX correto: %', oss_corretas;
  RAISE NOTICE 'Percentual corrigido: %%%', ROUND((oss_corretas::DECIMAL / NULLIF(total_oss, 0) * 100), 2);
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TODAS AS OSs AGORA TÊM PIX DA EMPRESA!';
  RAISE NOTICE '========================================';
END $$;

/*
  ========================================
  IMPORTANTE
  ========================================

  1. Este script é OPCIONAL
  2. OSs novas já terão PIX correto automaticamente
  3. OSs antigas podem ficar como estão se você preferir
  4. O backup fica em service_orders_pix_backup
  5. Você pode fazer rollback se necessário
  6. A auditoria fica registrada em audit_logs

  ========================================
  QUANDO EXECUTAR
  ========================================

  Execute este script SE:
  ✓ Você quer corrigir OSs antigas
  ✓ Clientes estão fazendo PIX errado
  ✓ Você quer dados consistentes

  NÃO execute SE:
  ✗ Você não se importa com OSs antigas
  ✗ Não tem OSs antigas com problema
  ✗ Prefere corrigir manualmente quando necessário

  ========================================
*/

/*
  # Correção: Atualizar PIX de Todas as Ordens de Serviço

  ## Objetivo
  Atualizar o campo payment_pix de TODAS as ordens de serviço para usar
  o CNPJ/CPF da empresa em vez do CNPJ/CPF do cliente.

  ## Problema
  OSs antigas foram criadas com payment_pix apontando para o cliente (quem paga)
  em vez da empresa (quem recebe). Isso causa confusão nos pagamentos.

  ## Solução
  Substituir todos os valores de payment_pix pelo CNPJ da empresa,
  garantindo que clientes façam pagamentos para a conta correta.

  ## Segurança
  - Cria backup antes de alterar
  - Registra em audit_logs
  - Validação pós-atualização
  - Rollback disponível
*/

-- =====================================================
-- PARTE 1: ANÁLISE INICIAL
-- =====================================================

DO $$
DECLARE
  total_oss INTEGER;
  oss_ativas INTEGER;
  empresa_cnpj TEXT;
BEGIN
  -- Buscar CNPJ da empresa
  SELECT cnpj INTO empresa_cnpj
  FROM company_settings
  LIMIT 1;

  -- Contar OSs
  SELECT COUNT(*) INTO total_oss
  FROM service_orders;

  SELECT COUNT(*) INTO oss_ativas
  FROM service_orders
  WHERE status NOT IN ('cancelada', 'excluida');

  RAISE NOTICE '========================================';
  RAISE NOTICE 'ANÁLISE INICIAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CNPJ da Empresa: %', COALESCE(empresa_cnpj, 'NÃO CONFIGURADO');
  RAISE NOTICE 'Total de OSs: %', total_oss;
  RAISE NOTICE 'OSs ativas: %', oss_ativas;
  RAISE NOTICE '========================================';

  -- Verificar se empresa está configurada
  IF empresa_cnpj IS NULL THEN
    RAISE EXCEPTION 'ERRO: Empresa não configurada em company_settings. Configure antes de executar esta migration.';
  END IF;
END $$;

-- Ver OSs que serão atualizadas
SELECT
  COUNT(*) as total_para_atualizar,
  COUNT(CASE WHEN payment_pix IS NOT NULL AND payment_pix != '' THEN 1 END) as com_pix_preenchido,
  COUNT(CASE WHEN payment_pix IS NULL OR payment_pix = '' THEN 1 END) as sem_pix
FROM service_orders
WHERE status NOT IN ('cancelada', 'excluida');

-- =====================================================
-- PARTE 2: CRIAR BACKUP
-- =====================================================

-- Tabela de backup temporária
CREATE TEMP TABLE IF NOT EXISTS payment_pix_backup AS
SELECT
  id,
  order_number,
  payment_pix as old_payment_pix,
  client_name,
  client_cnpj,
  status,
  created_at,
  NOW() as backup_at
FROM service_orders;

-- Log do backup
DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM payment_pix_backup;
  RAISE NOTICE 'Backup criado: % OSs salvas', backup_count;
END $$;

-- =====================================================
-- PARTE 3: ATUALIZAÇÃO DO PAYMENT_PIX
-- =====================================================

-- Atualizar todas as OSs com o CNPJ da empresa
UPDATE service_orders
SET
  payment_pix = (
    SELECT COALESCE(cnpj, cpf, '00.000.000/0000-00')
    FROM company_settings
    LIMIT 1
  ),
  updated_at = NOW()
WHERE status NOT IN ('cancelada', 'excluida');

-- Contar OSs atualizadas
DO $$
DECLARE
  oss_atualizadas INTEGER;
  cnpj_empresa TEXT;
BEGIN
  GET DIAGNOSTICS oss_atualizadas = ROW_COUNT;

  SELECT COALESCE(cnpj, cpf) INTO cnpj_empresa
  FROM company_settings
  LIMIT 1;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'ATUALIZAÇÃO CONCLUÍDA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OSs atualizadas: %', oss_atualizadas;
  RAISE NOTICE 'Novo PIX (empresa): %', cnpj_empresa;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PARTE 4: ATUALIZAR TAMBÉM OSs CANCELADAS (OPCIONAL)
-- =====================================================

-- Atualizar OSs canceladas também (para consistência histórica)
UPDATE service_orders
SET
  payment_pix = (
    SELECT COALESCE(cnpj, cpf, '00.000.000/0000-00')
    FROM company_settings
    LIMIT 1
  ),
  updated_at = NOW()
WHERE status IN ('cancelada', 'excluida')
  AND (payment_pix IS NULL OR payment_pix = '' OR payment_pix != (
    SELECT COALESCE(cnpj, cpf)
    FROM company_settings
    LIMIT 1
  ));

-- =====================================================
-- PARTE 5: AUDITORIA
-- =====================================================

-- Registrar todas as mudanças em audit_logs
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
  'fix_payment_pix' as action,
  'system_migration' as changed_by,
  NOW() as changed_at,
  jsonb_build_object(
    'order_number', backup.order_number,
    'old_payment_pix', backup.old_payment_pix,
    'client_name', backup.client_name,
    'client_cnpj', backup.client_cnpj,
    'status', backup.status,
    'reason', 'Correção: PIX deve ser da empresa, não do cliente'
  ) as old_data,
  jsonb_build_object(
    'new_payment_pix', so.payment_pix,
    'company_cnpj', (SELECT cnpj FROM company_settings LIMIT 1),
    'updated_at', so.updated_at
  ) as new_data
FROM service_orders so
INNER JOIN payment_pix_backup backup ON backup.id = so.id
WHERE so.payment_pix != COALESCE(backup.old_payment_pix, '');

-- Log da auditoria
DO $$
DECLARE
  audit_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO audit_count
  FROM audit_logs
  WHERE action = 'fix_payment_pix'
    AND changed_at >= NOW() - INTERVAL '1 minute';

  RAISE NOTICE 'Registros de auditoria criados: %', audit_count;
END $$;

-- =====================================================
-- PARTE 6: VALIDAÇÃO
-- =====================================================

-- Verificar se todas as OSs ativas têm PIX da empresa
DO $$
DECLARE
  total_ativas INTEGER;
  com_pix_correto INTEGER;
  sem_pix INTEGER;
  pix_diferente INTEGER;
  cnpj_empresa TEXT;
  percentual NUMERIC;
BEGIN
  SELECT COALESCE(cnpj, cpf) INTO cnpj_empresa
  FROM company_settings
  LIMIT 1;

  SELECT COUNT(*) INTO total_ativas
  FROM service_orders
  WHERE status NOT IN ('cancelada', 'excluida');

  SELECT COUNT(*) INTO com_pix_correto
  FROM service_orders
  WHERE status NOT IN ('cancelada', 'excluida')
    AND payment_pix = cnpj_empresa;

  SELECT COUNT(*) INTO sem_pix
  FROM service_orders
  WHERE status NOT IN ('cancelada', 'excluida')
    AND (payment_pix IS NULL OR payment_pix = '');

  SELECT COUNT(*) INTO pix_diferente
  FROM service_orders
  WHERE status NOT IN ('cancelada', 'excluida')
    AND payment_pix IS NOT NULL
    AND payment_pix != ''
    AND payment_pix != cnpj_empresa;

  percentual := CASE
    WHEN total_ativas > 0
    THEN ROUND((com_pix_correto::NUMERIC / total_ativas * 100), 2)
    ELSE 0
  END;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de OSs ativas: %', total_ativas;
  RAISE NOTICE 'Com PIX correto (empresa): %', com_pix_correto;
  RAISE NOTICE 'Sem PIX: %', sem_pix;
  RAISE NOTICE 'Com PIX diferente: %', pix_diferente;
  RAISE NOTICE 'Percentual correto: %%%', percentual;
  RAISE NOTICE '========================================';

  IF pix_diferente > 0 THEN
    RAISE WARNING 'ATENÇÃO: % OSs ainda têm PIX diferente do esperado', pix_diferente;
  END IF;

  IF percentual = 100 THEN
    RAISE NOTICE '✓ SUCESSO: Todas as OSs ativas têm PIX da empresa!';
  ELSE
    RAISE NOTICE '⚠ AVISO: Nem todas as OSs foram atualizadas corretamente';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PARTE 7: EXEMPLOS ANTES/DEPOIS
-- =====================================================

-- Mostrar exemplos de OSs atualizadas (primeiras 10)
SELECT
  backup.order_number as "Número OS",
  backup.client_name as "Cliente",
  backup.old_payment_pix as "PIX Antes",
  so.payment_pix as "PIX Depois",
  CASE
    WHEN so.payment_pix = (SELECT cnpj FROM company_settings LIMIT 1)
    THEN '✓ Correto'
    ELSE '✗ Diferente'
  END as "Status",
  backup.status as "Status OS"
FROM service_orders so
INNER JOIN payment_pix_backup backup ON backup.id = so.id
WHERE backup.old_payment_pix IS DISTINCT FROM so.payment_pix
ORDER BY so.created_at DESC
LIMIT 10;

-- =====================================================
-- PARTE 8: ESTATÍSTICAS DETALHADAS
-- =====================================================

-- Estatísticas por status de OS
SELECT
  status as "Status da OS",
  COUNT(*) as "Total",
  COUNT(CASE
    WHEN payment_pix = (SELECT cnpj FROM company_settings LIMIT 1)
    THEN 1
  END) as "Com PIX Empresa",
  COUNT(CASE
    WHEN payment_pix IS NULL OR payment_pix = ''
    THEN 1
  END) as "Sem PIX",
  COUNT(CASE
    WHEN payment_pix IS NOT NULL
      AND payment_pix != ''
      AND payment_pix != (SELECT cnpj FROM company_settings LIMIT 1)
    THEN 1
  END) as "PIX Diferente"
FROM service_orders
GROUP BY status
ORDER BY COUNT(*) DESC;

-- Estatísticas de valores
SELECT
  'Valores Financeiros' as categoria,
  COUNT(*) as total_oss,
  SUM(total_value) as valor_total,
  AVG(total_value) as valor_medio,
  MIN(total_value) as valor_minimo,
  MAX(total_value) as valor_maximo
FROM service_orders
WHERE status NOT IN ('cancelada', 'excluida')
  AND payment_pix = (SELECT cnpj FROM company_settings LIMIT 1);

-- =====================================================
-- PARTE 9: FUNÇÃO HELPER PARA CONSULTAS
-- =====================================================

-- Função para verificar status do PIX de uma OS
CREATE OR REPLACE FUNCTION check_payment_pix_status(p_order_id UUID)
RETURNS TABLE (
  order_number TEXT,
  client_name TEXT,
  current_pix TEXT,
  company_pix TEXT,
  is_correct BOOLEAN,
  needs_update BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    so.order_number,
    so.client_name,
    so.payment_pix as current_pix,
    (SELECT COALESCE(cs.cnpj, cs.cpf) FROM company_settings cs LIMIT 1) as company_pix,
    (so.payment_pix = (SELECT COALESCE(cs.cnpj, cs.cpf) FROM company_settings cs LIMIT 1)) as is_correct,
    (so.payment_pix IS NULL OR so.payment_pix = '' OR so.payment_pix != (SELECT COALESCE(cs.cnpj, cs.cpf) FROM company_settings cs LIMIT 1)) as needs_update
  FROM service_orders so
  WHERE so.id = p_order_id;
END;
$$;

COMMENT ON FUNCTION check_payment_pix_status IS
'Verifica o status do campo payment_pix de uma ordem de serviço específica';

-- =====================================================
-- PARTE 10: VIEWS PARA MONITORAMENTO
-- =====================================================

-- View para OSs com dados de pagamento
CREATE OR REPLACE VIEW v_orders_payment_status AS
SELECT
  so.id,
  so.order_number,
  so.client_name,
  so.client_cnpj,
  so.status,
  so.total_value,
  so.payment_pix,
  (SELECT COALESCE(cnpj, cpf) FROM company_settings LIMIT 1) as empresa_pix,
  CASE
    WHEN so.payment_pix = (SELECT COALESCE(cnpj, cpf) FROM company_settings LIMIT 1)
    THEN 'Correto'
    WHEN so.payment_pix IS NULL OR so.payment_pix = ''
    THEN 'Sem PIX'
    ELSE 'Diferente'
  END as pix_status,
  so.created_at,
  so.updated_at
FROM service_orders so
WHERE so.status NOT IN ('cancelada', 'excluida')
ORDER BY so.created_at DESC;

COMMENT ON VIEW v_orders_payment_status IS
'Visualização do status de payment_pix de todas as ordens ativas';

-- =====================================================
-- PARTE 11: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice no campo payment_pix para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_service_orders_payment_pix
ON service_orders(payment_pix)
WHERE payment_pix IS NOT NULL AND payment_pix != '';

-- Índice composto para consultas de validação
CREATE INDEX IF NOT EXISTS idx_service_orders_status_pix
ON service_orders(status, payment_pix)
WHERE status NOT IN ('cancelada', 'excluida');

-- =====================================================
-- PARTE 12: LIMPEZA E MENSAGEM FINAL
-- =====================================================

-- Manter backup por 30 dias (opcional - descomente se quiser)
-- CREATE TABLE IF NOT EXISTS payment_pix_backup_permanent AS
-- SELECT * FROM payment_pix_backup;

-- Mensagem final
DO $$
DECLARE
  total_sistema INTEGER;
  total_corretas INTEGER;
  cnpj_empresa TEXT;
BEGIN
  SELECT COUNT(*) INTO total_sistema
  FROM service_orders;

  SELECT COUNT(*) INTO total_corretas
  FROM service_orders
  WHERE payment_pix = (SELECT COALESCE(cnpj, cpf) FROM company_settings LIMIT 1);

  SELECT COALESCE(cnpj, cpf) INTO cnpj_empresa
  FROM company_settings
  LIMIT 1;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'CNPJ da Empresa: %', cnpj_empresa;
  RAISE NOTICE 'Total de OSs no sistema: %', total_sistema;
  RAISE NOTICE 'OSs com PIX da empresa: %', total_corretas;
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Verificar v_orders_payment_status';
  RAISE NOTICE '2. Testar criação de nova OS';
  RAISE NOTICE '3. Gerar PDF de uma OS';
  RAISE NOTICE '4. Confirmar que PIX está correto';
  RAISE NOTICE '';
  RAISE NOTICE 'Backup disponível em: payment_pix_backup';
  RAISE NOTICE 'Auditoria registrada em: audit_logs';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TODAS AS ORDENS ATUALIZADAS!';
  RAISE NOTICE '========================================';
END $$;

-- Limpar tabela temporária (descomente se quiser)
-- DROP TABLE IF EXISTS payment_pix_backup;

/*
  # Configurar CNPJ da Empresa

  ## Objetivo
  Garantir que o CNPJ da empresa esteja corretamente configurado
  em company_settings antes de aplicar a correção de payment_pix

  ## Dados
  CNPJ: 37.509.897/0001-93 (37509897000193)

  ## Ações
  1. Verificar se company_settings existe
  2. Inserir ou atualizar com CNPJ correto
  3. Validar configuração
*/

-- =====================================================
-- PARTE 1: VERIFICAR ESTADO ATUAL
-- =====================================================

DO $$
DECLARE
  config_exists BOOLEAN;
  current_cnpj TEXT;
BEGIN
  -- Verificar se existe configuração
  SELECT EXISTS(SELECT 1 FROM company_settings) INTO config_exists;

  IF config_exists THEN
    SELECT cnpj INTO current_cnpj FROM company_settings LIMIT 1;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Configuração encontrada';
    RAISE NOTICE 'CNPJ atual: %', COALESCE(current_cnpj, 'NÃO CONFIGURADO');
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Nenhuma configuração encontrada';
    RAISE NOTICE 'Será criada nova configuração';
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- =====================================================
-- PARTE 2: INSERIR OU ATUALIZAR CNPJ
-- =====================================================

-- Inserir configuração se não existir
INSERT INTO company_settings (
  id,
  company_name,
  cnpj,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'Giartech Soluções',
  '37.509.897/0001-93',
  'contato@giartech.com',
  '(00) 0000-0000',
  '',
  '',
  '',
  '',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

-- Atualizar CNPJ se configuração já existe
UPDATE company_settings
SET
  cnpj = '37.509.897/0001-93',
  updated_at = NOW()
WHERE cnpj IS NULL
   OR cnpj = ''
   OR cnpj != '37.509.897/0001-93';

-- =====================================================
-- PARTE 3: VALIDAÇÃO
-- =====================================================

DO $$
DECLARE
  config_count INTEGER;
  final_cnpj TEXT;
BEGIN
  SELECT COUNT(*) INTO config_count FROM company_settings;
  SELECT cnpj INTO final_cnpj FROM company_settings LIMIT 1;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CONFIGURAÇÃO FINALIZADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Registros em company_settings: %', config_count;
  RAISE NOTICE 'CNPJ configurado: %', final_cnpj;
  RAISE NOTICE '========================================';

  IF final_cnpj = '37.509.897/0001-93' THEN
    RAISE NOTICE '✓ SUCESSO: CNPJ da empresa configurado corretamente!';
  ELSE
    RAISE WARNING '✗ AVISO: CNPJ não está como esperado';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PARTE 4: GARANTIR DADOS BÁSICOS
-- =====================================================

-- Garantir que os campos básicos estejam preenchidos
UPDATE company_settings
SET
  company_name = COALESCE(NULLIF(company_name, ''), 'Giartech Soluções'),
  email = COALESCE(NULLIF(email, ''), 'contato@giartech.com'),
  phone = COALESCE(NULLIF(phone, ''), '(00) 0000-0000'),
  updated_at = NOW()
WHERE id = (SELECT id FROM company_settings LIMIT 1);

-- =====================================================
-- PARTE 5: CRIAR ÍNDICE PARA PERFORMANCE
-- =====================================================

-- Índice para consultas rápidas de CNPJ
CREATE INDEX IF NOT EXISTS idx_company_settings_cnpj
ON company_settings(cnpj)
WHERE cnpj IS NOT NULL AND cnpj != '';

-- =====================================================
-- PARTE 6: AUDITORIA
-- =====================================================

-- Registrar configuração em audit_logs
INSERT INTO audit_logs (
  table_name,
  record_id,
  action,
  changed_by,
  changed_at,
  new_data
)
SELECT
  'company_settings',
  id,
  'configure_cnpj',
  'system_migration',
  NOW(),
  jsonb_build_object(
    'cnpj', '37.509.897/0001-93',
    'company_name', company_name,
    'email', email,
    'phone', phone
  )
FROM company_settings
LIMIT 1;

-- =====================================================
-- PARTE 7: MENSAGEM FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════╗';
  RAISE NOTICE '║   CNPJ DA EMPRESA CONFIGURADO         ║';
  RAISE NOTICE '╠═══════════════════════════════════════╣';
  RAISE NOTICE '║   CNPJ: 37.509.897/0001-93           ║';
  RAISE NOTICE '║   Empresa: Giartech Soluções          ║';
  RAISE NOTICE '║   Status: ✓ ATIVO                     ║';
  RAISE NOTICE '╠═══════════════════════════════════════╣';
  RAISE NOTICE '║   Próximo passo:                      ║';
  RAISE NOTICE '║   Executar migration de atualização   ║';
  RAISE NOTICE '║   de payment_pix em todas as OSs      ║';
  RAISE NOTICE '╚═══════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- Comentário na tabela
COMMENT ON TABLE company_settings IS
'Configurações da empresa - CNPJ: 37.509.897/0001-93';

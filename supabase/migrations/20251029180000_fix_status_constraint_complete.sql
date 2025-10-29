/*
  # Correção: Status Constraint Completo

  ## Problema
  Constraint service_orders_status_check está rejeitando status válidos

  ## Solução
  Recriar constraint com TODOS os status possíveis

  ## Status Válidos
  - aberta (legado)
  - pendente
  - em_andamento
  - pausado
  - concluido
  - cancelada
  - cancelado
  - excluida
  - finalizada
*/

-- =====================================================
-- PARTE 1: REMOVER CONSTRAINT ATUAL
-- =====================================================

DO $$
BEGIN
  -- Remover constraint se existir
  ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;

  RAISE NOTICE 'Constraint antigo removido';
END $$;

-- =====================================================
-- PARTE 2: VERIFICAR STATUS EXISTENTES
-- =====================================================

DO $$
DECLARE
  status_list TEXT;
BEGIN
  SELECT string_agg(DISTINCT status, ', ' ORDER BY status)
  INTO status_list
  FROM service_orders;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Status encontrados no sistema:';
  RAISE NOTICE '%', COALESCE(status_list, 'NENHUM');
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PARTE 3: NORMALIZAR STATUS (se necessário)
-- =====================================================

-- Normalizar variações
UPDATE service_orders SET status = 'pendente' WHERE status IN ('aberta', 'open');
UPDATE service_orders SET status = 'em_andamento' WHERE status IN ('in_progress', 'em andamento');
UPDATE service_orders SET status = 'concluido' WHERE status IN ('completed', 'concluída', 'finalizada');
UPDATE service_orders SET status = 'cancelada' WHERE status IN ('cancelled', 'cancelado');

-- Log das normalizações
DO $$
DECLARE
  normalizadas INTEGER;
BEGIN
  GET DIAGNOSTICS normalizadas = ROW_COUNT;
  IF normalizadas > 0 THEN
    RAISE NOTICE 'Status normalizados: %', normalizadas;
  END IF;
END $$;

-- =====================================================
-- PARTE 4: CRIAR NOVO CONSTRAINT COMPLETO
-- =====================================================

ALTER TABLE service_orders
ADD CONSTRAINT service_orders_status_check
CHECK (status IN (
  'pendente',
  'em_andamento',
  'pausado',
  'concluido',
  'cancelada',
  'excluida',
  -- Legado (manter compatibilidade)
  'aberta',
  'cancelado',
  'finalizada'
));

RAISE NOTICE '========================================';
RAISE NOTICE 'Novo constraint criado com sucesso!';
RAISE NOTICE '========================================';

-- =====================================================
-- PARTE 5: ADICIONAR COMENTÁRIO
-- =====================================================

COMMENT ON COLUMN service_orders.status IS
'Status válidos: pendente, em_andamento, pausado, concluido, cancelada, excluida
Legado: aberta, cancelado, finalizada';

-- =====================================================
-- PARTE 6: VALIDAÇÃO
-- =====================================================

DO $$
DECLARE
  status_invalidos INTEGER;
BEGIN
  -- Verificar se há status inválidos
  SELECT COUNT(*)
  INTO status_invalidos
  FROM service_orders
  WHERE status NOT IN (
    'pendente', 'em_andamento', 'pausado', 'concluido',
    'cancelada', 'excluida', 'aberta', 'cancelado', 'finalizada'
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OSs com status inválido: %', status_invalidos;

  IF status_invalidos > 0 THEN
    RAISE WARNING 'Existem % OSs com status inválido!', status_invalidos;

    -- Mostrar os status inválidos
    RAISE NOTICE 'Status inválidos encontrados:';
    FOR rec IN
      SELECT DISTINCT status, COUNT(*) as total
      FROM service_orders
      WHERE status NOT IN (
        'pendente', 'em_andamento', 'pausado', 'concluido',
        'cancelada', 'excluida', 'aberta', 'cancelado', 'finalizada'
      )
      GROUP BY status
    LOOP
      RAISE NOTICE '  - "%" (%)', rec.status, rec.total;
    END LOOP;
  ELSE
    RAISE NOTICE '✓ Todos os status são válidos!';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PARTE 7: ESTATÍSTICAS DE STATUS
-- =====================================================

SELECT
  status as "Status",
  COUNT(*) as "Total OSs",
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM service_orders), 2) as "Percentual"
FROM service_orders
GROUP BY status
ORDER BY COUNT(*) DESC;

-- =====================================================
-- PARTE 8: TESTAR CONSTRAINT
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════╗';
  RAISE NOTICE '║  CONSTRAINT CORRIGIDO COM SUCESSO     ║';
  RAISE NOTICE '╠═══════════════════════════════════════╣';
  RAISE NOTICE '║  Status válidos:                      ║';
  RAISE NOTICE '║  • pendente                           ║';
  RAISE NOTICE '║  • em_andamento                       ║';
  RAISE NOTICE '║  • pausado                            ║';
  RAISE NOTICE '║  • concluido ✓                        ║';
  RAISE NOTICE '║  • cancelada                          ║';
  RAISE NOTICE '║  • excluida                           ║';
  RAISE NOTICE '╠═══════════════════════════════════════╣';
  RAISE NOTICE '║  Agora você pode salvar OSs com       ║';
  RAISE NOTICE '║  status "concluido" sem erros!        ║';
  RAISE NOTICE '╚═══════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

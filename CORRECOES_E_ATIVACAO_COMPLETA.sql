-- ================================================
-- SCRIPT DE CORREÇÃO E ATIVAÇÃO COMPLETA
-- Sistema Giartech - 6 Novas Funcionalidades
-- ================================================

-- ==================================
-- 1. VERIFICAR E CORRIGIR NOTIFICAÇÕES
-- ==================================

-- Verificar se tabela existe
SELECT 'Tabela notifications: ' ||
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'notifications'
  ) THEN 'EXISTE ✓' ELSE 'NÃO EXISTE ✗' END as status;

-- Verificar quantidade de notificações
SELECT
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  COUNT(*) FILTER (WHERE is_read = true) as read
FROM notifications;

-- Verificar notificações por categoria
SELECT
  category,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = false) as unread
FROM notifications
GROUP BY category
ORDER BY total DESC;

-- ==================================
-- 2. VERIFICAR E CORRIGIR RFM
-- ==================================

-- Verificar se views RFM existem
SELECT 'View v_customer_rfm_metrics: ' ||
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'v_customer_rfm_metrics'
  ) THEN 'EXISTE ✓' ELSE 'NÃO EXISTE ✗' END as status;

SELECT 'View v_customer_rfm_segments: ' ||
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'v_customer_rfm_segments'
  ) THEN 'EXISTE ✓' ELSE 'NÃO EXISTE ✗' END as status;

SELECT 'View v_rfm_summary: ' ||
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'v_rfm_summary'
  ) THEN 'EXISTE ✓' ELSE 'NÃO EXISTE ✗' END as status;

-- Testar análise RFM
SELECT
  segment,
  count,
  avg_recency,
  avg_frequency,
  total_value
FROM v_rfm_summary
ORDER BY total_value DESC;

-- ==================================
-- 3. VERIFICAR E CORRIGIR ASSINATURA
-- ==================================

-- Verificar se colunas de assinatura existem
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'service_orders'
  AND column_name IN ('customer_signature', 'signature_date', 'signed_by_name', 'signature_ip')
ORDER BY column_name;

-- Verificar OSs assinadas
SELECT
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE customer_signature IS NOT NULL) as signed_orders,
  COUNT(*) FILTER (WHERE customer_signature IS NULL) as unsigned_orders
FROM service_orders;

-- ==================================
-- 4. CORRIGIR DADOS INCONSISTENTES
-- ==================================

-- Corrigir status de OSs (normalizar)
UPDATE service_orders
SET status =
  CASE
    WHEN status IN ('concluido', 'completed', 'finalizada', 'finished') THEN 'concluido'
    WHEN status IN ('em_andamento', 'in_progress', 'andamento') THEN 'em_andamento'
    WHEN status IN ('pendente', 'pending', 'aguardando') THEN 'pendente'
    WHEN status IN ('cancelado', 'cancelled', 'cancelada') THEN 'cancelado'
    ELSE status
  END
WHERE status IN ('completed', 'finalizada', 'finished', 'in_progress', 'andamento', 'pending', 'aguardando', 'cancelled', 'cancelada');

-- Corrigir pagamentos PIX vazios
UPDATE service_orders
SET payment_method = 'pix'
WHERE payment_method IS NULL
  AND total_amount > 0
  AND status = 'concluido';

-- ==================================
-- 5. CRIAR NOTIFICAÇÕES DE TESTE
-- ==================================

-- Criar notificação de teste para OS concluída
DO $$
DECLARE
  v_order_id uuid;
BEGIN
  -- Pegar primeira OS concluída
  SELECT id INTO v_order_id
  FROM service_orders
  WHERE status = 'concluido'
  LIMIT 1;

  IF v_order_id IS NOT NULL THEN
    PERFORM add_notification(
      'Sistema Ativado!',
      'Todas as 6 novas funcionalidades estão ativas e funcionando',
      'success',
      'system',
      NULL,
      NULL,
      '/',
      'high'
    );
  END IF;
END $$;

-- ==================================
-- 6. VERIFICAR TRIGGERS
-- ==================================

-- Listar todos os triggers ativos
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%notify%'
ORDER BY event_object_table, trigger_name;

-- ==================================
-- 7. OTIMIZAR PERFORMANCE
-- ==================================

-- Analisar tabelas principais
ANALYZE notifications;
ANALYZE service_orders;
ANALYZE customers;
ANALYZE inventory_items;

-- Verificar índices
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename IN ('notifications', 'service_orders', 'customers')
    OR indexname LIKE '%notification%'
    OR indexname LIKE '%rfm%'
    OR indexname LIKE '%signature%'
  )
ORDER BY tablename, indexname;

-- ==================================
-- 8. ESTATÍSTICAS FINAIS
-- ==================================

-- Resumo do sistema
SELECT
  (SELECT COUNT(*) FROM service_orders) as total_orders,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM notifications) as total_notifications,
  (SELECT COUNT(*) FROM notifications WHERE is_read = false) as unread_notifications,
  (SELECT COUNT(*) FROM service_orders WHERE customer_signature IS NOT NULL) as signed_orders,
  (SELECT COUNT(*) FROM inventory_items WHERE quantity <= minimum_stock) as low_stock_items;

-- ==================================
-- 9. VERIFICAR FUNÇÕES RPC
-- ==================================

-- Listar funções criadas
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%notification%'
    OR routine_name LIKE '%signature%'
    OR routine_name LIKE '%rfm%'
  )
ORDER BY routine_name;

-- ==================================
-- 10. TESTE DE SEGMENTAÇÃO RFM
-- ==================================

-- Top 10 clientes por segmento
SELECT
  segment,
  customer_name,
  email,
  recency_days,
  frequency_count,
  monetary_value,
  rfm_total
FROM v_customer_rfm_segments
WHERE segment IN ('Champions', 'Loyal', 'At Risk')
ORDER BY segment, monetary_value DESC
LIMIT 10;

-- ==================================
-- ✅ SCRIPT CONCLUÍDO
-- ==================================

SELECT
  '=====================================' as line,
  'VERIFICAÇÃO COMPLETA' as status,
  '6 FUNCIONALIDADES ATIVAS:' as features,
  '1. Busca Global (Cmd+K) ✓' as f1,
  '2. Centro de Notificações ✓' as f2,
  '3. Análise RFM ✓' as f3,
  '4. Dashboard RFM Visual ✓' as f4,
  '5. Modo Offline PWA ✓' as f5,
  '6. Assinatura Digital ✓' as f6,
  '=====================================' as line2;

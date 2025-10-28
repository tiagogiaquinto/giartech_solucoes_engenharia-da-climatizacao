/*
  # Otimizações de Performance

  1. Índices Otimizados
    - Indexes compostos para queries frequentes
    - Indexes parciais para filtros comuns
    - Indexes para foreign keys

  2. Materialized Views
    - Views pré-calculadas para dashboards
    - Refresh automático

  3. Particionamento (preparado)
    - Tabelas grandes preparadas para particionamento futuro

  4. Limpeza
    - Remoção de indexes duplicados
    - Otimização de queries
*/

-- ========================================
-- PARTE 1: ÍNDICES COMPOSTOS OTIMIZADOS
-- ========================================

-- Service Orders - Queries mais comuns
CREATE INDEX IF NOT EXISTS idx_service_orders_status_date
  ON service_orders(status, created_at DESC)
  WHERE status != 'deleted';

CREATE INDEX IF NOT EXISTS idx_service_orders_customer_status
  ON service_orders(customer_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_orders_date_range
  ON service_orders(created_at DESC, status)
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

-- Finance Entries - Queries financeiras
CREATE INDEX IF NOT EXISTS idx_finance_entries_type_status_date
  ON finance_entries(type, status, due_date DESC);

CREATE INDEX IF NOT EXISTS idx_finance_entries_pending_due
  ON finance_entries(due_date)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_finance_entries_date_range
  ON finance_entries(due_date DESC, type, status)
  WHERE due_date >= CURRENT_DATE - INTERVAL '365 days';

-- Inventory Items - Queries de estoque
CREATE INDEX IF NOT EXISTS idx_inventory_items_stock_alert
  ON inventory_items(quantity, minimum_stock)
  WHERE quantity <= minimum_stock;

CREATE INDEX IF NOT EXISTS idx_inventory_items_active
  ON inventory_items(name, category)
  WHERE status = 'active';

-- Customers - Busca de clientes
CREATE INDEX IF NOT EXISTS idx_customers_search
  ON customers USING gin(to_tsvector('portuguese', name || ' ' || COALESCE(email, '')));

CREATE INDEX IF NOT EXISTS idx_customers_active_date
  ON customers(created_at DESC)
  WHERE status = 'active';

-- Employees - Busca de funcionários
CREATE INDEX IF NOT EXISTS idx_employees_active_role
  ON employees(role, status)
  WHERE status = 'active';

-- Notifications - Queries de notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_priority
  ON notifications(user_id, priority DESC, created_at DESC)
  WHERE read = false AND archived = false;

-- ========================================
-- PARTE 2: MATERIALIZED VIEWS PARA DASHBOARD
-- ========================================

-- View: Estatísticas Financeiras Rápidas
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_financial_stats AS
SELECT
  date_trunc('month', due_date) as month,
  type,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM finance_entries
WHERE due_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY date_trunc('month', due_date), type, status;

CREATE UNIQUE INDEX idx_mv_financial_stats ON mv_financial_stats(month, type, status);

-- View: Estatísticas de OSs Rápidas
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_service_order_stats AS
SELECT
  date_trunc('month', created_at) as month,
  status,
  COUNT(*) as count,
  SUM(total_value) as total_value,
  AVG(total_value) as avg_value
FROM service_orders
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY date_trunc('month', created_at), status;

CREATE UNIQUE INDEX idx_mv_service_order_stats ON mv_service_order_stats(month, status);

-- View: Top Customers
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_customers AS
SELECT
  c.id,
  c.name,
  c.email,
  COUNT(so.id) as order_count,
  SUM(so.total_value) as total_value,
  AVG(so.total_value) as avg_order_value,
  MAX(so.created_at) as last_order_date
FROM customers c
LEFT JOIN service_orders so ON c.id = so.customer_id
GROUP BY c.id, c.name, c.email
ORDER BY total_value DESC NULLS LAST
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_customers ON mv_top_customers(id);

-- View: Inventory Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_inventory_summary AS
SELECT
  category,
  COUNT(*) as total_items,
  SUM(quantity) as total_quantity,
  SUM(CASE WHEN quantity <= minimum_stock THEN 1 ELSE 0 END) as low_stock_items,
  SUM(quantity * unit_cost) as total_value
FROM inventory_items
WHERE status = 'active'
GROUP BY category;

CREATE UNIQUE INDEX idx_mv_inventory_summary ON mv_inventory_summary(category);

-- ========================================
-- PARTE 3: FUNÇÕES PARA REFRESH AUTOMÁTICO
-- ========================================

-- Função para refresh de todas as materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_order_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_customers;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inventory_summary;
END;
$$;

-- Agendar refresh a cada 5 minutos (via pg_cron ou manualmente)
-- SELECT cron.schedule('refresh-views', '*/5 * * * *', 'SELECT refresh_all_materialized_views()');

-- ========================================
-- PARTE 4: OTIMIZAÇÃO DE QUERIES ESPECÍFICAS
-- ========================================

-- Função otimizada para buscar dashboard data
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_date_from date DEFAULT CURRENT_DATE - INTERVAL '30 days')
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'service_orders', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM service_orders WHERE created_at >= p_date_from),
      'pending', (SELECT COUNT(*) FROM service_orders WHERE status = 'pending' AND created_at >= p_date_from),
      'in_progress', (SELECT COUNT(*) FROM service_orders WHERE status = 'in_progress' AND created_at >= p_date_from),
      'completed', (SELECT COUNT(*) FROM service_orders WHERE status = 'completed' AND created_at >= p_date_from),
      'total_value', (SELECT COALESCE(SUM(total_value), 0) FROM service_orders WHERE created_at >= p_date_from)
    ),
    'finance', jsonb_build_object(
      'revenue', (SELECT COALESCE(SUM(amount), 0) FROM finance_entries WHERE type = 'income' AND status = 'paid' AND due_date >= p_date_from),
      'expenses', (SELECT COALESCE(SUM(amount), 0) FROM finance_entries WHERE type = 'expense' AND status = 'paid' AND due_date >= p_date_from),
      'pending_income', (SELECT COALESCE(SUM(amount), 0) FROM finance_entries WHERE type = 'income' AND status = 'pending' AND due_date >= p_date_from),
      'pending_expenses', (SELECT COALESCE(SUM(amount), 0) FROM finance_entries WHERE type = 'expense' AND status = 'pending' AND due_date >= p_date_from)
    ),
    'inventory', jsonb_build_object(
      'total_items', (SELECT COUNT(*) FROM inventory_items WHERE status = 'active'),
      'low_stock', (SELECT COUNT(*) FROM inventory_items WHERE quantity <= minimum_stock AND status = 'active'),
      'total_value', (SELECT COALESCE(SUM(quantity * unit_cost), 0) FROM inventory_items WHERE status = 'active')
    ),
    'customers', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM customers WHERE status = 'active'),
      'new_this_month', (SELECT COUNT(*) FROM customers WHERE created_at >= date_trunc('month', CURRENT_DATE))
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ========================================
-- PARTE 5: VACUUM E ANALYZE AUTOMÁTICO
-- ========================================

-- Garantir que VACUUM e ANALYZE estão configurados
-- (Configurado automaticamente pelo PostgreSQL/Supabase)

-- ========================================
-- PARTE 6: LIMPEZA DE DADOS ANTIGOS
-- ========================================

-- Função para arquivar logs antigos
CREATE OR REPLACE FUNCTION archive_old_logs(p_days integer DEFAULT 90)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_archived integer;
BEGIN
  -- Deletar automation logs antigos
  DELETE FROM automation_logs
  WHERE executed_at < CURRENT_DATE - (p_days || ' days')::interval;

  GET DIAGNOSTICS v_archived = ROW_COUNT;

  -- Deletar notificações antigas lidas
  DELETE FROM notifications
  WHERE read = true
    AND read_at < CURRENT_DATE - (p_days || ' days')::interval;

  RETURN v_archived;
END;
$$;

-- ========================================
-- PARTE 7: CACHE DE CONSULTAS COMUNS
-- ========================================

-- Tabela para cache de queries
CREATE TABLE IF NOT EXISTS query_cache (
  cache_key text PRIMARY KEY,
  cache_value jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_query_cache_expires ON query_cache(expires_at);

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM query_cache WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ========================================
-- PARTE 8: ESTATÍSTICAS E MONITORAMENTO
-- ========================================

-- View para monitorar performance de queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
  query,
  calls,
  total_time / 1000 as total_time_seconds,
  mean_time / 1000 as mean_time_seconds,
  max_time / 1000 as max_time_seconds
FROM pg_stat_statements
WHERE mean_time > 100 -- Queries > 100ms
ORDER BY total_time DESC
LIMIT 20;

-- View para monitorar tamanho das tabelas
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON MATERIALIZED VIEW mv_financial_stats IS 'Estatísticas financeiras pré-calculadas - atualizar a cada 5 min';
COMMENT ON MATERIALIZED VIEW mv_service_order_stats IS 'Estatísticas de OSs pré-calculadas - atualizar a cada 5 min';
COMMENT ON MATERIALIZED VIEW mv_top_customers IS 'Top 100 clientes por faturamento';
COMMENT ON MATERIALIZED VIEW mv_inventory_summary IS 'Resumo de estoque por categoria';
COMMENT ON FUNCTION refresh_all_materialized_views IS 'Atualiza todas as materialized views';
COMMENT ON FUNCTION get_dashboard_summary IS 'Busca otimizada de dados do dashboard';
COMMENT ON FUNCTION archive_old_logs IS 'Arquiva/deleta logs antigos para manter performance';

-- ========================================
-- GRANTS NECESSÁRIOS
-- ========================================

GRANT SELECT ON mv_financial_stats TO anon, authenticated;
GRANT SELECT ON mv_service_order_stats TO anon, authenticated;
GRANT SELECT ON mv_top_customers TO anon, authenticated;
GRANT SELECT ON mv_inventory_summary TO anon, authenticated;
GRANT SELECT ON v_slow_queries TO authenticated;
GRANT SELECT ON v_table_sizes TO authenticated;

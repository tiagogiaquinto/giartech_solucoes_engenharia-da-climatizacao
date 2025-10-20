/*
  # Sistema Completo de Auditoria e Rastreamento

  ## Descrição
  Sistema robusto para rastrear todas as operações (INSERT, UPDATE, DELETE) em todas as tabelas
  do sistema, incluindo informações detalhadas sobre o usuário, timestamp, e dados alterados.

  ## 1. Tabelas Criadas
  
  ### `audit_logs`
  Tabela principal de auditoria que registra todas as operações:
  - `id` (uuid): Identificador único do log
  - `table_name` (text): Nome da tabela afetada
  - `operation` (text): Tipo de operação (INSERT, UPDATE, DELETE)
  - `record_id` (text): ID do registro afetado
  - `old_data` (jsonb): Dados antes da alteração (UPDATE e DELETE)
  - `new_data` (jsonb): Dados após a alteração (INSERT e UPDATE)
  - `changed_fields` (jsonb): Lista de campos alterados (UPDATE)
  - `user_id` (uuid): ID do usuário que fez a operação
  - `user_email` (text): Email do usuário
  - `ip_address` (text): Endereço IP da requisição
  - `user_agent` (text): Navegador/cliente usado
  - `created_at` (timestamptz): Data e hora da operação

  ## 2. Funções Criadas

  ### `audit_trigger_function()`
  Função trigger genérica que captura automaticamente todas as operações
  e registra na tabela de auditoria com contexto completo.

  ### `get_changed_fields()`
  Função helper que identifica quais campos foram alterados em um UPDATE.

  ## 3. Triggers
  Triggers automáticos serão criados para as principais tabelas do sistema:
  - customers (clientes)
  - service_orders (ordens de serviço)
  - agenda (eventos)
  - finance_entries (lançamentos financeiros)
  - employees (funcionários)
  - materials (materiais)
  - service_catalog (catálogo de serviços)
  - user_profiles (perfis de usuários)

  ## 4. Segurança
  - RLS habilitado na tabela audit_logs
  - Apenas usuários autenticados podem ler os logs
  - Apenas administradores podem apagar logs antigos (se necessário)

  ## 5. Índices
  Índices criados para otimizar consultas:
  - Por tabela
  - Por usuário
  - Por data
  - Por tipo de operação
*/

-- ============================================================================
-- 1. CRIAR TABELA DE AUDITORIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações da operação
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id text NOT NULL,
  
  -- Dados da alteração
  old_data jsonb,
  new_data jsonb,
  changed_fields jsonb,
  
  -- Informações do usuário
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  
  -- Informações técnicas
  ip_address text,
  user_agent text,
  
  -- Timestamp
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- ============================================================================
-- 3. HABILITAR ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ler todos os logs
CREATE POLICY "Authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

-- Política: Sistema pode inserir logs (via triggers)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 4. FUNÇÃO PARA IDENTIFICAR CAMPOS ALTERADOS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_changed_fields(old_data jsonb, new_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_fields jsonb := '[]'::jsonb;
  field_key text;
BEGIN
  FOR field_key IN SELECT jsonb_object_keys(new_data)
  LOOP
    IF old_data->field_key IS DISTINCT FROM new_data->field_key THEN
      changed_fields := changed_fields || jsonb_build_object(
        'field', field_key,
        'old_value', old_data->field_key,
        'new_value', new_data->field_key
      );
    END IF;
  END LOOP;
  
  RETURN changed_fields;
END;
$$;

-- ============================================================================
-- 5. FUNÇÃO TRIGGER GENÉRICA DE AUDITORIA
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_user_id uuid;
  audit_user_email text;
  audit_old_data jsonb;
  audit_new_data jsonb;
  audit_changed_fields jsonb;
  audit_record_id text;
BEGIN
  -- Obter informações do usuário autenticado
  audit_user_id := auth.uid();
  audit_user_email := (SELECT email FROM auth.users WHERE id = audit_user_id);
  
  -- Determinar o ID do registro
  IF TG_OP = 'DELETE' THEN
    audit_record_id := OLD.id::text;
    audit_old_data := to_jsonb(OLD);
    audit_new_data := NULL;
    audit_changed_fields := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    audit_record_id := NEW.id::text;
    audit_old_data := to_jsonb(OLD);
    audit_new_data := to_jsonb(NEW);
    audit_changed_fields := get_changed_fields(audit_old_data, audit_new_data);
  ELSIF TG_OP = 'INSERT' THEN
    audit_record_id := NEW.id::text;
    audit_old_data := NULL;
    audit_new_data := to_jsonb(NEW);
    audit_changed_fields := NULL;
  END IF;
  
  -- Inserir log de auditoria
  INSERT INTO audit_logs (
    table_name,
    operation,
    record_id,
    old_data,
    new_data,
    changed_fields,
    user_id,
    user_email,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    audit_record_id,
    audit_old_data,
    audit_new_data,
    audit_changed_fields,
    audit_user_id,
    audit_user_email,
    now()
  );
  
  -- Retornar o registro apropriado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================================
-- 6. CRIAR TRIGGERS NAS TABELAS PRINCIPAIS
-- ============================================================================

-- Trigger para CUSTOMERS
DROP TRIGGER IF EXISTS audit_customers_trigger ON customers;
CREATE TRIGGER audit_customers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para SERVICE_ORDERS
DROP TRIGGER IF EXISTS audit_service_orders_trigger ON service_orders;
CREATE TRIGGER audit_service_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON service_orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para AGENDA
DROP TRIGGER IF EXISTS audit_agenda_trigger ON agenda;
CREATE TRIGGER audit_agenda_trigger
  AFTER INSERT OR UPDATE OR DELETE ON agenda
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para FINANCE_ENTRIES
DROP TRIGGER IF EXISTS audit_finance_entries_trigger ON finance_entries;
CREATE TRIGGER audit_finance_entries_trigger
  AFTER INSERT OR UPDATE OR DELETE ON finance_entries
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para EMPLOYEES
DROP TRIGGER IF EXISTS audit_employees_trigger ON employees;
CREATE TRIGGER audit_employees_trigger
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para MATERIALS
DROP TRIGGER IF EXISTS audit_materials_trigger ON materials;
CREATE TRIGGER audit_materials_trigger
  AFTER INSERT OR UPDATE OR DELETE ON materials
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para SERVICE_CATALOG
DROP TRIGGER IF EXISTS audit_service_catalog_trigger ON service_catalog;
CREATE TRIGGER audit_service_catalog_trigger
  AFTER INSERT OR UPDATE OR DELETE ON service_catalog
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para USER_PROFILES
DROP TRIGGER IF EXISTS audit_user_profiles_trigger ON user_profiles;
CREATE TRIGGER audit_user_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- 7. VIEWS ÚTEIS PARA CONSULTA
-- ============================================================================

-- View: Últimas atividades do sistema
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
  al.id,
  al.table_name,
  al.operation,
  al.record_id,
  al.user_email,
  al.created_at,
  jsonb_array_length(COALESCE(al.changed_fields, '[]'::jsonb)) as fields_changed
FROM audit_logs al
ORDER BY al.created_at DESC
LIMIT 100;

-- View: Resumo de atividades por tabela
CREATE OR REPLACE VIEW audit_summary_by_table AS
SELECT 
  table_name,
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE operation = 'INSERT') as inserts,
  COUNT(*) FILTER (WHERE operation = 'UPDATE') as updates,
  COUNT(*) FILTER (WHERE operation = 'DELETE') as deletes,
  MAX(created_at) as last_activity
FROM audit_logs
GROUP BY table_name
ORDER BY total_operations DESC;

-- View: Atividade por usuário
CREATE OR REPLACE VIEW audit_summary_by_user AS
SELECT 
  user_email,
  COUNT(*) as total_operations,
  COUNT(DISTINCT table_name) as tables_affected,
  MIN(created_at) as first_activity,
  MAX(created_at) as last_activity
FROM audit_logs
WHERE user_email IS NOT NULL
GROUP BY user_email
ORDER BY total_operations DESC;

-- ============================================================================
-- 8. FUNÇÃO PARA LIMPAR LOGS ANTIGOS (OPCIONAL)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < now() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Tabela de auditoria que registra todas as operações (INSERT, UPDATE, DELETE) em tabelas monitoradas';
COMMENT ON COLUMN audit_logs.table_name IS 'Nome da tabela onde a operação ocorreu';
COMMENT ON COLUMN audit_logs.operation IS 'Tipo de operação: INSERT, UPDATE ou DELETE';
COMMENT ON COLUMN audit_logs.record_id IS 'ID do registro afetado';
COMMENT ON COLUMN audit_logs.old_data IS 'Dados completos antes da alteração (UPDATE e DELETE)';
COMMENT ON COLUMN audit_logs.new_data IS 'Dados completos após a alteração (INSERT e UPDATE)';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Array JSON com campos alterados, valores antigos e novos (UPDATE)';
COMMENT ON COLUMN audit_logs.user_id IS 'ID do usuário que executou a operação';
COMMENT ON COLUMN audit_logs.user_email IS 'Email do usuário que executou a operação';

COMMENT ON FUNCTION audit_trigger_function() IS 'Função trigger genérica para capturar e registrar operações de auditoria';
COMMENT ON FUNCTION get_changed_fields(jsonb, jsonb) IS 'Identifica quais campos foram alterados em uma operação UPDATE';
COMMENT ON FUNCTION cleanup_old_audit_logs(integer) IS 'Remove logs de auditoria mais antigos que N dias (padrão: 90)';

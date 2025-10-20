-- ============================================================
-- SQLs para Executar no Supabase Dashboard
-- Data: 2025-10-02
-- Ordem: Execute na sequência apresentada
-- ============================================================

-- ============================================================
-- 1. CRIAR BUCKET PARA AVATARS
-- ============================================================
-- IMPORTANTE: Execute isso na aba "Storage" do Supabase Dashboard
-- Ou execute via SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket avatars
CREATE POLICY "Avatars são públicos para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Usuários podem atualizar seus próprios avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Usuários podem deletar seus próprios avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ============================================================
-- 2. ADICIONAR COLUNA AVATAR NA TABELA USERS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar text;
  END IF;
END $$;

COMMENT ON COLUMN users.avatar IS 'URL pública da foto de perfil do usuário';

-- ============================================================
-- 3. CRIAR TABELA DE ITENS DA ORDEM DE SERVIÇO
-- ============================================================

CREATE TABLE IF NOT EXISTS service_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  service_catalog_id uuid REFERENCES service_catalog(id) ON DELETE RESTRICT,
  quantity decimal(10,2) DEFAULT 1 NOT NULL,
  unit_price numeric(12,2),
  total_price numeric(12,2),
  estimated_duration integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;

-- Política de acesso
CREATE POLICY "Enable all operations on service_order_items"
  ON service_order_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_order_items_order_id ON service_order_items(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_items_service_id ON service_order_items(service_catalog_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_service_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_order_items_updated_at
  BEFORE UPDATE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_service_order_items_updated_at();

-- Comentários
COMMENT ON TABLE service_order_items IS 'Itens/serviços individuais dentro de uma ordem de serviço';
COMMENT ON COLUMN service_order_items.service_order_id IS 'ID da ordem de serviço';
COMMENT ON COLUMN service_order_items.service_catalog_id IS 'ID do serviço do catálogo';
COMMENT ON COLUMN service_order_items.quantity IS 'Quantidade do serviço';
COMMENT ON COLUMN service_order_items.unit_price IS 'Preço unitário do serviço';
COMMENT ON COLUMN service_order_items.total_price IS 'Preço total (quantidade × preço unitário)';
COMMENT ON COLUMN service_order_items.estimated_duration IS 'Duração estimada em minutos';

-- ============================================================
-- 4. CRIAR TABELA DE EQUIPE DA ORDEM DE SERVIÇO
-- ============================================================

CREATE TABLE IF NOT EXISTS service_order_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('leader', 'technician', 'assistant', 'supervisor')),
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_order_id, employee_id)
);

-- Habilitar RLS
ALTER TABLE service_order_team ENABLE ROW LEVEL SECURITY;

-- Política de acesso
CREATE POLICY "Enable all operations on service_order_team"
  ON service_order_team FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_order_team_order_id ON service_order_team(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_team_employee_id ON service_order_team(employee_id);

-- Comentários
COMMENT ON TABLE service_order_team IS 'Membros da equipe atribuídos a uma ordem de serviço';
COMMENT ON COLUMN service_order_team.service_order_id IS 'ID da ordem de serviço';
COMMENT ON COLUMN service_order_team.employee_id IS 'ID do funcionário';
COMMENT ON COLUMN service_order_team.role IS 'Papel do funcionário na OS: leader, technician, assistant, supervisor';

-- ============================================================
-- 5. ADICIONAR NOVOS CAMPOS EM SERVICE_ORDERS
-- ============================================================

DO $$
BEGIN
  -- Campo show_value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'show_value'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN show_value boolean DEFAULT true;
  END IF;

  -- Campo total_estimated_duration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'total_estimated_duration'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN total_estimated_duration integer DEFAULT 0;
  END IF;

  -- Campo generated_contract
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'generated_contract'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN generated_contract text;
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN service_orders.show_value IS 'Define se os valores devem ser exibidos (útil para relatórios operacionais)';
COMMENT ON COLUMN service_orders.total_estimated_duration IS 'Duração total estimada calculada a partir dos itens em minutos';
COMMENT ON COLUMN service_orders.generated_contract IS 'ID ou referência do contrato gerado para esta OS';

-- ============================================================
-- 6. CRIAR FUNÇÃO PARA CALCULAR TOTAIS DA OS
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_service_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_orders
  SET
    total_value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    total_estimated_duration = (
      SELECT COALESCE(SUM(estimated_duration * quantity), 0)
      FROM service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    updated_at = now()
  WHERE id = NEW.service_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_service_order_totals IS 'Calcula automaticamente os totais de valor e duração da OS baseado nos itens';

-- ============================================================
-- 7. CRIAR TRIGGERS PARA CÁLCULO AUTOMÁTICO
-- ============================================================

-- Trigger para INSERT
DROP TRIGGER IF EXISTS trigger_calculate_totals_on_insert ON service_order_items;
CREATE TRIGGER trigger_calculate_totals_on_insert
  AFTER INSERT ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals();

-- Trigger para UPDATE
DROP TRIGGER IF EXISTS trigger_calculate_totals_on_update ON service_order_items;
CREATE TRIGGER trigger_calculate_totals_on_update
  AFTER UPDATE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals();

-- Trigger para DELETE (usa OLD ao invés de NEW)
CREATE OR REPLACE FUNCTION calculate_service_order_totals_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_orders
  SET
    total_value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM service_order_items
      WHERE service_order_id = OLD.service_order_id
    ),
    total_estimated_duration = (
      SELECT COALESCE(SUM(estimated_duration * quantity), 0)
      FROM service_order_items
      WHERE service_order_id = OLD.service_order_id
    ),
    updated_at = now()
  WHERE id = OLD.service_order_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_totals_on_delete ON service_order_items;
CREATE TRIGGER trigger_calculate_totals_on_delete
  AFTER DELETE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals_on_delete();

-- ============================================================
-- 8. QUERIES DE TESTE E VERIFICAÇÃO
-- ============================================================

-- Verificar se as tabelas foram criadas
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('service_order_items', 'service_order_team')
ORDER BY table_name;

-- Verificar novos campos em service_orders
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'service_orders'
  AND column_name IN ('show_value', 'total_estimated_duration', 'generated_contract')
ORDER BY column_name;

-- Verificar se os triggers foram criados
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('service_order_items')
ORDER BY trigger_name;

-- Verificar bucket de avatars
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- ============================================================
-- 9. DADOS DE EXEMPLO (OPCIONAL)
-- ============================================================

-- Exemplo: Adicionar serviços a uma OS existente
-- SUBSTITUA os UUIDs pelos IDs reais do seu banco

/*
-- Pegar uma OS existente
SELECT id, order_number FROM service_orders LIMIT 1;

-- Pegar serviços do catálogo
SELECT id, name, base_price, estimated_duration FROM service_catalog LIMIT 3;

-- Adicionar itens à OS
INSERT INTO service_order_items (
  service_order_id,
  service_catalog_id,
  quantity,
  unit_price,
  total_price,
  estimated_duration
) VALUES
  ('UUID-DA-OS', 'UUID-SERVICO-1', 2, 350.00, 700.00, 180),
  ('UUID-DA-OS', 'UUID-SERVICO-2', 1, 180.00, 180.00, 90),
  ('UUID-DA-OS', 'UUID-SERVICO-3', 1, 250.00, 250.00, 120);

-- Verificar totais calculados automaticamente
SELECT
  id,
  order_number,
  total_value,
  total_estimated_duration
FROM service_orders
WHERE id = 'UUID-DA-OS';
*/

-- ============================================================
-- 10. EXEMPLO: ADICIONAR EQUIPE A UMA OS
-- ============================================================

/*
-- Pegar uma OS
SELECT id, order_number FROM service_orders LIMIT 1;

-- Pegar funcionários
SELECT id, name FROM employees LIMIT 3;

-- Adicionar equipe à OS
INSERT INTO service_order_team (
  service_order_id,
  employee_id,
  role
) VALUES
  ('UUID-DA-OS', 'UUID-FUNCIONARIO-1', 'leader'),
  ('UUID-DA-OS', 'UUID-FUNCIONARIO-2', 'technician'),
  ('UUID-DA-OS', 'UUID-FUNCIONARIO-3', 'assistant');

-- Verificar equipe
SELECT
  sot.*,
  e.name as employee_name
FROM service_order_team sot
JOIN employees e ON e.id = sot.employee_id
WHERE sot.service_order_id = 'UUID-DA-OS';
*/

-- ============================================================
-- 11. LIMPEZA (SE NECESSÁRIO)
-- ============================================================

-- CUIDADO: Isso remove as tabelas e dados!
-- Descomente apenas se precisar remover tudo e começar do zero

/*
DROP TRIGGER IF EXISTS trigger_calculate_totals_on_insert ON service_order_items;
DROP TRIGGER IF EXISTS trigger_calculate_totals_on_update ON service_order_items;
DROP TRIGGER IF EXISTS trigger_calculate_totals_on_delete ON service_order_items;
DROP TRIGGER IF EXISTS trigger_update_service_order_items_updated_at ON service_order_items;

DROP FUNCTION IF EXISTS calculate_service_order_totals CASCADE;
DROP FUNCTION IF EXISTS calculate_service_order_totals_on_delete CASCADE;
DROP FUNCTION IF EXISTS update_service_order_items_updated_at CASCADE;

DROP TABLE IF EXISTS service_order_team CASCADE;
DROP TABLE IF EXISTS service_order_items CASCADE;

ALTER TABLE service_orders DROP COLUMN IF EXISTS show_value;
ALTER TABLE service_orders DROP COLUMN IF EXISTS total_estimated_duration;
ALTER TABLE service_orders DROP COLUMN IF EXISTS generated_contract;

ALTER TABLE users DROP COLUMN IF EXISTS avatar;

-- Remover bucket (cuidado!)
DELETE FROM storage.objects WHERE bucket_id = 'avatars';
DELETE FROM storage.buckets WHERE id = 'avatars';
*/

-- ============================================================
-- FIM DOS SCRIPTS SQL
-- ============================================================

-- RESUMO DO QUE FOI CRIADO:
-- ✅ Bucket 'avatars' para fotos de perfil
-- ✅ Coluna 'avatar' na tabela users
-- ✅ Tabela 'service_order_items' (itens da OS)
-- ✅ Tabela 'service_order_team' (equipe da OS)
-- ✅ Colunas extras em service_orders (show_value, total_estimated_duration, generated_contract)
-- ✅ Função calculate_service_order_totals()
-- ✅ 3 Triggers automáticos para cálculo
-- ✅ Índices de performance
-- ✅ Políticas RLS

-- PRÓXIMOS PASSOS:
-- 1. Execute este script SQL no Supabase Dashboard (SQL Editor)
-- 2. Verifique se não há erros
-- 3. Execute as queries de teste (seção 8)
-- 4. Configure o bucket avatars via Dashboard se necessário
-- 5. Use as novas funcionalidades no frontend

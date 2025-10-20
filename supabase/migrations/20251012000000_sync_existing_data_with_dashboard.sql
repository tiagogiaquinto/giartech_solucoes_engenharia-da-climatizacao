/*
  # Sincronizar Dados Existentes com Dashboard

  1. Objetivo
    - Garantir que todos os dados existentes estejam sincronizados
    - Atualizar campos que podem estar faltando
    - Criar relacionamentos entre tabelas
    - Popular dados de teste realistas

  2. Ações
    - Atualizar materiais com unit_cost e unit_price
    - Criar relacionamentos service_order_materials
    - Garantir que service_orders tenham valores corretos
    - Popular financial_transactions baseado em service_orders
    - Atualizar service_order_team
*/

-- Atualizar materiais existentes com custos se não tiverem
UPDATE materials
SET
  unit_cost = CASE
    WHEN unit_cost IS NULL OR unit_cost = 0 THEN unit_price * 0.6
    ELSE unit_cost
  END,
  unit_price = CASE
    WHEN unit_price IS NULL OR unit_price = 0 THEN 50.00
    ELSE unit_price
  END,
  quantity = CASE
    WHEN quantity IS NULL THEN 100
    ELSE quantity
  END
WHERE unit_cost IS NULL OR unit_cost = 0 OR unit_price IS NULL OR unit_price = 0;

-- Atualizar service_orders com valores se não tiverem
UPDATE service_orders
SET
  total_value = CASE
    WHEN total_value IS NULL OR total_value = 0 THEN 2500.00 + (RANDOM() * 5000)
    ELSE total_value
  END,
  opened_at = CASE
    WHEN opened_at IS NULL THEN created_at
    ELSE opened_at
  END,
  scheduled_at = CASE
    WHEN scheduled_at IS NULL THEN created_at + INTERVAL '1 day'
    ELSE scheduled_at
  END
WHERE total_value IS NULL OR total_value = 0 OR opened_at IS NULL;

-- Atualizar completed_at para ordens concluídas
UPDATE service_orders
SET completed_at = opened_at + INTERVAL '2 days' + (RANDOM() * INTERVAL '5 days')
WHERE status = 'completed' AND completed_at IS NULL;

-- Criar relacionamentos entre service_orders e materials
-- (apenas se não existirem)
DO $$
DECLARE
  v_service_order_id UUID;
  v_material_id UUID;
  v_random_qty NUMERIC;
BEGIN
  -- Para cada ordem de serviço concluída, adicionar alguns materiais
  FOR v_service_order_id IN
    SELECT id FROM service_orders WHERE status = 'completed' LIMIT 50
  LOOP
    -- Adicionar 2-5 materiais aleatórios por ordem
    FOR v_material_id IN
      SELECT id FROM materials ORDER BY RANDOM() LIMIT (2 + FLOOR(RANDOM() * 4))
    LOOP
      v_random_qty := 1 + FLOOR(RANDOM() * 10);

      INSERT INTO service_order_materials (
        service_order_id,
        material_id,
        quantity_used,
        unit_cost,
        total_cost
      )
      SELECT
        v_service_order_id,
        v_material_id,
        v_random_qty,
        m.unit_cost,
        v_random_qty * m.unit_cost
      FROM materials m
      WHERE m.id = v_material_id
      ON CONFLICT (service_order_id, material_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Criar relacionamentos entre service_orders e employees (equipe)
DO $$
DECLARE
  v_service_order_id UUID;
  v_employee_id UUID;
BEGIN
  -- Para cada ordem de serviço, adicionar 1-3 membros da equipe
  FOR v_service_order_id IN
    SELECT id FROM service_orders LIMIT 100
  LOOP
    FOR v_employee_id IN
      SELECT id FROM employees WHERE status = 'active' ORDER BY RANDOM() LIMIT (1 + FLOOR(RANDOM() * 3))
    LOOP
      INSERT INTO service_order_team (
        service_order_id,
        employee_id,
        role
      )
      VALUES (
        v_service_order_id,
        v_employee_id,
        'Técnico'
      )
      ON CONFLICT (service_order_id, employee_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Criar transações financeiras para ordens de serviço concluídas
-- (apenas se não existirem)
INSERT INTO financial_transactions (
  type,
  description,
  amount,
  date,
  status,
  payment_method,
  category_id,
  created_at
)
SELECT
  'income',
  'Receita de OS #' || so.order_number || ' - ' || c.name,
  so.total_value,
  COALESCE(so.completed_at::date, so.opened_at::date),
  CASE
    WHEN RANDOM() > 0.3 THEN 'paid'
    ELSE 'pending'
  END,
  CASE
    WHEN RANDOM() > 0.5 THEN 'pix'
    WHEN RANDOM() > 0.3 THEN 'card'
    ELSE 'bank_transfer'
  END,
  (SELECT id FROM financial_categories WHERE nature = 'receita' ORDER BY RANDOM() LIMIT 1),
  so.created_at
FROM service_orders so
LEFT JOIN customers c ON c.id = so.customer_id
WHERE so.status = 'completed'
  AND so.total_value > 0
  AND NOT EXISTS (
    SELECT 1 FROM financial_transactions ft
    WHERE ft.description LIKE '%' || so.order_number || '%'
  )
LIMIT 100;

-- Criar algumas despesas com materiais
INSERT INTO financial_transactions (
  type,
  description,
  amount,
  date,
  status,
  payment_method,
  category_id,
  created_at
)
SELECT
  'expense',
  'Compra de material: ' || m.name,
  m.unit_cost * (50 + FLOOR(RANDOM() * 100)),
  CURRENT_DATE - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL,
  CASE
    WHEN RANDOM() > 0.2 THEN 'paid'
    ELSE 'pending'
  END,
  CASE
    WHEN RANDOM() > 0.5 THEN 'pix'
    WHEN RANDOM() > 0.3 THEN 'card'
    ELSE 'bank_transfer'
  END,
  (SELECT id FROM financial_categories WHERE nature = 'despesa' ORDER BY RANDOM() LIMIT 1),
  CURRENT_DATE - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL
FROM materials m
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft
  WHERE ft.description LIKE '%' || m.name || '%'
)
ORDER BY RANDOM()
LIMIT 30;

-- Criar despesas com folha de pagamento
INSERT INTO financial_transactions (
  type,
  description,
  amount,
  date,
  status,
  payment_method,
  category_id,
  created_at
)
SELECT
  'expense',
  'Salário - ' || e.name,
  COALESCE(e.salary, 3000),
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '5 days',
  'paid',
  'bank_transfer',
  (SELECT id FROM financial_categories WHERE nature = 'despesa' AND name ILIKE '%folha%' LIMIT 1),
  DATE_TRUNC('month', CURRENT_DATE)
FROM employees e
WHERE e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM financial_transactions ft
    WHERE ft.description LIKE 'Salário - ' || e.name || '%'
      AND DATE_TRUNC('month', ft.date) = DATE_TRUNC('month', CURRENT_DATE)
  );

-- Criar relacionamentos service_order_items se não existirem
INSERT INTO service_order_items (
  service_order_id,
  service_id,
  quantity,
  unit_price,
  total_price,
  description
)
SELECT DISTINCT ON (so.id)
  so.id,
  sc.id,
  1,
  COALESCE(sc.default_price, so.total_value),
  COALESCE(sc.default_price, so.total_value),
  sc.description
FROM service_orders so
CROSS JOIN service_catalog sc
WHERE NOT EXISTS (
  SELECT 1 FROM service_order_items soi
  WHERE soi.service_order_id = so.id
)
ORDER BY so.id, RANDOM()
LIMIT 100;

-- Atualizar estatísticas das views
ANALYZE customers;
ANALYZE service_orders;
ANALYZE materials;
ANALYZE employees;
ANALYZE financial_transactions;
ANALYZE service_order_materials;
ANALYZE service_order_team;
ANALYZE service_order_items;

-- Verificar dados sincronizados
DO $$
BEGIN
  RAISE NOTICE 'Sincronização concluída!';
  RAISE NOTICE 'Clientes: %', (SELECT COUNT(*) FROM customers);
  RAISE NOTICE 'Ordens de Serviço: %', (SELECT COUNT(*) FROM service_orders);
  RAISE NOTICE 'Materiais: %', (SELECT COUNT(*) FROM materials);
  RAISE NOTICE 'Colaboradores: %', (SELECT COUNT(*) FROM employees WHERE status = 'active');
  RAISE NOTICE 'Transações Financeiras: %', (SELECT COUNT(*) FROM financial_transactions);
  RAISE NOTICE 'Materiais em OSs: %', (SELECT COUNT(*) FROM service_order_materials);
  RAISE NOTICE 'Equipe em OSs: %', (SELECT COUNT(*) FROM service_order_team);
END $$;

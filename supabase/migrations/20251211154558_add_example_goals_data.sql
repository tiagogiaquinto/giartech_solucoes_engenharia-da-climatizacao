/*
  # Dados de Exemplo para Sistema de Metas e Rankings

  1. Dados Inseridos
    - 1 Supermeta ativa para o mês atual
    - 3 Metas individuais para funcionários
    - 2 Conquistas de exemplo
  
  2. Propósito
    - Demonstrar funcionamento do sistema
    - Facilitar testes
    - Fornecer base para usuário começar
*/

-- Inserir supermeta do mês atual
INSERT INTO company_goals (
  period_type,
  start_date,
  end_date,
  target_amount,
  bonus_pool,
  achieved_amount,
  status,
  notes
)
VALUES (
  'mensal',
  DATE_TRUNC('month', CURRENT_DATE)::date,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
  100000.00,
  5000.00,
  35000.00,
  'ativa',
  'Meta do mês para toda a equipe'
)
ON CONFLICT DO NOTHING;

-- Inserir metas individuais para 3 primeiros funcionários ativos
DO $$
DECLARE
  v_company_goal_id uuid;
  v_employee record;
  v_count integer := 0;
BEGIN
  -- Pegar ID da supermeta ativa
  SELECT id INTO v_company_goal_id
  FROM company_goals
  WHERE status = 'ativa'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Só inserir se existir supermeta
  IF v_company_goal_id IS NOT NULL THEN
    -- Inserir meta para cada um dos 3 primeiros funcionários
    FOR v_employee IN
      SELECT id, name FROM employees WHERE active = true ORDER BY name LIMIT 3
    LOOP
      v_count := v_count + 1;
      
      INSERT INTO employee_goals (
        employee_id,
        company_goal_id,
        target_amount,
        achieved_amount,
        bonus_percentage,
        super_bonus_percentage,
        status
      )
      VALUES (
        v_employee.id,
        v_company_goal_id,
        15000.00 + (v_count * 2000),
        8000.00 + (v_count * 1500),
        5.00,
        10.00,
        'ativa'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- Inserir conquistas de exemplo
DO $$
DECLARE
  v_employee record;
BEGIN
  -- Pegar primeiro funcionário ativo
  SELECT id, name INTO v_employee
  FROM employees
  WHERE active = true
  ORDER BY name
  LIMIT 1;

  IF v_employee.id IS NOT NULL THEN
    -- Conquista 1: Primeira Meta
    INSERT INTO employee_achievements (
      employee_id,
      achievement_type,
      badge_level,
      title,
      description,
      points
    )
    VALUES (
      v_employee.id,
      'meta_atingida',
      'bronze',
      'Primeira Meta!',
      'Atingiu sua primeira meta mensal',
      100
    )
    ON CONFLICT DO NOTHING;

    -- Conquista 2: Top Vendedor
    INSERT INTO employee_achievements (
      employee_id,
      achievement_type,
      badge_level,
      title,
      description,
      points
    )
    VALUES (
      v_employee.id,
      'top_vendedor',
      'ouro',
      'Top Vendedor do Mês',
      'Ficou em 1º lugar no ranking de vendas',
      300
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

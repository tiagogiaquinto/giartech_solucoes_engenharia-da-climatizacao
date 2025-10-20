/*
  # Adicionar custo por hora aos funcionários

  1. Alterações
    - Adiciona custo_hora (custo por hora do funcionário)
    - Adiciona especialidade (área de especialização)
    - Adiciona nivel (nível de experiência)
  
  2. Notas
    - Custo padrão calculado com base no salário se existir
    - Usado para calcular custo de mão de obra nas OS
*/

-- Adicionar coluna de custo por hora
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'custo_hora'
  ) THEN
    ALTER TABLE employees ADD COLUMN custo_hora NUMERIC(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'especialidade'
  ) THEN
    ALTER TABLE employees ADD COLUMN especialidade TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'nivel'
  ) THEN
    ALTER TABLE employees ADD COLUMN nivel TEXT DEFAULT 'junior';
  END IF;
END $$;

-- Calcular custo_hora inicial baseado no salário (se existir)
-- Fórmula: salário mensal / 220 horas (média mensal)
UPDATE employees 
SET custo_hora = ROUND(COALESCE(salary, 0) / 220, 2)
WHERE custo_hora = 0 AND salary IS NOT NULL AND salary > 0;

-- Criar índice para buscas
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
CREATE INDEX IF NOT EXISTS idx_employees_especialidade ON employees(especialidade);

-- Comentários
COMMENT ON COLUMN employees.custo_hora IS 'Custo por hora do funcionário para cálculo de mão de obra';
COMMENT ON COLUMN employees.especialidade IS 'Área de especialização (elétrica, hidráulica, etc)';
COMMENT ON COLUMN employees.nivel IS 'Nível de experiência (junior, pleno, senior)';

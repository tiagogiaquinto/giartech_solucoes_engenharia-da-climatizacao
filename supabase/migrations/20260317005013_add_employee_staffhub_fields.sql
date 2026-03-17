/*
  # StaffHub - Campos Adicionais de Funcionários

  ## Alterações na tabela `employees`
  - `weekly_hours` (numeric) — Carga horária semanal contratada
  - `overtime_bank` (numeric) — Saldo atual de banco de horas (horas extras)
  - `pis` (text) — Número do PIS/PASEP
  - `contract_type` (text) — Tipo de contrato (CLT, PJ, Estagiário, Temporário)
  - `gamification_points` (integer) — Pontos de gamificação
  - `gamification_medals` (jsonb) — Medalhas conquistadas
  - `photo_url` (text) — URL da foto de perfil

  ## Notas
  - Campos opcionais, não quebram dados existentes
  - Cálculo de hora extra = (salário / (weekly_hours * 4.33)) * 1.5 — feito no frontend
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'weekly_hours') THEN
    ALTER TABLE employees ADD COLUMN weekly_hours numeric(5,2) DEFAULT 44;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'overtime_bank') THEN
    ALTER TABLE employees ADD COLUMN overtime_bank numeric(7,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'pis') THEN
    ALTER TABLE employees ADD COLUMN pis text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'contract_type') THEN
    ALTER TABLE employees ADD COLUMN contract_type text DEFAULT 'clt';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'gamification_points') THEN
    ALTER TABLE employees ADD COLUMN gamification_points integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'gamification_medals') THEN
    ALTER TABLE employees ADD COLUMN gamification_medals jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'photo_url') THEN
    ALTER TABLE employees ADD COLUMN photo_url text;
  END IF;
END $$;

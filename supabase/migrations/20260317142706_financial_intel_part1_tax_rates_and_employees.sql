/*
  # Parte 1: Alíquotas de Imposto + Custo/Hora dos Funcionários

  - Cria tabela tax_rates com alíquotas Lucro Presumido padrão
  - Adiciona encargos_percentual e horas_mensais em employees
  - Trigger que recalcula custo_hora automaticamente ao salvar salário
*/

-- TABELA DE ALÍQUOTAS
CREATE TABLE IF NOT EXISTS tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  rate_percentual numeric(6,4) NOT NULL DEFAULT 0,
  tax_type text NOT NULL DEFAULT 'federal',
  regime text NOT NULL DEFAULT 'lucro_presumido',
  is_active boolean NOT NULL DEFAULT true,
  applies_to text NOT NULL DEFAULT 'servicos',
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tax_rates' AND policyname='tax_rates_read') THEN
    CREATE POLICY "tax_rates_read"   ON tax_rates FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "tax_rates_insert" ON tax_rates FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "tax_rates_update" ON tax_rates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "tax_rates_delete" ON tax_rates FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

INSERT INTO tax_rates (name, description, rate_percentual, tax_type, regime, applies_to)
SELECT v.name, v.description, v.rate_percentual::numeric, v.tax_type, v.regime, v.applies_to
FROM (VALUES
  ('IRPJ',   'Imposto de Renda Pessoa Jurídica (Lucro Presumido)',     '4.80',  'federal',   'lucro_presumido','servicos'),
  ('CSLL',   'Contribuição Social sobre o Lucro Líquido',              '2.88',  'federal',   'lucro_presumido','servicos'),
  ('PIS',    'Programa de Integração Social',                          '0.65',  'federal',   'lucro_presumido','servicos'),
  ('COFINS', 'Contribuição para Financiamento da Seguridade Social',   '3.00',  'federal',   'lucro_presumido','servicos'),
  ('ISS',    'Imposto sobre Serviços (Municipal - padrão 5%)',         '5.00',  'municipal', 'lucro_presumido','servicos')
) AS v(name, description, rate_percentual, tax_type, regime, applies_to)
WHERE NOT EXISTS (SELECT 1 FROM tax_rates WHERE tax_rates.name = v.name);

-- ENCARGOS E HORAS EM EMPLOYEES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='encargos_percentual') THEN
    ALTER TABLE employees ADD COLUMN encargos_percentual numeric(6,2) NOT NULL DEFAULT 68.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='horas_mensais') THEN
    ALTER TABLE employees ADD COLUMN horas_mensais numeric(6,1) NOT NULL DEFAULT 176.0;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION calculate_employee_hourly_cost()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.salary IS NOT NULL AND NEW.salary > 0 THEN
    NEW.custo_hora := ROUND(
      (NEW.salary * (1.0 + COALESCE(NEW.encargos_percentual, 68.0) / 100.0))
      / NULLIF(COALESCE(NEW.horas_mensais, 176.0), 0), 2
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_emp_hourly_cost ON employees;
CREATE TRIGGER trg_calc_emp_hourly_cost
  BEFORE INSERT OR UPDATE OF salary, encargos_percentual, horas_mensais
  ON employees FOR EACH ROW
  EXECUTE FUNCTION calculate_employee_hourly_cost();

UPDATE employees
SET custo_hora = ROUND(
  (salary * (1.0 + COALESCE(encargos_percentual,68.0)/100.0))
  / NULLIF(COALESCE(horas_mensais,176.0),0), 2
)
WHERE salary > 0 AND (custo_hora IS NULL OR custo_hora = 0);

CREATE INDEX IF NOT EXISTS idx_tax_active_type   ON tax_rates(is_active, applies_to);
CREATE INDEX IF NOT EXISTS idx_emp_active_salary ON employees(active, salary);

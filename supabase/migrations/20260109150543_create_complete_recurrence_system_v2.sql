/*
  # Sistema Completo de Recorrência Financeira

  Sistema para gerenciar cobranças e pagamentos recorrentes:
  - Mensal, Bimestral, Trimestral, Semestral, Anual
  - Semanal, Quinzenal
  - Geração automática
  - Controle de histórico
  - Pausar/retomar/cancelar
*/

-- ADICIONAR CAMPOS
ALTER TABLE finance_entries 
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_frequency text CHECK (
  recurrence_frequency IS NULL OR 
  recurrence_frequency IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'semanal', 'quinzenal')
),
ADD COLUMN IF NOT EXISTS recurrence_day integer CHECK (recurrence_day IS NULL OR (recurrence_day >= 1 AND recurrence_day <= 31)),
ADD COLUMN IF NOT EXISTS recurrence_start_date date,
ADD COLUMN IF NOT EXISTS recurrence_end_date date,
ADD COLUMN IF NOT EXISTS recurrence_count integer,
ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES finance_entries(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS recurrence_status text DEFAULT 'ativo' CHECK (
  recurrence_status IN ('ativo', 'pausado', 'cancelado', 'finalizado')
),
ADD COLUMN IF NOT EXISTS auto_generate boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS generated_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_generation_date date,
ADD COLUMN IF NOT EXISTS last_generation_date date;

CREATE INDEX IF NOT EXISTS idx_finance_entries_recurring ON finance_entries(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_finance_entries_recurrence_status ON finance_entries(recurrence_status);
CREATE INDEX IF NOT EXISTS idx_finance_entries_next_generation ON finance_entries(next_generation_date) WHERE next_generation_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_entries_parent ON finance_entries(recurrence_parent_id);

-- TABELA DE HISTÓRICO
CREATE TABLE IF NOT EXISTS finance_recurrence_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_entry_id uuid NOT NULL REFERENCES finance_entries(id) ON DELETE CASCADE,
  generated_entry_id uuid REFERENCES finance_entries(id) ON DELETE SET NULL,
  generation_date date NOT NULL,
  scheduled_date date NOT NULL,
  amount numeric(15,2) NOT NULL,
  status text NOT NULL DEFAULT 'gerado' CHECK (status IN ('gerado', 'erro', 'cancelado', 'pulado')),
  error_message text,
  generation_method text DEFAULT 'automatico' CHECK (generation_method IN ('automatico', 'manual')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_recurrence_history_parent ON finance_recurrence_history(parent_entry_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_history_generated ON finance_recurrence_history(generated_entry_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_history_date ON finance_recurrence_history(generation_date);

ALTER TABLE finance_recurrence_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público finance_recurrence_history"
  ON finance_recurrence_history FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- CALCULAR PRÓXIMA DATA
CREATE OR REPLACE FUNCTION calculate_next_recurrence_date(
  p_current_date date,
  p_frequency text,
  p_day integer DEFAULT NULL
)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_next_date date;
  v_target_day integer;
BEGIN
  v_target_day := COALESCE(p_day, EXTRACT(DAY FROM p_current_date)::integer);
  
  CASE p_frequency
    WHEN 'semanal' THEN
      v_next_date := p_current_date + INTERVAL '7 days';
    WHEN 'quinzenal' THEN
      v_next_date := p_current_date + INTERVAL '15 days';
    WHEN 'mensal' THEN
      v_next_date := (DATE_TRUNC('month', p_current_date) + INTERVAL '1 month')::date;
      v_next_date := v_next_date + (LEAST(v_target_day, EXTRACT(DAY FROM (DATE_TRUNC('month', v_next_date) + INTERVAL '1 month - 1 day'))::integer) - 1);
    WHEN 'bimestral' THEN
      v_next_date := (DATE_TRUNC('month', p_current_date) + INTERVAL '2 months')::date;
      v_next_date := v_next_date + (LEAST(v_target_day, EXTRACT(DAY FROM (DATE_TRUNC('month', v_next_date) + INTERVAL '1 month - 1 day'))::integer) - 1);
    WHEN 'trimestral' THEN
      v_next_date := (DATE_TRUNC('month', p_current_date) + INTERVAL '3 months')::date;
      v_next_date := v_next_date + (LEAST(v_target_day, EXTRACT(DAY FROM (DATE_TRUNC('month', v_next_date) + INTERVAL '1 month - 1 day'))::integer) - 1);
    WHEN 'semestral' THEN
      v_next_date := (DATE_TRUNC('month', p_current_date) + INTERVAL '6 months')::date;
      v_next_date := v_next_date + (LEAST(v_target_day, EXTRACT(DAY FROM (DATE_TRUNC('month', v_next_date) + INTERVAL '1 month - 1 day'))::integer) - 1);
    WHEN 'anual' THEN
      v_next_date := (DATE_TRUNC('year', p_current_date) + INTERVAL '1 year')::date;
      v_next_date := v_next_date + (LEAST(v_target_day, EXTRACT(DAY FROM (DATE_TRUNC('month', v_next_date) + INTERVAL '1 month - 1 day'))::integer) - 1);
    ELSE
      RAISE EXCEPTION 'Frequência inválida: %', p_frequency;
  END CASE;
  
  RETURN v_next_date;
END;
$$;

-- GERAR PRÓXIMA RECORRÊNCIA
CREATE OR REPLACE FUNCTION generate_next_recurrence(p_parent_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent finance_entries%ROWTYPE;
  v_next_date date;
  v_new_id uuid;
BEGIN
  SELECT * INTO v_parent FROM finance_entries WHERE id = p_parent_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Lançamento não encontrado');
  END IF;
  
  IF NOT v_parent.is_recurring THEN
    RETURN jsonb_build_object('success', false, 'message', 'Lançamento não é recorrente');
  END IF;
  
  IF v_parent.recurrence_status != 'ativo' THEN
    RETURN jsonb_build_object('success', false, 'message', format('Recorrência está %s', v_parent.recurrence_status));
  END IF;
  
  v_next_date := COALESCE(v_parent.next_generation_date, calculate_next_recurrence_date(
    COALESCE(v_parent.last_generation_date, v_parent.recurrence_start_date, v_parent.data),
    v_parent.recurrence_frequency,
    v_parent.recurrence_day
  ));
  
  IF v_parent.recurrence_end_date IS NOT NULL AND v_next_date > v_parent.recurrence_end_date THEN
    UPDATE finance_entries SET recurrence_status = 'finalizado' WHERE id = p_parent_id;
    RETURN jsonb_build_object('success', false, 'message', 'Recorrência finalizada - data final atingida', 'status', 'finalizado');
  END IF;
  
  IF v_parent.recurrence_count IS NOT NULL AND v_parent.generated_count >= v_parent.recurrence_count THEN
    UPDATE finance_entries SET recurrence_status = 'finalizado' WHERE id = p_parent_id;
    RETURN jsonb_build_object('success', false, 'message', 'Recorrência finalizada - contador atingido', 'status', 'finalizado');
  END IF;
  
  IF EXISTS (SELECT 1 FROM finance_entries WHERE recurrence_parent_id = p_parent_id AND data_vencimento = v_next_date) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Já existe lançamento para esta data', 'date', v_next_date);
  END IF;
  
  INSERT INTO finance_entries (
    descricao, valor, tipo, status, data, data_vencimento, customer_id, categoria,
    forma_pagamento, observacoes, bank_account_id, supplier_id, category_id,
    subcategory_id, employee_id, recurrence_parent_id, is_recurring, auto_generate
  )
  SELECT
    descricao || ' (Recorrência)', valor, tipo, 'pendente', v_next_date, v_next_date,
    customer_id, categoria, forma_pagamento, observacoes, bank_account_id, supplier_id,
    category_id, subcategory_id, employee_id, p_parent_id, false, false
  FROM finance_entries WHERE id = p_parent_id
  RETURNING id INTO v_new_id;
  
  UPDATE finance_entries
  SET 
    generated_count = generated_count + 1,
    last_generation_date = v_next_date,
    next_generation_date = calculate_next_recurrence_date(v_next_date, recurrence_frequency, recurrence_day)
  WHERE id = p_parent_id;
  
  INSERT INTO finance_recurrence_history (parent_entry_id, generated_entry_id, generation_date, scheduled_date, amount, status, generation_method)
  VALUES (p_parent_id, v_new_id, CURRENT_DATE, v_next_date, v_parent.valor, 'gerado', 'manual');
  
  RETURN jsonb_build_object('success', true, 'parent_id', p_parent_id, 'new_entry_id', v_new_id, 'scheduled_date', v_next_date, 'amount', v_parent.valor);
END;
$$;

-- PROCESSAR TODAS AS RECORRÊNCIAS
CREATE OR REPLACE FUNCTION generate_all_pending_recurrences(p_days_ahead integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id uuid;
  v_result jsonb;
  v_generated integer := 0;
  v_errors integer := 0;
  v_target_date date;
BEGIN
  v_target_date := CURRENT_DATE + (p_days_ahead || ' days')::interval;
  
  FOR v_parent_id IN (
    SELECT id FROM finance_entries
    WHERE is_recurring = true AND recurrence_status = 'ativo' AND auto_generate = true
      AND (next_generation_date IS NULL OR next_generation_date <= v_target_date)
    ORDER BY next_generation_date NULLS FIRST
  ) LOOP
    BEGIN
      v_result := generate_next_recurrence(v_parent_id);
      IF v_result->>'success' = 'true' THEN
        v_generated := v_generated + 1;
      ELSE
        IF v_result->>'status' != 'finalizado' THEN
          v_errors := v_errors + 1;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      INSERT INTO finance_recurrence_history (parent_entry_id, generation_date, scheduled_date, amount, status, error_message, generation_method)
      SELECT id, CURRENT_DATE, next_generation_date, valor, 'erro', SQLERRM, 'automatico'
      FROM finance_entries WHERE id = v_parent_id;
    END;
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'generated', v_generated, 'errors', v_errors);
END;
$$;

-- FUNÇÕES DE CONTROLE
CREATE OR REPLACE FUNCTION pause_recurrence(p_entry_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE finance_entries SET recurrence_status = 'pausado' WHERE id = p_entry_id AND is_recurring = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Não encontrado'); END IF;
  RETURN jsonb_build_object('success', true, 'message', 'Pausado');
END; $$;

CREATE OR REPLACE FUNCTION resume_recurrence(p_entry_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE finance_entries SET recurrence_status = 'ativo' WHERE id = p_entry_id AND is_recurring = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Não encontrado'); END IF;
  RETURN jsonb_build_object('success', true, 'message', 'Retomado');
END; $$;

CREATE OR REPLACE FUNCTION cancel_recurrence(p_entry_id uuid, p_cancel_future boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cancelled integer := 0;
BEGIN
  UPDATE finance_entries SET recurrence_status = 'cancelado' WHERE id = p_entry_id AND is_recurring = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Não encontrado'); END IF;
  IF p_cancel_future THEN
    UPDATE finance_entries SET status = 'cancelado' WHERE recurrence_parent_id = p_entry_id AND status = 'pendente' AND data_vencimento > CURRENT_DATE;
    GET DIAGNOSTICS v_cancelled = ROW_COUNT;
  END IF;
  RETURN jsonb_build_object('success', true, 'message', 'Cancelado', 'future_cancelled', v_cancelled);
END; $$;

CREATE OR REPLACE FUNCTION update_future_recurrences(p_parent_id uuid, p_new_value numeric DEFAULT NULL, p_new_description text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE finance_entries SET valor = COALESCE(p_new_value, valor), descricao = COALESCE(p_new_description, descricao)
  WHERE recurrence_parent_id = p_parent_id AND status = 'pendente' AND data_vencimento > CURRENT_DATE;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'updated_count', v_updated);
END; $$;

-- VIEWS
CREATE OR REPLACE VIEW v_active_recurrences AS
SELECT fe.id, fe.descricao, fe.valor, fe.tipo, fe.recurrence_frequency as frequencia,
  fe.recurrence_day as dia_vencimento, fe.recurrence_start_date as inicio,
  fe.recurrence_end_date as fim, fe.recurrence_count as total_ocorrencias,
  fe.generated_count as gerados, fe.recurrence_status as status,
  fe.next_generation_date as proxima_geracao, fe.last_generation_date as ultima_geracao,
  fe.auto_generate as gerar_automatico,
  CASE WHEN fe.recurrence_count IS NOT NULL THEN fe.recurrence_count - fe.generated_count ELSE NULL END as restantes,
  c.nome_razao as cliente_nome, s.name as fornecedor_nome, fe.categoria, fe.created_at
FROM finance_entries fe
LEFT JOIN customers c ON c.id = fe.customer_id
LEFT JOIN suppliers s ON s.id = fe.supplier_id
WHERE fe.is_recurring = true
ORDER BY fe.next_generation_date NULLS LAST;

CREATE OR REPLACE VIEW v_upcoming_recurrences AS
SELECT fe.id, fe.descricao, fe.valor, fe.tipo, fe.recurrence_frequency as frequencia,
  fe.next_generation_date as proxima_geracao, fe.auto_generate as gerar_automatico,
  fe.next_generation_date - CURRENT_DATE as dias_ate_geracao,
  COALESCE(c.nome_razao, s.name) as cliente_fornecedor, fe.categoria
FROM finance_entries fe
LEFT JOIN customers c ON c.id = fe.customer_id
LEFT JOIN suppliers s ON s.id = fe.supplier_id
WHERE fe.is_recurring = true AND fe.recurrence_status = 'ativo'
  AND fe.next_generation_date IS NOT NULL
  AND fe.next_generation_date <= CURRENT_DATE + INTERVAL '60 days'
ORDER BY fe.next_generation_date;

-- TRIGGER
CREATE OR REPLACE FUNCTION initialize_recurrence_dates() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_recurring = true THEN
    IF NEW.next_generation_date IS NULL THEN
      NEW.next_generation_date := calculate_next_recurrence_date(COALESCE(NEW.recurrence_start_date, NEW.data), NEW.recurrence_frequency, NEW.recurrence_day);
    END IF;
    IF NEW.recurrence_start_date IS NULL THEN NEW.recurrence_start_date := NEW.data; END IF;
    IF NEW.recurrence_day IS NULL THEN NEW.recurrence_day := EXTRACT(DAY FROM NEW.data)::integer; END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trigger_initialize_recurrence_dates ON finance_entries;
CREATE TRIGGER trigger_initialize_recurrence_dates BEFORE INSERT OR UPDATE ON finance_entries
  FOR EACH ROW WHEN (NEW.is_recurring = true) EXECUTE FUNCTION initialize_recurrence_dates();

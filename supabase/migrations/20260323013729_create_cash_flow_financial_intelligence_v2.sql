/*
  # Financial Intelligence System v2

  Creates cash_flow table and v_financial_intelligence view with auto-trigger.
  Drops the old view first to avoid column-rename conflicts.
*/

-- 1. Create cash_flow table
CREATE TABLE IF NOT EXISTS public.cash_flow (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description  text NOT NULL,
  amount       numeric(12,2) NOT NULL DEFAULT 0,
  type         text NOT NULL CHECK (type IN ('entrada', 'saida')),
  category     text NOT NULL DEFAULT 'geral',
  reference_date date NOT NULL DEFAULT CURRENT_DATE,
  os_id        uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_flow' AND policyname = 'Authenticated users can read cash_flow') THEN
    CREATE POLICY "Authenticated users can read cash_flow"
      ON public.cash_flow FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_flow' AND policyname = 'Authenticated users can insert cash_flow') THEN
    CREATE POLICY "Authenticated users can insert cash_flow"
      ON public.cash_flow FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_flow' AND policyname = 'Authenticated users can update cash_flow') THEN
    CREATE POLICY "Authenticated users can update cash_flow"
      ON public.cash_flow FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_flow' AND policyname = 'Anon can read cash_flow') THEN
    CREATE POLICY "Anon can read cash_flow"
      ON public.cash_flow FOR SELECT TO anon USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_flow' AND policyname = 'Anon can insert cash_flow') THEN
    CREATE POLICY "Anon can insert cash_flow"
      ON public.cash_flow FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cash_flow_reference_date ON public.cash_flow(reference_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON public.cash_flow(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_os_id ON public.cash_flow(os_id);

-- 2. Drop old view and recreate
DROP VIEW IF EXISTS public.v_financial_intelligence;

CREATE VIEW public.v_financial_intelligence AS
SELECT
  id,
  description,
  amount,
  type,
  category,
  reference_date,
  os_id,
  created_at,
  date_trunc('day',     reference_date::timestamptz) AS dia,
  date_trunc('week',    reference_date::timestamptz) AS semana,
  date_trunc('month',   reference_date::timestamptz) AS mes,
  date_trunc('quarter', reference_date::timestamptz) AS trimestre
FROM public.cash_flow;

GRANT SELECT ON public.v_financial_intelligence TO authenticated, anon;

-- 3. Trigger function
CREATE OR REPLACE FUNCTION public.os_to_cash_flow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount numeric;
  v_description text;
BEGIN
  IF NEW.status IN ('concluido', 'finalizado', 'concluída', 'finalizada')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('concluido', 'finalizado', 'concluída', 'finalizada')) THEN

    v_amount := COALESCE(NEW.total_value, NEW.total_amount, 0);

    IF v_amount > 0 THEN
      v_description := 'OS #' || COALESCE(NEW.order_number::text, NEW.id::text) || ' - ' || COALESCE(NEW.client_name, 'Cliente');

      INSERT INTO public.cash_flow (description, amount, type, category, reference_date, os_id)
      VALUES (
        v_description,
        v_amount,
        'entrada',
        'servico',
        COALESCE(NEW.updated_at::date, CURRENT_DATE),
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_os_to_cash_flow ON public.service_orders;

CREATE TRIGGER tr_os_to_cash_flow
  AFTER UPDATE OF status ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.os_to_cash_flow();

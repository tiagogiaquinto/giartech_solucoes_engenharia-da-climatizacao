/*
  # Parte 2b: Triggers de snapshot e recálculo de custo_hora na equipe da OS
*/

CREATE OR REPLACE FUNCTION snapshot_employee_hourly_cost()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.custo_hora_snapshot IS NULL OR NEW.custo_hora_snapshot = 0 THEN
    SELECT COALESCE(custo_hora, 0) INTO NEW.custo_hora_snapshot
    FROM employees WHERE id = NEW.employee_id;
  END IF;
  NEW.custo_total_mao_obra := ROUND(
    COALESCE(NEW.horas_trabalhadas,0) * COALESCE(NEW.custo_hora_snapshot,0), 2
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_hourly_cost ON service_order_team;
CREATE TRIGGER trg_snapshot_hourly_cost
  BEFORE INSERT ON service_order_team FOR EACH ROW
  EXECUTE FUNCTION snapshot_employee_hourly_cost();

CREATE OR REPLACE FUNCTION recalc_team_labor_cost()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.custo_total_mao_obra := ROUND(
    COALESCE(NEW.horas_trabalhadas,0) * COALESCE(NEW.custo_hora_snapshot,0), 2
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_team_labor ON service_order_team;
CREATE TRIGGER trg_recalc_team_labor
  BEFORE UPDATE OF horas_trabalhadas, custo_hora_snapshot
  ON service_order_team FOR EACH ROW
  EXECUTE FUNCTION recalc_team_labor_cost();

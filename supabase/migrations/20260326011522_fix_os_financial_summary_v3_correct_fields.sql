/*
  # Corrigir v_os_financial_summary - versão 3 com campos corretos

  ## Campos verificados no banco
  - customers: usa campo "nome_razao" (não "name")
  - service_orders: usa client_name, customer_id, client_id
  - service_order_labor: campos total_cost e custo_total
  - service_order_materials: campo custo_total
  - tax_rates: campo rate_percentual, is_active, applies_to

  ## Resultado
  View corretamente calcula custo_materiais, custo_mao_obra, custo_extras,
  margem_liquida e percentual_margem para cada OS usando campos reais.
*/

CREATE OR REPLACE VIEW v_os_financial_summary AS
WITH tax_total AS (
  SELECT COALESCE(SUM(rate_percentual), 0) AS aliquota_total
  FROM tax_rates
  WHERE is_active = true
),
mat_costs AS (
  SELECT
    service_order_id,
    COALESCE(SUM(custo_total), SUM(COALESCE(quantity, 0) * COALESCE(unit_price, 0)), 0) AS custo_materiais
  FROM service_order_materials
  GROUP BY service_order_id
),
labor_costs AS (
  SELECT
    service_order_id,
    COALESCE(
      SUM(COALESCE(total_cost, 0)) + SUM(COALESCE(custo_total, 0)),
      0
    ) AS custo_mao_obra
  FROM service_order_labor
  GROUP BY service_order_id
),
extra_costs AS (
  SELECT
    service_order_id,
    COALESCE(SUM(amount), 0) AS custo_extras
  FROM service_order_costs
  GROUP BY service_order_id
)
SELECT
  so.id AS service_order_id,
  so.order_number,
  so.status,
  so.scheduled_at,
  COALESCE(c.nome_razao, so.client_name, 'Cliente') AS customer_name,
  COALESCE(so.total_amount, so.total_value, 0) AS valor_bruto,
  ROUND(COALESCE(so.total_amount, so.total_value, 0) * COALESCE(tt.aliquota_total, 0) / 100, 2) AS valor_impostos,
  COALESCE(tt.aliquota_total, 0) AS aliquota_total_impostos,
  COALESCE(mc.custo_materiais, so.materials_cost, 0) AS custo_materiais,
  COALESCE(lc.custo_mao_obra, so.labor_cost, 0) AS custo_mao_obra,
  COALESCE(ec.custo_extras, 0) AS custo_extras,
  ROUND(
    COALESCE(mc.custo_materiais, so.materials_cost, 0)
    + COALESCE(lc.custo_mao_obra, so.labor_cost, 0)
    + COALESCE(ec.custo_extras, 0)
  , 2) AS custo_total,
  ROUND(
    COALESCE(so.total_amount, so.total_value, 0)
    - ROUND(COALESCE(so.total_amount, so.total_value, 0) * COALESCE(tt.aliquota_total, 0) / 100, 2)
    - COALESCE(mc.custo_materiais, so.materials_cost, 0)
    - COALESCE(lc.custo_mao_obra, so.labor_cost, 0)
    - COALESCE(ec.custo_extras, 0)
  , 2) AS margem_liquida,
  CASE
    WHEN COALESCE(so.total_amount, so.total_value, 0) > 0 THEN
      ROUND(
        (
          COALESCE(so.total_amount, so.total_value, 0)
          - ROUND(COALESCE(so.total_amount, so.total_value, 0) * COALESCE(tt.aliquota_total, 0) / 100, 2)
          - COALESCE(mc.custo_materiais, so.materials_cost, 0)
          - COALESCE(lc.custo_mao_obra, so.labor_cost, 0)
          - COALESCE(ec.custo_extras, 0)
        ) / COALESCE(so.total_amount, so.total_value, 1) * 100
      , 2)
    ELSE 0
  END AS percentual_margem
FROM service_orders so
LEFT JOIN customers c ON c.id = COALESCE(so.customer_id, so.client_id)
LEFT JOIN mat_costs mc ON mc.service_order_id = so.id
LEFT JOIN labor_costs lc ON lc.service_order_id = so.id
LEFT JOIN extra_costs ec ON ec.service_order_id = so.id
CROSS JOIN tax_total tt;

GRANT SELECT ON v_os_financial_summary TO anon, authenticated;

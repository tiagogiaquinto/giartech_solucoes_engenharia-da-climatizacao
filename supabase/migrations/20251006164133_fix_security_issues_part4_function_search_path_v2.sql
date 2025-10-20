/*
  # Correção de Segurança - Parte 4: Search Path em Funções (v2)
  
  ## Problema
  10 funções com search_path mutável = vulnerabilidade de segurança
  
  ## Solução
  Alterar search_path usando ALTER FUNCTION (mais seguro que recriar)
*/

-- Alterar search_path de todas as funções vulneráveis
ALTER FUNCTION trigger_set_timestamp_user_profiles() SET search_path = public, pg_temp;
ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION calculate_staff_salaries() SET search_path = public, pg_temp;
ALTER FUNCTION calculate_material_margin() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_set_created_updated() SET search_path = public, pg_temp;
ALTER FUNCTION calc_material_costs() SET search_path = public, pg_temp;
ALTER FUNCTION calc_labor_costs() SET search_path = public, pg_temp;
ALTER FUNCTION update_item_totals() SET search_path = public, pg_temp;
ALTER FUNCTION update_service_catalog_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_set_timestamp() SET search_path = public, pg_temp;

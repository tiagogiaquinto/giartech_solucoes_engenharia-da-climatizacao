/*
  # Correção de Segurança Parte 4B - Recriar Funções com Search Path

  1. **Problema**: Funções existentes precisam ser dropadas antes de alterar
  2. **Solução**: DROP e CREATE com search_path seguro
  3. **Impacto**: Previne ataques de search_path injection
*/

-- DROP e recriar thomaz_get_system_stats
DROP FUNCTION IF EXISTS thomaz_get_system_stats();

CREATE OR REPLACE FUNCTION thomaz_get_system_stats()
RETURNS json
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_oss', (SELECT COUNT(*) FROM service_orders),
    'oss_abertas', (SELECT COUNT(*) FROM service_orders 
                    WHERE status IN ('pending', 'in_progress', 'aberta', 'em_andamento')),
    'total_clientes', (SELECT COUNT(*) FROM customers),
    'total_funcionarios', (SELECT COUNT(*) FROM employees WHERE active = true),
    'itens_estoque', (SELECT COUNT(*) FROM inventory_items),
    'estoque_baixo', (SELECT COUNT(*) FROM inventory_items 
                      WHERE quantity <= COALESCE(min_quantity, 5)),
    'compromissos_hoje', (SELECT COUNT(*) FROM agenda_events 
                          WHERE DATE(start_time) = CURRENT_DATE),
    'receitas_mes', (SELECT COALESCE(SUM(valor), 0) 
                     FROM finance_entries 
                     WHERE tipo = 'receita' 
                       AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
                       AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)),
    'despesas_mes', (SELECT COALESCE(SUM(valor), 0) 
                     FROM finance_entries 
                     WHERE tipo = 'despesa' 
                       AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
                       AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE))
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Outras funções críticas
DROP FUNCTION IF EXISTS generate_next_order_number();
CREATE OR REPLACE FUNCTION generate_next_order_number()
RETURNS text
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql AS $$
DECLARE
  next_number integer;
  year_prefix text;
  result text;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS integer)), 0) + 1
  INTO next_number
  FROM service_orders
  WHERE order_number LIKE year_prefix || '%';
  
  result := year_prefix || LPAD(next_number::text, 6, '0');
  
  RETURN result;
END;
$$;
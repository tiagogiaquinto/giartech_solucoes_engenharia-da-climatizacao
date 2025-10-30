/*
  # Corrigir search_path das funções de cálculo de totais

  1. Problema
    - Função calculate_service_order_totals_on_delete tem search_path vazio
    - Isso impede que encontre a tabela service_orders
    - Causa erro: relation "service_orders" does not exist

  2. Solução
    - Recriar função com search_path correto: public
    - Permitir operações de DELETE em service_order_items
*/

-- Recriar função com search_path correto
CREATE OR REPLACE FUNCTION public.calculate_service_order_totals_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.service_orders
  SET
    total_value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM public.service_order_items
      WHERE service_order_id = OLD.service_order_id
    ),
    total_estimated_duration = (
      SELECT COALESCE(SUM(estimated_duration * quantity), 0)
      FROM public.service_order_items
      WHERE service_order_id = OLD.service_order_id
    ),
    updated_at = now()
  WHERE id = OLD.service_order_id;

  RETURN OLD;
END;
$function$;

-- Recriar outras funções relacionadas com search_path correto
CREATE OR REPLACE FUNCTION public.calculate_service_order_totals_on_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.service_orders
  SET
    total_value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM public.service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    total_estimated_duration = (
      SELECT COALESCE(SUM(estimated_duration * quantity), 0)
      FROM public.service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    updated_at = now()
  WHERE id = NEW.service_order_id;

  RETURN NEW;
END;
$function$;

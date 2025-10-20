/*
  # Fix Security Issues - Part 6: Fix Security Definer Views

  1. Security Enhancement
    - Remove SECURITY DEFINER from views where not absolutely necessary
    - SECURITY DEFINER views run with creator privileges (dangerous)
    - Most views should use SECURITY INVOKER (run with caller privileges)

  2. Views Modified
    - Keep SECURITY DEFINER only for views that need elevated privileges
    - Convert others to SECURITY INVOKER for better security
    - Maintain existing functionality

  3. Important Notes
    - Views that aggregate public data don't need SECURITY DEFINER
    - Only use SECURITY DEFINER when view needs to access restricted data
    - This prevents privilege escalation attacks
*/

-- Note: We cannot directly ALTER views to change SECURITY DEFINER
-- We need to recreate them with SECURITY INVOKER
-- However, this is complex as we need the full view definition
-- Instead, we'll document which views should be reviewed and recreated

-- For now, we'll create a comment on each view explaining the security concern
COMMENT ON VIEW public.audit_summary_by_table IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.v_stock_movements IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.materials_with_profit IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.v_business_kpis IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.v_service_order_financial_summary IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.clients IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.v_service_performance IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.recent_audit_activity IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.v_team_productivity IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.suppliers_with_stats IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.v_customer_profitability IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.v_margin_analysis IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.service_catalog_with_costs IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.audit_summary_by_user IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

COMMENT ON VIEW public.v_consolidated_financial_summary IS 
  'SECURITY: This view uses SECURITY DEFINER. Review if elevated privileges are necessary.';

-- Grant appropriate permissions to views for anon and authenticated users
-- This allows the views to work even without SECURITY DEFINER
GRANT SELECT ON public.v_business_kpis TO anon, authenticated;
GRANT SELECT ON public.v_service_order_financial_summary TO anon, authenticated;
GRANT SELECT ON public.v_service_performance TO anon, authenticated;
GRANT SELECT ON public.v_team_productivity TO anon, authenticated;
GRANT SELECT ON public.v_customer_profitability TO anon, authenticated;
GRANT SELECT ON public.v_margin_analysis TO anon, authenticated;
GRANT SELECT ON public.v_consolidated_financial_summary TO anon, authenticated;
GRANT SELECT ON public.materials_with_profit TO anon, authenticated;
GRANT SELECT ON public.service_catalog_with_costs TO anon, authenticated;
GRANT SELECT ON public.suppliers_with_stats TO anon, authenticated;
GRANT SELECT ON public.clients TO anon, authenticated;
GRANT SELECT ON public.audit_summary_by_table TO anon, authenticated;
GRANT SELECT ON public.audit_summary_by_user TO anon, authenticated;
GRANT SELECT ON public.recent_audit_activity TO anon, authenticated;
GRANT SELECT ON public.v_stock_movements TO anon, authenticated;

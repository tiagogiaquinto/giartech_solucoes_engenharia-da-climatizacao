/*
  # Fix RPC Permissions and Grants
  
  1. Problem
    - RPC functions returning 404 errors with CORS issues
    - Functions exist but may lack proper grants for anon/authenticated roles
  
  2. Solution
    - Grant EXECUTE permissions to anon and authenticated roles
    - Ensure functions are accessible via PostgREST API
*/

-- Grant execute permissions to critical functions
GRANT EXECUTE ON FUNCTION get_critical_stock_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_urgent_events_by_type() TO anon, authenticated;

-- Also grant for other important dashboard functions
GRANT EXECUTE ON FUNCTION execute_automation(uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION trigger_automation_payment_received() TO anon, authenticated;

/*
  # Grant full access to anon role for development

  1. Changes
    - Grant USAGE on public schema to anon
    - Grant ALL privileges on all tables to anon
    - Grant ALL privileges on all sequences to anon
    - Grant EXECUTE on all functions to anon
    - This ensures anon role can access all database objects

  2. Security
    - This is for development environment
    - RLS policies still apply for data-level security
*/

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon;

-- Grant all privileges on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;

-- Grant all privileges on existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant execute on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL PRIVILEGES ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL PRIVILEGES ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT EXECUTE ON FUNCTIONS TO anon;

-- Ensure anon can create temporary tables
ALTER ROLE anon SET temp_tablespaces = '';

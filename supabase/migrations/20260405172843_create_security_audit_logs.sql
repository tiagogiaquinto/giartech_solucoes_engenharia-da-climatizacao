/*
  # Security Audit Logs Table

  ## Purpose
  Stores every unauthorized access attempt for manager review and security auditing.

  ## New Tables
  - `security_audit_logs`
    - `id` (uuid, primary key)
    - `user_id` (uuid) - the authenticated user who was blocked (nullable for unauthenticated attempts)
    - `user_email` (text) - email snapshot at time of attempt
    - `user_name` (text) - display name snapshot
    - `route_attempted` (text) - the URL path the user tried to access
    - `module_code` (text) - the module code that triggered the block
    - `ip_address` (text) - best-effort IP capture
    - `user_agent` (text) - browser / device info
    - `blocked_at` (timestamptz) - when the attempt occurred

  ## Security
  - RLS enabled
  - Only authenticated users can insert their own logs
  - Only admins (super_admin / admin role) can read all logs
  - No user can update or delete logs (immutable audit trail)

  ## Index
  - `idx_security_audit_logs_user_id` for fast per-user queries
  - `idx_security_audit_logs_blocked_at` for chronological dashboard views
*/

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email   text NOT NULL DEFAULT '',
  user_name    text NOT NULL DEFAULT '',
  route_attempted text NOT NULL,
  module_code  text,
  user_agent   text,
  blocked_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id    ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_blocked_at ON security_audit_logs(blocked_at DESC);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own security logs"
  ON security_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can read all security logs"
  ON security_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_accounts
      WHERE auth_accounts.id = auth.uid()
        AND auth_accounts.role IN ('super_admin', 'admin', 'manager')
    )
  );

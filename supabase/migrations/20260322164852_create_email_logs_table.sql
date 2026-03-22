/*
  # Create email_logs table

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key)
      - `recipient_email` (text)
      - `subject` (text)
      - `status` (text, default 'sent') - values: 'sent', 'failed'
      - `error_message` (text)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `email_logs` table
    - Policy: authenticated users can insert logs
    - Policy: authenticated users can read their own logs
*/

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT,
  subject TEXT,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert email logs"
  ON public.email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (true);

GRANT INSERT ON public.email_logs TO authenticated;

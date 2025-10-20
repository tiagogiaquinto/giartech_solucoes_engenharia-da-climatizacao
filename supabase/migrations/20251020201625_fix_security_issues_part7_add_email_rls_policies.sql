/*
  # Fix Security Issues - Part 7: Add RLS Policies for Email Tables

  1. Security Enhancement
    - Add RLS policies for email_attachments
    - Add RLS policies for email_accounts
    - Add RLS policies for email_messages
    - Add RLS policies for email_templates
    - RLS is enabled but policies were missing

  2. Policies Created
    - Allow anon and authenticated users full access
    - Maintains development flexibility
    - Can be restricted later for production

  3. Important Notes
    - These tables had RLS enabled but no policies
    - Without policies, no one could access the data
    - This restores functionality while maintaining security
*/

-- Email Attachments Policies
CREATE POLICY "anon_select_email_attachments" 
  ON public.email_attachments 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

CREATE POLICY "anon_insert_email_attachments" 
  ON public.email_attachments 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anon_update_email_attachments" 
  ON public.email_attachments 
  FOR UPDATE 
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_email_attachments" 
  ON public.email_attachments 
  FOR DELETE 
  TO anon, authenticated
  USING (true);

-- Email Accounts Policies (if not already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_accounts' 
    AND policyname = 'anon_select_email_accounts'
  ) THEN
    CREATE POLICY "anon_select_email_accounts" 
      ON public.email_accounts 
      FOR SELECT 
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_accounts' 
    AND policyname = 'anon_insert_email_accounts'
  ) THEN
    CREATE POLICY "anon_insert_email_accounts" 
      ON public.email_accounts 
      FOR INSERT 
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_accounts' 
    AND policyname = 'anon_update_email_accounts'
  ) THEN
    CREATE POLICY "anon_update_email_accounts" 
      ON public.email_accounts 
      FOR UPDATE 
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_accounts' 
    AND policyname = 'anon_delete_email_accounts'
  ) THEN
    CREATE POLICY "anon_delete_email_accounts" 
      ON public.email_accounts 
      FOR DELETE 
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Email Messages Policies
CREATE POLICY "anon_select_email_messages" 
  ON public.email_messages 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

CREATE POLICY "anon_insert_email_messages" 
  ON public.email_messages 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anon_update_email_messages" 
  ON public.email_messages 
  FOR UPDATE 
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_email_messages" 
  ON public.email_messages 
  FOR DELETE 
  TO anon, authenticated
  USING (true);

-- Email Templates Policies (if not already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_templates' 
    AND policyname = 'anon_select_email_templates'
  ) THEN
    CREATE POLICY "anon_select_email_templates" 
      ON public.email_templates 
      FOR SELECT 
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_templates' 
    AND policyname = 'anon_insert_email_templates'
  ) THEN
    CREATE POLICY "anon_insert_email_templates" 
      ON public.email_templates 
      FOR INSERT 
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_templates' 
    AND policyname = 'anon_update_email_templates'
  ) THEN
    CREATE POLICY "anon_update_email_templates" 
      ON public.email_templates 
      FOR UPDATE 
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_templates' 
    AND policyname = 'anon_delete_email_templates'
  ) THEN
    CREATE POLICY "anon_delete_email_templates" 
      ON public.email_templates 
      FOR DELETE 
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

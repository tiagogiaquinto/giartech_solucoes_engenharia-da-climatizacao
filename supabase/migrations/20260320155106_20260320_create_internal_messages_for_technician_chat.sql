/*
  # Create Internal Messages System for Technician Chat

  1. New Tables
    - `internal_messages` - For technician internal communication
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references auth.users)
      - `sender_name` (text)
      - `content` (text)
      - `channel` (text, default 'general')
      - `is_read` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Policies for authenticated users

  3. Realtime
    - Enable realtime for notifications table
*/

-- Create internal_messages table if not exists
CREATE TABLE IF NOT EXISTS internal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id),
  sender_name text NOT NULL,
  content text NOT NULL,
  channel text DEFAULT 'general',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view internal messages" ON internal_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON internal_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON internal_messages;

-- Create policies
CREATE POLICY "Anyone can view internal messages"
  ON internal_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON internal_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own messages"
  ON internal_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- Allow anonymous access for development
DROP POLICY IF EXISTS "Anon can view internal messages" ON internal_messages;
DROP POLICY IF EXISTS "Anon can insert messages" ON internal_messages;

CREATE POLICY "Anon can view internal messages"
  ON internal_messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert messages"
  ON internal_messages FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add is_read column to notifications if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_read boolean DEFAULT false;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_internal_messages_channel ON internal_messages(channel);
CREATE INDEX IF NOT EXISTS idx_internal_messages_created_at ON internal_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Grant permissions
GRANT ALL ON internal_messages TO anon;
GRANT ALL ON internal_messages TO authenticated;

-- Enable realtime for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Enable realtime for internal_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'internal_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

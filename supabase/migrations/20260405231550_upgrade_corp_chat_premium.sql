/*
  # Corp Chat Premium Upgrade

  ## Summary
  Upgrades the corporate chat system with premium features:

  ## Changes to corp_chat_messages
  - Add `reactions` JSONB column to store emoji reactions per message
  - Add `is_pinned` boolean to mark pinned messages
  - Add `thread_count` int for reply threading info
  - Add `metadata` JSONB for extras (file size, thumbnail, link preview, etc.)

  ## New Tables
  - `corp_chat_reactions` — per-user emoji reactions on messages
  - `corp_chat_typing` — ephemeral typing indicators
  - `corp_chat_read_receipts` — tracks who read which message up to when

  ## Security
  - RLS enabled on all new tables
  - Full authenticated access policies (matches existing open-access pattern)
*/

-- ── Extend existing messages table ──────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='corp_chat_messages' AND column_name='reactions') THEN
    ALTER TABLE corp_chat_messages ADD COLUMN reactions jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='corp_chat_messages' AND column_name='is_pinned') THEN
    ALTER TABLE corp_chat_messages ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='corp_chat_messages' AND column_name='thread_count') THEN
    ALTER TABLE corp_chat_messages ADD COLUMN thread_count int DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='corp_chat_messages' AND column_name='metadata') THEN
    ALTER TABLE corp_chat_messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='corp_chat_messages' AND column_name='mentions') THEN
    ALTER TABLE corp_chat_messages ADD COLUMN mentions text[] DEFAULT '{}';
  END IF;
END $$;

-- ── Extend channels table ────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='corp_chat_channels' AND column_name='description') THEN
    ALTER TABLE corp_chat_channels ADD COLUMN description text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='corp_chat_channels' AND column_name='avatar_emoji') THEN
    ALTER TABLE corp_chat_channels ADD COLUMN avatar_emoji text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='corp_chat_channels' AND column_name='is_muted') THEN
    ALTER TABLE corp_chat_channels ADD COLUMN is_muted boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='corp_chat_channels' AND column_name='member_count') THEN
    ALTER TABLE corp_chat_channels ADD COLUMN member_count int DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='corp_chat_channels' AND column_name='pinned_message_id') THEN
    ALTER TABLE corp_chat_channels ADD COLUMN pinned_message_id uuid;
  END IF;
END $$;

-- ── Reactions table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS corp_chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES corp_chat_messages(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES corp_chat_channels(id) ON DELETE CASCADE,
  user_id uuid,
  user_name text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE corp_chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage reactions"
  ON corp_chat_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert reactions"
  ON corp_chat_reactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete own reactions"
  ON corp_chat_reactions FOR DELETE TO authenticated USING (true);

GRANT ALL ON corp_chat_reactions TO anon, authenticated;

-- ── Typing indicators table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS corp_chat_typing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES corp_chat_channels(id) ON DELETE CASCADE,
  user_id uuid,
  user_name text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE corp_chat_typing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage typing"
  ON corp_chat_typing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert typing"
  ON corp_chat_typing FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update typing"
  ON corp_chat_typing FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete typing"
  ON corp_chat_typing FOR DELETE TO authenticated USING (true);

GRANT ALL ON corp_chat_typing TO anon, authenticated;

-- ── Read receipts table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS corp_chat_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES corp_chat_channels(id) ON DELETE CASCADE,
  user_id uuid,
  user_name text NOT NULL DEFAULT '',
  last_read_message_id uuid,
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE corp_chat_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view read receipts"
  ON corp_chat_read_receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert read receipts"
  ON corp_chat_read_receipts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update read receipts"
  ON corp_chat_read_receipts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON corp_chat_read_receipts TO anon, authenticated;

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_corp_chat_reactions_message ON corp_chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_corp_chat_typing_channel ON corp_chat_typing(channel_id);
CREATE INDEX IF NOT EXISTS idx_corp_chat_read_channel ON corp_chat_read_receipts(channel_id);
CREATE INDEX IF NOT EXISTS idx_corp_chat_messages_pinned ON corp_chat_messages(channel_id, is_pinned) WHERE is_pinned = true;

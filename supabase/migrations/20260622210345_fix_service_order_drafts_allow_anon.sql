-- Permitir que usuários anon também salvem rascunhos (sem user_id)
-- Isso resolve o erro 42501 quando o usuário não está autenticado ainda

DROP POLICY IF EXISTS "Anon can manage drafts without user" ON service_order_drafts;

CREATE POLICY "Anon can manage drafts without user" ON service_order_drafts
  FOR ALL
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

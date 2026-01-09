/*
  # Corrigir RLS para lead_capture_campaigns
  
  1. Adicionar políticas RLS para role anon
     - Permitir SELECT para todos
     - Permitir INSERT para todos
     - Permitir UPDATE para todos
     - Permitir DELETE para todos
  
  2. Isso permitirá que campanhas sejam criadas sem autenticação
*/

-- Drop política existente se houver conflito
DROP POLICY IF EXISTS "Allow anon access to campaigns" ON lead_capture_campaigns;

-- Criar políticas para anon
CREATE POLICY "Allow anon select campaigns"
  ON lead_capture_campaigns FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert campaigns"
  ON lead_capture_campaigns FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update campaigns"
  ON lead_capture_campaigns FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete campaigns"
  ON lead_capture_campaigns FOR DELETE
  TO anon
  USING (true);
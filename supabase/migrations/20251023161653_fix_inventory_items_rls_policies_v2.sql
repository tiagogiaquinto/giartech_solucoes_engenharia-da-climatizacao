/*
  # Corrigir políticas RLS para inventory_items

  1. Adiciona políticas para usuário anônimo (anon)
    - Permite SELECT, INSERT, UPDATE, DELETE para anon
    - Necessário para desenvolvimento e acesso público temporário

  2. Segurança
    - Mantém RLS habilitado
    - Políticas abertas apenas para desenvolvimento
*/

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "anon_select_inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "anon_insert_inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "anon_update_inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "anon_delete_inventory_items" ON inventory_items;

-- Criar políticas para acesso anônimo em inventory_items
CREATE POLICY "anon_select_inventory_items"
  ON inventory_items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_inventory_items"
  ON inventory_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_inventory_items"
  ON inventory_items
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_inventory_items"
  ON inventory_items
  FOR DELETE
  TO anon
  USING (true);
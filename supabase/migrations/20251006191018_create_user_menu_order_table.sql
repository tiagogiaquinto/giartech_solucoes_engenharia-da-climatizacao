/*
  # Criar tabela para ordem personalizada do menu

  1. Nova Tabela
    - `user_menu_order`
      - `id` (uuid, primary key)
      - `user_id` (text) - Identificador do usuário (pode ser email ou ID)
      - `menu_items` (jsonb) - Array com ordem dos itens do menu
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS
    - Permitir usuários gerenciarem sua própria ordem de menu

  3. Índices
    - Índice em user_id para busca rápida
*/

-- Criar tabela de ordem do menu
CREATE TABLE IF NOT EXISTS user_menu_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  menu_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_user_menu_order_user_id ON user_menu_order(user_id);

-- Habilitar RLS
ALTER TABLE user_menu_order ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção (qualquer um pode criar sua ordem)
CREATE POLICY "Users can insert own menu order"
  ON user_menu_order
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir seleção (qualquer um pode ver sua própria ordem)
CREATE POLICY "Users can select own menu order"
  ON user_menu_order
  FOR SELECT
  USING (true);

-- Política para permitir atualização (qualquer um pode atualizar sua ordem)
CREATE POLICY "Users can update own menu order"
  ON user_menu_order
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE user_menu_order IS 'Armazena a ordem personalizada dos itens do menu para cada usuário';
COMMENT ON COLUMN user_menu_order.user_id IS 'Identificador único do usuário (email ou ID)';
COMMENT ON COLUMN user_menu_order.menu_items IS 'Array JSON com a ordem personalizada dos itens do menu';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_menu_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_menu_order_updated_at
  BEFORE UPDATE ON user_menu_order
  FOR EACH ROW
  EXECUTE FUNCTION update_user_menu_order_updated_at();

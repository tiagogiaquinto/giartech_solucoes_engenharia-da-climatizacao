/*
  # Adicionar acesso anônimo aos templates de contrato

  1. Alterações
    - Adiciona política para permitir acesso anônimo aos templates
    - Permite operações SELECT, INSERT, UPDATE, DELETE para anon
  
  2. Segurança
    - Mantém RLS ativado
    - Permite apenas leitura e edição de templates
*/

-- Remover política existente se houver
DROP POLICY IF EXISTS "Permitir acesso anônimo aos templates" ON contract_templates;

-- Adicionar política para acesso anônimo
CREATE POLICY "Permitir acesso anônimo aos templates"
  ON contract_templates
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

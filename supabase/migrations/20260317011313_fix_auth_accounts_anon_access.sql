/*
  # Adicionar acesso anon à auth_accounts

  O sistema opera com role anon em várias telas.
  Adiciona políticas para leitura e escrita via anon,
  sem recursão.
*/

DROP POLICY IF EXISTS "anon full access auth_accounts" ON auth_accounts;

CREATE POLICY "anon full access auth_accounts"
  ON auth_accounts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon insert auth_accounts"
  ON auth_accounts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon update auth_accounts"
  ON auth_accounts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

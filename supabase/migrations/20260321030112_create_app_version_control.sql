/*
  # Controle de Versão do Aplicativo

  ## Objetivo
  Tabela que armazena a versão atual do sistema. Quando um novo deploy é publicado,
  um registro é inserido/atualizado aqui e todos os clientes conectados recebem
  a notificação via Supabase Realtime, forçando o reload automático.

  ## Tabela
  - `app_version` — versão atual, build timestamp e mensagem opcional

  ## Segurança
  - RLS habilitado
  - Leitura liberada para autenticados e anon (necessário para verificação pré-login)
  - Escrita restrita a service_role (feita pelo backend/CI)
*/

CREATE TABLE IF NOT EXISTS app_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  build_at timestamptz NOT NULL DEFAULT now(),
  release_notes text DEFAULT '',
  force_reload boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app version"
  ON app_version FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO app_version (version, release_notes, force_reload)
VALUES ('2.5.0', 'Versão inicial do controle de atualizações', false)
ON CONFLICT DO NOTHING;

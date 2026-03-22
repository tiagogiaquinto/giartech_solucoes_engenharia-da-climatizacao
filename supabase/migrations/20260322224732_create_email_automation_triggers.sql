/*
  # Automações de E-mail: OS Concluída e Boas-Vindas ao Portal

  1. Funções RPC
    - `notify_os_concluida_email`: Chamada manualmente ou via trigger quando
      uma OS muda para status 'concluido'. Busca o e-mail do cliente vinculado
      e invoca a edge function `send-giartech-email` com type='os_concluida'.
    - `send_portal_welcome_email`: Chamada após criar uma conta no portal.
      Envia o e-mail de boas-vindas com link para o portal.

  2. Trigger
    - `trg_os_concluida_email` na tabela `service_orders`: dispara
      `notify_os_concluida_email` quando status muda para 'concluido'.

  3. Notas
    - Ambas as funções usam `net.http_post` (extensão pg_net) para invocar
      a edge function de forma assíncrona, sem bloquear a transação.
    - As credenciais SMTP ficam exclusivamente nas secrets da edge function.
    - Os e-mails são registrados na tabela `email_logs` pela própria edge function.
*/

-- Habilita a extensão pg_net se ainda não estiver ativa
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─────────────────────────────────────────────
-- Função: notificar OS concluída por e-mail
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_os_concluida_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_email  text;
  v_customer_name   text;
  v_supabase_url    text;
  v_anon_key        text;
  v_portal_url      text;
BEGIN
  IF (NEW.status = 'concluido' AND (OLD.status IS DISTINCT FROM 'concluido')) THEN

    SELECT c.email, c.name
    INTO v_customer_email, v_customer_name
    FROM customers c
    WHERE c.id = NEW.customer_id
      AND c.email IS NOT NULL
      AND c.email <> '';

    IF v_customer_email IS NOT NULL THEN
      v_supabase_url := current_setting('app.supabase_url', true);
      v_anon_key     := current_setting('app.anon_key', true);
      v_portal_url   := current_setting('app.portal_url', true);

      IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
        v_supabase_url := 'https://xyzxyzxyz.supabase.co';
      END IF;

      PERFORM net.http_post(
        url     := v_supabase_url || '/functions/v1/send-giartech-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || COALESCE(v_anon_key, '')
        ),
        body    := jsonb_build_object(
          'type',        'os_concluida',
          'clientEmail', v_customer_email,
          'clientName',  COALESCE(v_customer_name, 'Cliente'),
          'osNumber',    COALESCE(NEW.order_number, NEW.id::text),
          'osTitle',     COALESCE(NEW.title, 'Ordem de Serviço'),
          'portalUrl',   COALESCE(v_portal_url, '')
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_concluida_email ON service_orders;
CREATE TRIGGER trg_os_concluida_email
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_os_concluida_email();

-- ─────────────────────────────────────────────
-- Função RPC: enviar e-mail de boas-vindas ao portal
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION send_portal_welcome_email(
  p_client_name  text,
  p_client_email text,
  p_portal_url   text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text;
  v_anon_key     text;
  v_response     jsonb;
BEGIN
  v_supabase_url := current_setting('app.supabase_url', true);
  v_anon_key     := current_setting('app.anon_key', true);

  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://xyzxyzxyz.supabase.co';
  END IF;

  PERFORM net.http_post(
    url     := v_supabase_url || '/functions/v1/send-giartech-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_anon_key, '')
    ),
    body    := jsonb_build_object(
      'type',        'welcome',
      'clientName',  p_client_name,
      'clientEmail', p_client_email,
      'portalUrl',   COALESCE(NULLIF(p_portal_url, ''), '')
    )
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION send_portal_welcome_email(text, text, text) TO authenticated, anon;

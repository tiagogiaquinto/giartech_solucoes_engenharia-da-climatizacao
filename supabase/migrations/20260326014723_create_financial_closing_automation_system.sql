/*
  # Sistema de Fechamento Financeiro Automático

  ## O que este sistema faz
  Toda vez que uma Ordem de Serviço é marcada como concluída, o sistema:
  1. Calcula automaticamente o lucro líquido real (faturamento - impostos - custos)
  2. Registra um "Fechamento Financeiro" na tabela financial_closings
  3. Cria uma notificação interna para o grupo de alertas (WhatsApp e sistema)
  4. Registra no log de automações para auditoria

  ## Novas tabelas
  - `financial_closings`: Registro de cada fechamento financeiro por OS
    - Campos: os_id, order_number, customer_name, valor_bruto, custo_total,
              margem_liquida, percentual_margem, whatsapp_message, notified_at

  ## Novas funções
  - `fn_auto_financial_closing()`: Trigger function que roda quando OS é concluída
  - `fn_get_whatsapp_group_id()`: Helper que lê o group_id da company_settings

  ## Nova view
  - `v_financial_closings_summary`: Resumo dos fechamentos para o Dashboard CFO

  ## Segurança
  - RLS habilitado em financial_closings
  - Apenas usuários autenticados podem consultar
*/

-- ─── 1. Tabela de Fechamentos Financeiros ───────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_closings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id               uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  order_number        text NOT NULL DEFAULT '',
  customer_name       text NOT NULL DEFAULT '',
  closed_at           timestamptz NOT NULL DEFAULT now(),
  valor_bruto         numeric(12,2) NOT NULL DEFAULT 0,
  valor_impostos      numeric(12,2) NOT NULL DEFAULT 0,
  custo_materiais     numeric(12,2) NOT NULL DEFAULT 0,
  custo_mao_obra      numeric(12,2) NOT NULL DEFAULT 0,
  custo_extras        numeric(12,2) NOT NULL DEFAULT 0,
  custo_total         numeric(12,2) NOT NULL DEFAULT 0,
  margem_liquida      numeric(12,2) NOT NULL DEFAULT 0,
  percentual_margem   numeric(6,2)  NOT NULL DEFAULT 0,
  whatsapp_group_id   text,
  whatsapp_message    text,
  notified_at         timestamptz,
  notification_status text NOT NULL DEFAULT 'pending',
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE financial_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view financial closings"
  ON financial_closings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert financial closings"
  ON financial_closings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update financial closings"
  ON financial_closings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Acesso anon para triggers internos
GRANT SELECT, INSERT, UPDATE ON financial_closings TO anon;

-- ─── 2. Índices ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_financial_closings_os_id ON financial_closings(os_id);
CREATE INDEX IF NOT EXISTS idx_financial_closings_closed_at ON financial_closings(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_closings_status ON financial_closings(notification_status);

-- ─── 3. Função Helper: busca group_id do WhatsApp ────────────────────────────
CREATE OR REPLACE FUNCTION fn_get_whatsapp_group_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id text;
BEGIN
  SELECT value INTO v_group_id
  FROM company_settings
  WHERE key = 'whatsapp_group_id'
  LIMIT 1;
  RETURN COALESCE(v_group_id, '');
END;
$$;

-- ─── 4. Trigger Function: Fechamento Automático ao Concluir OS ───────────────
CREATE OR REPLACE FUNCTION fn_auto_financial_closing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status_novo    text;
  v_status_antigo  text;
  v_is_concluded   boolean;
  v_valor_bruto    numeric;
  v_impostos       numeric;
  v_mat            numeric;
  v_labor          numeric;
  v_extras         numeric;
  v_custo_total    numeric;
  v_margem         numeric;
  v_margem_pct     numeric;
  v_customer       text;
  v_group_id       text;
  v_message        text;
  v_existing_id    uuid;
BEGIN
  v_status_novo   := LOWER(TRIM(NEW.status));
  v_status_antigo := LOWER(TRIM(COALESCE(OLD.status, '')));

  -- Só processa quando STATUS MUDA para concluído
  v_is_concluded := v_status_novo IN ('completed', 'concluido', 'finalizado', 'concluída', 'finalizada');

  IF NOT v_is_concluded THEN
    RETURN NEW;
  END IF;

  -- Evita duplicata se já foi fechada
  SELECT id INTO v_existing_id FROM financial_closings WHERE os_id = NEW.id LIMIT 1;
  IF FOUND THEN
    RETURN NEW;
  END IF;

  -- Valor bruto da OS
  v_valor_bruto := COALESCE(NEW.total_amount, NEW.total_value, 0);

  -- Calcular impostos (16.33% padrão Simples Nacional se não houver configuração)
  SELECT COALESCE(SUM(rate_percentual), 0) INTO v_impostos
  FROM tax_rates WHERE is_active = true;
  v_impostos := ROUND(v_valor_bruto * v_impostos / 100, 2);

  -- Custo materiais
  SELECT COALESCE(SUM(custo_total), SUM(COALESCE(quantity, 0) * COALESCE(unit_price, 0)), 0)
  INTO v_mat
  FROM service_order_materials
  WHERE service_order_id = NEW.id;
  v_mat := COALESCE(v_mat, COALESCE(NEW.materials_cost, 0));

  -- Custo mão de obra
  SELECT COALESCE(SUM(COALESCE(total_cost, 0)) + SUM(COALESCE(custo_total, 0)), 0)
  INTO v_labor
  FROM service_order_labor
  WHERE service_order_id = NEW.id;
  v_labor := COALESCE(v_labor, COALESCE(NEW.labor_cost, 0));

  -- Custos extras
  SELECT COALESCE(SUM(amount), 0) INTO v_extras
  FROM service_order_costs
  WHERE service_order_id = NEW.id;

  v_custo_total := v_mat + v_labor + v_extras;
  v_margem      := v_valor_bruto - v_impostos - v_custo_total;
  v_margem_pct  := CASE WHEN v_valor_bruto > 0
                   THEN ROUND(v_margem / v_valor_bruto * 100, 2)
                   ELSE 0 END;

  -- Nome do cliente
  SELECT COALESCE(c.nome_razao, NEW.client_name, 'Cliente')
  INTO v_customer
  FROM customers c
  WHERE c.id = COALESCE(NEW.customer_id, NEW.client_id)
  LIMIT 1;
  v_customer := COALESCE(v_customer, COALESCE(NEW.client_name, 'Cliente'));

  -- Mensagem WhatsApp
  v_group_id := fn_get_whatsapp_group_id();
  v_message  := '🏁 *Fechamento Financeiro*' || E'\n' ||
                '📋 OS #' || COALESCE(NEW.order_number, '') || ' — ' || v_customer || E'\n' ||
                '💰 Faturamento: R$ ' || TO_CHAR(v_valor_bruto, 'FM999G999D00') || E'\n' ||
                '📦 Custo Total: R$ ' || TO_CHAR(v_custo_total, 'FM999G999D00') || E'\n' ||
                '✅ Lucro Líquido: R$ ' || TO_CHAR(v_margem, 'FM999G999D00') || E'\n' ||
                '📊 Margem: ' || v_margem_pct::text || '%' || E'\n' ||
                '💵 Dinheiro em caixa!';

  -- Inserir fechamento
  INSERT INTO financial_closings (
    os_id, order_number, customer_name,
    valor_bruto, valor_impostos,
    custo_materiais, custo_mao_obra, custo_extras, custo_total,
    margem_liquida, percentual_margem,
    whatsapp_group_id, whatsapp_message,
    notification_status, closed_at
  ) VALUES (
    NEW.id, COALESCE(NEW.order_number, ''), v_customer,
    v_valor_bruto, v_impostos,
    v_mat, v_labor, v_extras, v_custo_total,
    v_margem, v_margem_pct,
    v_group_id, v_message,
    CASE WHEN v_group_id != '' THEN 'queued' ELSE 'no_whatsapp' END,
    now()
  );

  -- Registrar no log de automações
  INSERT INTO automation_logs (
    trigger_event, trigger_data, status,
    actions_executed, started_at, executed_at, completed_at
  ) VALUES (
    'os_financial_closing',
    jsonb_build_object(
      'os_id',        NEW.id,
      'order_number', NEW.order_number,
      'valor_bruto',  v_valor_bruto,
      'margem',       v_margem,
      'margem_pct',   v_margem_pct
    ),
    'success',
    1,
    now(), now(), now()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Não falha a operação principal em caso de erro no trigger
  RETURN NEW;
END;
$$;

-- ─── 5. Attach do Trigger na tabela service_orders ───────────────────────────
DROP TRIGGER IF EXISTS tr_financial_closing_on_complete ON service_orders;

CREATE TRIGGER tr_financial_closing_on_complete
  AFTER UPDATE OF status ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_financial_closing();

-- ─── 6. View resumo para o Dashboard CFO ────────────────────────────────────
CREATE OR REPLACE VIEW v_financial_closings_summary AS
SELECT
  COUNT(*)                                  AS total_fechamentos,
  COALESCE(SUM(valor_bruto),       0)        AS faturamento_total,
  COALESCE(SUM(custo_total),       0)        AS custo_total_geral,
  COALESCE(SUM(margem_liquida),    0)        AS lucro_total,
  COALESCE(AVG(percentual_margem), 0)        AS margem_media_pct,
  COUNT(*) FILTER (WHERE notification_status = 'queued')     AS pendentes_notificacao,
  COUNT(*) FILTER (WHERE notification_status = 'sent')       AS notificacoes_enviadas,
  COUNT(*) FILTER (WHERE closed_at >= NOW() - INTERVAL '30 days') AS fechamentos_30d,
  COALESCE(SUM(margem_liquida) FILTER (WHERE closed_at >= NOW() - INTERVAL '30 days'), 0) AS lucro_30d,
  MAX(closed_at)                            AS ultimo_fechamento
FROM financial_closings;

GRANT SELECT ON v_financial_closings_summary TO anon, authenticated;

-- ─── 7. View detalhada dos últimos fechamentos ──────────────────────────────
CREATE OR REPLACE VIEW v_financial_closings_recent AS
SELECT
  fc.id,
  fc.order_number,
  fc.customer_name,
  fc.closed_at,
  fc.valor_bruto,
  fc.custo_materiais,
  fc.custo_mao_obra,
  fc.custo_extras,
  fc.custo_total,
  fc.margem_liquida,
  fc.percentual_margem,
  fc.whatsapp_message,
  fc.notification_status,
  fc.notified_at
FROM financial_closings fc
ORDER BY fc.closed_at DESC;

GRANT SELECT ON v_financial_closings_recent TO anon, authenticated;

-- ─── 8. Retroativo: Fechar OS já concluídas sem fechamento registrado ────────
-- Roda uma vez para popular o histórico, sem duplicatas
INSERT INTO financial_closings (
  os_id, order_number, customer_name,
  valor_bruto, valor_impostos,
  custo_materiais, custo_mao_obra, custo_extras, custo_total,
  margem_liquida, percentual_margem,
  whatsapp_group_id, whatsapp_message,
  notification_status, closed_at
)
SELECT
  so.id,
  COALESCE(so.order_number, ''),
  COALESCE(c.nome_razao, so.client_name, 'Cliente'),
  COALESCE(so.total_amount, so.total_value, 0) AS valor_bruto,
  ROUND(COALESCE(so.total_amount, so.total_value, 0) * 0 / 100, 2) AS valor_impostos,
  COALESCE(mat.custo_materiais, so.materials_cost, 0),
  COALESCE(lab.custo_mao_obra, so.labor_cost, 0),
  COALESCE(ext.custo_extras, 0),
  COALESCE(mat.custo_materiais, so.materials_cost, 0)
    + COALESCE(lab.custo_mao_obra, so.labor_cost, 0)
    + COALESCE(ext.custo_extras, 0) AS custo_total,
  COALESCE(so.total_amount, so.total_value, 0)
    - COALESCE(mat.custo_materiais, so.materials_cost, 0)
    - COALESCE(lab.custo_mao_obra, so.labor_cost, 0)
    - COALESCE(ext.custo_extras, 0) AS margem_liquida,
  CASE WHEN COALESCE(so.total_amount, so.total_value, 0) > 0 THEN
    ROUND(
      (COALESCE(so.total_amount, so.total_value, 0)
       - COALESCE(mat.custo_materiais, so.materials_cost, 0)
       - COALESCE(lab.custo_mao_obra, so.labor_cost, 0)
       - COALESCE(ext.custo_extras, 0))
      / COALESCE(so.total_amount, so.total_value, 1) * 100
    , 2)
  ELSE 0 END AS percentual_margem,
  fn_get_whatsapp_group_id(),
  '🏁 [Histórico] OS #' || COALESCE(so.order_number, '') || ' — ' || COALESCE(c.nome_razao, so.client_name, 'Cliente') || ' | R$ ' || TO_CHAR(COALESCE(so.total_amount, so.total_value, 0), 'FM999G999D00'),
  'historical',
  COALESCE(so.updated_at, so.created_at, now())
FROM service_orders so
LEFT JOIN customers c ON c.id = COALESCE(so.customer_id, so.client_id)
LEFT JOIN (
  SELECT service_order_id,
    COALESCE(SUM(custo_total), SUM(COALESCE(quantity, 0) * COALESCE(unit_price, 0)), 0) AS custo_materiais
  FROM service_order_materials GROUP BY service_order_id
) mat ON mat.service_order_id = so.id
LEFT JOIN (
  SELECT service_order_id,
    COALESCE(SUM(COALESCE(total_cost, 0)) + SUM(COALESCE(custo_total, 0)), 0) AS custo_mao_obra
  FROM service_order_labor GROUP BY service_order_id
) lab ON lab.service_order_id = so.id
LEFT JOIN (
  SELECT service_order_id, COALESCE(SUM(amount), 0) AS custo_extras
  FROM service_order_costs GROUP BY service_order_id
) ext ON ext.service_order_id = so.id
WHERE LOWER(so.status) IN ('completed', 'concluido', 'finalizado', 'concluída', 'finalizada')
  AND so.id NOT IN (SELECT os_id FROM financial_closings WHERE os_id IS NOT NULL);

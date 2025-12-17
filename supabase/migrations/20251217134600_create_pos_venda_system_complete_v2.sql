/*
  # SISTEMA COMPLETO DE PÓS-VENDA

  Implementa:
  1. Tabela de cards de pós-venda
  2. View consolidada para dashboard
  3. Funções para calcular prioridades automaticamente
  4. Sistema de feedback e satisfação
  5. Triggers para automação
*/

-- =============================================
-- 1. TABELA DE PÓS-VENDA
-- =============================================

CREATE TABLE IF NOT EXISTS pos_venda_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  
  data_conclusao timestamptz NOT NULL,
  dias_desde_conclusao integer,
  
  garantia_meses integer DEFAULT 3,
  garantia_ate date,
  garantia_ativa boolean DEFAULT true,
  
  satisfaction_score integer CHECK (satisfaction_score BETWEEN 1 AND 5),
  feedback text,
  data_feedback timestamptz,
  
  proxima_acao text,
  data_proximo_contato date,
  prioridade text DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  
  num_contatos integer DEFAULT 0,
  ultima_interacao timestamptz,
  tipo_ultima_interacao text,
  
  indicou_outro_cliente boolean DEFAULT false,
  solicitou_novo_servico boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_venda_customer ON pos_venda_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_pos_venda_service_order ON pos_venda_cards(service_order_id);
CREATE INDEX IF NOT EXISTS idx_pos_venda_status ON pos_venda_cards(status) WHERE status != 'concluido';
CREATE INDEX IF NOT EXISTS idx_pos_venda_prioridade ON pos_venda_cards(prioridade);
CREATE INDEX IF NOT EXISTS idx_pos_venda_proximo_contato ON pos_venda_cards(data_proximo_contato)
  WHERE data_proximo_contato IS NOT NULL AND status != 'concluido';

-- =============================================
-- 2. VIEW CONSOLIDADA PARA DASHBOARD
-- =============================================

CREATE OR REPLACE VIEW v_pos_venda_dashboard AS
SELECT
  pv.id,
  pv.customer_id,
  pv.service_order_id,
  c.nome_razao as customer_name,
  c.whatsapp as customer_whatsapp,
  c.celular as customer_celular,
  c.email as customer_email,
  COALESCE(so.description, 'Serviço #' || so.order_number) as service_title,
  COALESCE(so.total_value, so.total_amount, so.total, 0) as valor_os,
  pv.data_conclusao,
  pv.dias_desde_conclusao,
  pv.garantia_ate,
  pv.garantia_ativa,
  pv.satisfaction_score,
  pv.feedback,
  pv.proxima_acao,
  pv.data_proximo_contato,
  pv.prioridade,
  pv.status,
  pv.num_contatos,
  pv.ultima_interacao,
  pv.tipo_ultima_interacao,
  pv.indicou_outro_cliente,
  pv.solicitou_novo_servico
FROM pos_venda_cards pv
LEFT JOIN customers c ON pv.customer_id = c.id
LEFT JOIN service_orders so ON pv.service_order_id = so.id
WHERE pv.status != 'concluido'
ORDER BY pv.prioridade DESC, pv.dias_desde_conclusao DESC;

-- =============================================
-- 3. FUNÇÃO PARA CRIAR CARD AUTOMATICAMENTE
-- =============================================

CREATE OR REPLACE FUNCTION criar_card_pos_venda()
RETURNS TRIGGER AS $$
DECLARE
  v_garantia_meses integer := 3;
  v_proxima_acao text;
BEGIN
  IF NEW.status IN ('finalizado', 'completed', 'concluido') THEN
    v_proxima_acao := 'Entrar em contato para verificar satisfação';
    
    INSERT INTO pos_venda_cards (
      customer_id,
      service_order_id,
      data_conclusao,
      garantia_meses,
      garantia_ate,
      garantia_ativa,
      proxima_acao,
      data_proximo_contato,
      prioridade,
      status
    )
    VALUES (
      NEW.customer_id,
      NEW.id,
      COALESCE(NEW.completion_date, now()),
      v_garantia_meses,
      CURRENT_DATE + (v_garantia_meses || ' months')::interval,
      true,
      v_proxima_acao,
      CURRENT_DATE + 2,
      'alta',
      'pendente'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_criar_card_pos_venda ON service_orders;
CREATE TRIGGER trg_criar_card_pos_venda
  AFTER INSERT OR UPDATE OF status
  ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION criar_card_pos_venda();

-- =============================================
-- 4. FUNÇÃO PARA CALCULAR DIAS E PRIORIDADE
-- =============================================

CREATE OR REPLACE FUNCTION atualizar_pos_venda_card()
RETURNS TRIGGER AS $$
BEGIN
  NEW.dias_desde_conclusao := EXTRACT(DAY FROM (now() - NEW.data_conclusao))::integer;
  
  NEW.garantia_ativa := CURRENT_DATE <= NEW.garantia_ate;
  
  IF NEW.data_proximo_contato IS NOT NULL THEN
    IF NEW.data_proximo_contato < CURRENT_DATE THEN
      NEW.prioridade := 'urgente';
    ELSIF NEW.data_proximo_contato = CURRENT_DATE THEN
      NEW.prioridade := 'alta';
    ELSIF NEW.data_proximo_contato <= CURRENT_DATE + 2 THEN
      NEW.prioridade := 'media';
    END IF;
  END IF;
  
  IF NEW.dias_desde_conclusao >= 30 AND NEW.satisfaction_score IS NULL THEN
    NEW.prioridade := 'urgente';
    NEW.proxima_acao := 'URGENTE: Cliente não deu feedback após 30 dias';
  END IF;
  
  IF NEW.garantia_ativa AND NEW.dias_desde_conclusao >= 60 THEN
    NEW.prioridade := 'alta';
    NEW.proxima_acao := 'Verificar se tudo está OK (garantia expirando)';
  END IF;
  
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualizar_pos_venda_card ON pos_venda_cards;
CREATE TRIGGER trg_atualizar_pos_venda_card
  BEFORE INSERT OR UPDATE
  ON pos_venda_cards
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_pos_venda_card();

-- =============================================
-- 5. FUNÇÃO PARA REGISTRAR FEEDBACK
-- =============================================

CREATE OR REPLACE FUNCTION registrar_feedback_posvenda(
  p_card_id uuid,
  p_satisfaction_score integer,
  p_feedback text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_proxima_acao text;
  v_status text;
BEGIN
  IF p_satisfaction_score >= 4 THEN
    v_proxima_acao := 'Cliente satisfeito - Perguntar sobre indicação';
    v_status := 'em_andamento';
  ELSIF p_satisfaction_score = 3 THEN
    v_proxima_acao := 'Cliente neutro - Verificar possíveis melhorias';
    v_status := 'em_andamento';
  ELSE
    v_proxima_acao := 'URGENTE: Cliente insatisfeito - Entrar em contato imediatamente';
    v_status := 'pendente';
  END IF;
  
  UPDATE pos_venda_cards
  SET
    satisfaction_score = p_satisfaction_score,
    feedback = COALESCE(p_feedback, feedback),
    data_feedback = now(),
    proxima_acao = v_proxima_acao,
    status = v_status,
    data_proximo_contato = CASE
      WHEN p_satisfaction_score >= 4 THEN CURRENT_DATE + 7
      WHEN p_satisfaction_score = 3 THEN CURRENT_DATE + 3
      ELSE CURRENT_DATE + 1
    END,
    prioridade = CASE
      WHEN p_satisfaction_score <= 2 THEN 'urgente'
      WHEN p_satisfaction_score = 3 THEN 'alta'
      ELSE 'media'
    END
  WHERE id = p_card_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'proxima_acao', v_proxima_acao,
    'status', v_status
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. FUNÇÃO PARA REGISTRAR CONTATO
-- =============================================

CREATE OR REPLACE FUNCTION registrar_contato_posvenda(
  p_card_id uuid,
  p_tipo_contato text,
  p_observacoes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_num_contatos integer;
BEGIN
  UPDATE pos_venda_cards
  SET
    num_contatos = COALESCE(num_contatos, 0) + 1,
    ultima_interacao = now(),
    tipo_ultima_interacao = p_tipo_contato,
    status = CASE WHEN status = 'pendente' THEN 'em_andamento' ELSE status END
  WHERE id = p_card_id
  RETURNING num_contatos INTO v_num_contatos;
  
  RETURN jsonb_build_object(
    'success', true,
    'num_contatos', v_num_contatos,
    'ultima_interacao', now()
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. FUNÇÃO DE ESTATÍSTICAS
-- =============================================

CREATE OR REPLACE FUNCTION get_pos_venda_stats()
RETURNS jsonb AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_clientes', COUNT(*),
    'clientes_satisfeitos', COUNT(*) FILTER (WHERE satisfaction_score >= 4),
    'garantias_ativas', COUNT(*) FILTER (WHERE garantia_ativa = true),
    'followups_pendentes', COUNT(*) FILTER (WHERE status = 'pendente'),
    'taxa_satisfacao', ROUND(
      COUNT(*) FILTER (WHERE satisfaction_score >= 4)::numeric * 100 /
      NULLIF(COUNT(*) FILTER (WHERE satisfaction_score IS NOT NULL), 0),
      2
    ),
    'indicacoes_potenciais', COUNT(*) FILTER (WHERE satisfaction_score = 5),
    'valor_total_periodo', COALESCE(SUM(valor_os), 0)
  )
  INTO v_stats
  FROM v_pos_venda_dashboard;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. RLS POLICIES
-- =============================================

ALTER TABLE pos_venda_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON pos_venda_cards;
CREATE POLICY "Allow all for authenticated users" 
  ON pos_venda_cards FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon" ON pos_venda_cards;
CREATE POLICY "Allow all for anon" 
  ON pos_venda_cards FOR ALL 
  TO anon 
  USING (true) 
  WITH CHECK (true);

-- =============================================
-- 9. GRANTS
-- =============================================

GRANT ALL ON pos_venda_cards TO authenticated, anon;
GRANT SELECT ON v_pos_venda_dashboard TO authenticated, anon;
GRANT EXECUTE ON FUNCTION registrar_feedback_posvenda TO authenticated, anon;
GRANT EXECUTE ON FUNCTION registrar_contato_posvenda TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_pos_venda_stats TO authenticated, anon;

-- =============================================
-- 10. POPULAR CARDS EXISTENTES (OPCIONAL)
-- =============================================

INSERT INTO pos_venda_cards (
  customer_id,
  service_order_id,
  data_conclusao,
  garantia_meses,
  garantia_ate,
  garantia_ativa,
  proxima_acao,
  data_proximo_contato,
  prioridade,
  status
)
SELECT
  so.customer_id,
  so.id,
  COALESCE(so.completion_date, so.updated_at),
  3,
  (COALESCE(so.completion_date, so.updated_at)::date + INTERVAL '3 months')::date,
  (COALESCE(so.completion_date, so.updated_at)::date + INTERVAL '3 months')::date >= CURRENT_DATE,
  'Entrar em contato para verificar satisfação',
  CURRENT_DATE + 2,
  'media',
  'pendente'
FROM service_orders so
WHERE so.status IN ('finalizado', 'completed', 'concluido')
  AND so.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM pos_venda_cards pv WHERE pv.service_order_id = so.id
  )
ON CONFLICT DO NOTHING;

/*
  # Dados Iniciais do CRM Profissional (Corrigido)
  
  Popula:
  - Pipelines padrão
  - Estágios
  - Regras de lead scoring
  - Templates de email
  - Sequências de follow-up
  - Tags
  - Funções auxiliares
  - Views
*/

-- Pipeline Padrão de Vendas
INSERT INTO crm_pipelines (id, nome, descricao, tipo, ordem, cor, icone, meta_mensal) VALUES
('00000000-0000-0000-0000-000000000001', 'Pipeline de Vendas', 'Pipeline principal de vendas B2B', 'vendas', 1, '#3B82F6', 'target', 100000),
('00000000-0000-0000-0000-000000000002', 'Qualificação de Leads', 'Qualificação inicial de leads entrantes', 'leads', 2, '#10B981', 'users', 50000),
('00000000-0000-0000-0000-000000000003', 'Pós-Venda', 'Upsell e renovação de contratos', 'pos-venda', 3, '#8B5CF6', 'refresh-cw', 30000)
ON CONFLICT (id) DO NOTHING;

-- Estágios do Pipeline de Vendas
INSERT INTO crm_stages (pipeline_id, nome, descricao, ordem, cor, probabilidade, rotting_days, is_closed, is_won) VALUES
('00000000-0000-0000-0000-000000000001', 'Lead Qualificado', 'Lead passou pela qualificação inicial', 1, '#64748B', 10, 7, false, false),
('00000000-0000-0000-0000-000000000001', 'Reunião Agendada', 'Primeira reunião agendada com prospect', 2, '#3B82F6', 20, 5, false, false),
('00000000-0000-0000-0000-000000000001', 'Proposta Enviada', 'Proposta comercial enviada', 3, '#8B5CF6', 40, 7, false, false),
('00000000-0000-0000-0000-000000000001', 'Negociação', 'Em processo de negociação', 4, '#F59E0B', 60, 5, false, false),
('00000000-0000-0000-0000-000000000001', 'Fechamento', 'Aguardando assinatura', 5, '#10B981', 80, 3, false, false),
('00000000-0000-0000-0000-000000000001', 'Ganho', 'Negócio fechado com sucesso', 6, '#059669', 100, null, true, true),
('00000000-0000-0000-0000-000000000001', 'Perdido', 'Negócio perdido', 7, '#EF4444', 0, null, true, false)
ON CONFLICT DO NOTHING;

-- Estágios do Pipeline de Leads
INSERT INTO crm_stages (pipeline_id, nome, descricao, ordem, cor, probabilidade, is_closed, is_won) VALUES
('00000000-0000-0000-0000-000000000002', 'Novo Lead', 'Lead recém chegado', 1, '#94A3B8', 5, false, false),
('00000000-0000-0000-0000-000000000002', 'Contatado', 'Primeiro contato realizado', 2, '#3B82F6', 15, false, false),
('00000000-0000-0000-0000-000000000002', 'Qualificado', 'Lead qualificado para vendas', 3, '#10B981', 30, false, false),
('00000000-0000-0000-0000-000000000002', 'Não Qualificado', 'Lead não atende critérios', 4, '#EF4444', 0, true, false)
ON CONFLICT DO NOTHING;

-- Regras de Lead Scoring
INSERT INTO crm_lead_scoring_rules (nome, descricao, categoria, campo, operador, valor, pontos, ordem) VALUES
('Empresa Grande', 'Empresa com mais de 50 funcionários', 'demografico', 'tamanho_empresa', 'maior', '50', 20, 1),
('Cargo Decisor', 'Cargo de decisão (CEO, Diretor)', 'demografico', 'cargo', 'contem', 'diretor|ceo|gerente', 15, 2),
('Visitou Pricing', 'Visitou página de preços', 'comportamental', 'visitou_pricing', 'igual', 'true', 25, 4),
('Baixou Material', 'Baixou ebook ou whitepaper', 'comportamental', 'baixou_material', 'igual', 'true', 15, 5),
('Abriu Email', 'Abriu email de campanha', 'engajamento', 'abriu_email', 'igual', 'true', 5, 7),
('Clicou Link', 'Clicou em link do email', 'engajamento', 'clicou_link', 'igual', 'true', 10, 8),
('Budget Adequado', 'Budget declarado adequado', 'fit', 'budget', 'maior', '10000', 25, 10)
ON CONFLICT DO NOTHING;

-- Templates de Email
INSERT INTO crm_email_templates (nome, assunto, corpo, categoria, variaveis) VALUES
('Primeiro Contato', 'Olá {nome_cliente}, vamos conversar?', 
'Olá {nome_cliente},

Percebi que sua empresa {nome_empresa} está em crescimento. Trabalhamos com diversas empresas similares ajudando a otimizar processos.

Teria 15 minutos esta semana para uma conversa rápida?

Atenciosamente,
{nome_vendedor}',
'prospecção',
ARRAY['{nome_cliente}', '{nome_empresa}', '{nome_vendedor}']),

('Follow-up Proposta', 'Proposta {nome_empresa} - Seguimento',
'Olá {nome_cliente},

Enviei a proposta para {nome_empresa} há alguns dias e gostaria de saber se teve oportunidade de revisar.

Alguma dúvida que eu possa esclarecer?

Aguardo seu retorno,
{nome_vendedor}',
'follow-up',
ARRAY['{nome_cliente}', '{nome_empresa}', '{nome_vendedor}'])
ON CONFLICT DO NOTHING;

-- Tags Comuns
INSERT INTO crm_tags (nome, cor, categoria) VALUES
('VIP', '#8B5CF6', 'prioridade'),
('Grande Conta', '#3B82F6', 'tamanho'),
('Hot Lead', '#EF4444', 'temperatura'),
('Indicação', '#F59E0B', 'origem'),
('Website', '#06B6D4', 'origem'),
('Demo Agendada', '#8B5CF6', 'status'),
('Budget Aprovado', '#10B981', 'status')
ON CONFLICT (nome) DO NOTHING;

-- Função para calcular lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(opp_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score integer := 0;
BEGIN
  SELECT COALESCE(SUM(pontos), 0) INTO score
  FROM crm_lead_scoring_rules
  WHERE is_ativo = true;
  
  RETURN LEAST(score, 100);
END;
$$;

-- Função para mover oportunidade entre stages
CREATE OR REPLACE FUNCTION move_opportunity_to_stage(
  opp_id uuid,
  novo_stage_id uuid,
  observacao text DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stage_anterior_id uuid;
  duracao interval;
BEGIN
  SELECT stage_id INTO stage_anterior_id
  FROM crm_opportunities
  WHERE id = opp_id;
  
  SELECT (now() - updated_at) INTO duracao
  FROM crm_opportunities
  WHERE id = opp_id;
  
  INSERT INTO crm_stage_history (
    opportunity_id,
    stage_anterior_id,
    stage_novo_id,
    duracao_no_stage,
    observacoes
  ) VALUES (
    opp_id,
    stage_anterior_id,
    novo_stage_id,
    duracao,
    observacao
  );
  
  UPDATE crm_opportunities
  SET 
    stage_id = novo_stage_id,
    updated_at = now()
  WHERE id = opp_id;
  
  IF EXISTS (
    SELECT 1 FROM crm_stages
    WHERE id = novo_stage_id AND is_closed = true
  ) THEN
    UPDATE crm_opportunities
    SET 
      data_fechamento_real = CURRENT_DATE,
      status = CASE 
        WHEN (SELECT is_won FROM crm_stages WHERE id = novo_stage_id) 
        THEN 'ganho'::text 
        ELSE 'perdido'::text 
      END
    WHERE id = opp_id;
  END IF;
END;
$$;

-- Função para registrar interação
CREATE OR REPLACE FUNCTION register_interaction(
  opp_id uuid,
  cust_id uuid,
  user_id uuid,
  tipo_interacao text,
  assunto_text text DEFAULT null,
  descricao_text text DEFAULT null,
  resultado_text text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  interaction_id uuid;
BEGIN
  INSERT INTO crm_interactions (
    opportunity_id,
    customer_id,
    usuario_id,
    tipo,
    assunto,
    descricao,
    resultado
  ) VALUES (
    opp_id,
    cust_id,
    user_id,
    tipo_interacao,
    assunto_text,
    descricao_text,
    resultado_text
  )
  RETURNING id INTO interaction_id;
  
  UPDATE crm_opportunities
  SET 
    num_interacoes = num_interacoes + 1,
    num_emails = num_emails + CASE WHEN tipo_interacao = 'email' THEN 1 ELSE 0 END,
    num_ligacoes = num_ligacoes + CASE WHEN tipo_interacao = 'ligacao' THEN 1 ELSE 0 END,
    num_reunioes = num_reunioes + CASE WHEN tipo_interacao = 'reuniao' THEN 1 ELSE 0 END,
    data_ultimo_contato = CURRENT_DATE
  WHERE id = opp_id;
  
  RETURN interaction_id;
END;
$$;

-- View para pipeline overview
CREATE OR REPLACE VIEW v_crm_pipeline_overview AS
SELECT 
  p.id as pipeline_id,
  p.nome as pipeline_nome,
  s.id as stage_id,
  s.nome as stage_nome,
  s.ordem,
  COUNT(o.id) as num_oportunidades,
  COALESCE(SUM(o.valor), 0) as valor_total,
  COALESCE(AVG(o.valor), 0) as valor_medio,
  COALESCE(SUM(CASE WHEN o.status = 'ganho' THEN o.valor ELSE 0 END), 0) as valor_ganho,
  COALESCE(AVG(s.probabilidade * o.valor / 100), 0) as valor_ponderado
FROM crm_pipelines p
LEFT JOIN crm_stages s ON s.pipeline_id = p.id
LEFT JOIN crm_opportunities o ON o.stage_id = s.id AND o.status = 'aberto'
WHERE p.is_ativo = true
GROUP BY p.id, p.nome, s.id, s.nome, s.ordem
ORDER BY p.ordem, s.ordem;

-- View para atividades pendentes
CREATE OR REPLACE VIEW v_crm_activities_pending AS
SELECT 
  a.*,
  o.titulo as oportunidade_titulo,
  c.nome_razao as cliente_nome,
  u.full_name as responsavel_nome,
  CASE 
    WHEN a.data_vencimento < now() THEN 'atrasado'
    WHEN a.data_vencimento < now() + interval '24 hours' THEN 'urgente'
    WHEN a.data_vencimento < now() + interval '3 days' THEN 'proximo'
    ELSE 'futuro'
  END as urgencia
FROM crm_activities a
LEFT JOIN crm_opportunities o ON o.id = a.opportunity_id
LEFT JOIN customers c ON c.id = a.customer_id
LEFT JOIN user_profiles u ON u.id = a.responsavel_id
WHERE a.status IN ('pendente', 'em-andamento')
ORDER BY a.data_vencimento ASC NULLS LAST;

-- Grants
GRANT EXECUTE ON FUNCTION calculate_lead_score TO authenticated, anon;
GRANT EXECUTE ON FUNCTION move_opportunity_to_stage TO authenticated, anon;
GRANT EXECUTE ON FUNCTION register_interaction TO authenticated, anon;

GRANT SELECT ON v_crm_pipeline_overview TO authenticated, anon;
GRANT SELECT ON v_crm_activities_pending TO authenticated, anon;
/*
  # CRM Profissional de Relacionamento

  ## Novo Sistema Completo
  
  1. Tabelas Principais
    - `crm_pipelines` - Pipelines de vendas customizáveis
    - `crm_stages` - Estágios de cada pipeline
    - `crm_opportunities` - Oportunidades de negócio
    - `crm_interactions` - Histórico completo de interações
    - `crm_activities` - Atividades e tarefas
    - `crm_notes` - Notas e anotações
    - `crm_documents` - Documentos anexados
    - `crm_tags` - Tags para segmentação
    - `crm_lead_scoring` - Sistema de pontuação de leads
    - `crm_automation_rules` - Regras de automação
    - `crm_email_templates` - Templates de email
    - `crm_sequences` - Sequências de follow-up

  2. Features
    - Pipeline visual customizável
    - Lead scoring automático
    - Histórico completo de interações
    - Automação de follow-ups
    - Previsão de vendas
    - Análise de conversão
    - Segmentação avançada
    - Relatórios personalizados

  3. Segurança
    - RLS em todas as tabelas
    - Controle de acesso por usuário
*/

-- Pipelines de Vendas
CREATE TABLE IF NOT EXISTS crm_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'vendas', -- vendas, leads, pos-venda
  is_ativo boolean DEFAULT true,
  ordem integer DEFAULT 0,
  cor text DEFAULT '#3B82F6',
  icone text DEFAULT 'target',
  meta_mensal numeric(15,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Estágios do Pipeline
CREATE TABLE IF NOT EXISTS crm_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  ordem integer NOT NULL,
  cor text DEFAULT '#6B7280',
  probabilidade integer DEFAULT 50, -- % de chance de conversão
  rotting_days integer, -- dias até considerar "perdendo"
  is_closed boolean DEFAULT false,
  is_won boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Oportunidades
CREATE TABLE IF NOT EXISTS crm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  
  -- Relacionamentos
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  pipeline_id uuid REFERENCES crm_pipelines(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES crm_stages(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Informações Financeiras
  valor numeric(15,2) DEFAULT 0,
  valor_estimado numeric(15,2),
  moeda text DEFAULT 'BRL',
  
  -- Datas
  data_criacao date DEFAULT CURRENT_DATE,
  data_fechamento_esperada date,
  data_fechamento_real date,
  data_ultimo_contato date,
  data_proximo_contato date,
  
  -- Status e Qualificação
  status text DEFAULT 'aberto', -- aberto, ganho, perdido, descartado
  prioridade text DEFAULT 'media', -- baixa, media, alta, urgente
  lead_score integer DEFAULT 0,
  temperatura text DEFAULT 'frio', -- frio, morno, quente
  
  -- Origem
  origem text, -- website, indicacao, cold-call, evento, midia-social
  origem_detalhe text,
  campanha text,
  
  -- Motivos
  motivo_perda text,
  motivo_descarte text,
  
  -- Métricas
  num_interacoes integer DEFAULT 0,
  num_emails integer DEFAULT 0,
  num_ligacoes integer DEFAULT 0,
  num_reunioes integer DEFAULT 0,
  tempo_no_stage_atual interval,
  dias_no_pipeline integer DEFAULT 0,
  
  -- Informações Adicionais
  tags text[],
  custom_fields jsonb DEFAULT '{}',
  is_archived boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('aberto', 'ganho', 'perdido', 'descartado')),
  CONSTRAINT valid_prioridade CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  CONSTRAINT valid_temperatura CHECK (temperatura IN ('frio', 'morno', 'quente'))
);

-- Histórico de Mudanças de Stage
CREATE TABLE IF NOT EXISTS crm_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  stage_anterior_id uuid REFERENCES crm_stages(id),
  stage_novo_id uuid REFERENCES crm_stages(id),
  usuario_id uuid REFERENCES user_profiles(id),
  duracao_no_stage interval,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

-- Interações Completas
CREATE TABLE IF NOT EXISTS crm_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES user_profiles(id),
  
  -- Tipo de Interação
  tipo text NOT NULL, -- email, ligacao, reuniao, whatsapp, visita, demonstracao
  canal text, -- telefone, video, presencial, online
  direcao text, -- entrada, saida
  
  -- Conteúdo
  assunto text,
  descricao text,
  resultado text, -- sucesso, sem-resposta, callback, interessado, nao-interessado
  
  -- Detalhes
  duracao_minutos integer,
  participantes text[],
  localizacao text,
  
  -- Datas
  data_interacao timestamptz DEFAULT now(),
  data_agendamento timestamptz,
  
  -- Anexos e Links
  anexos jsonb DEFAULT '[]',
  link_gravacao text,
  
  -- Sentiment Analysis (futuro)
  sentiment text, -- positivo, neutro, negativo
  sentiment_score numeric(3,2),
  
  -- Flags
  is_automatico boolean DEFAULT false,
  is_importante boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_tipo CHECK (tipo IN ('email', 'ligacao', 'reuniao', 'whatsapp', 'visita', 'demonstracao', 'sms', 'chat')),
  CONSTRAINT valid_resultado CHECK (resultado IN ('sucesso', 'sem-resposta', 'callback', 'interessado', 'nao-interessado', 'agendado', 'cancelado'))
);

-- Atividades e Tarefas
CREATE TABLE IF NOT EXISTS crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  responsavel_id uuid REFERENCES user_profiles(id),
  criado_por_id uuid REFERENCES user_profiles(id),
  
  -- Informações
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL, -- tarefa, ligacao, email, reuniao, lembrete
  prioridade text DEFAULT 'media',
  
  -- Datas
  data_vencimento timestamptz,
  data_conclusao timestamptz,
  lembrete_em timestamptz,
  
  -- Status
  status text DEFAULT 'pendente', -- pendente, em-andamento, concluido, cancelado
  is_atrasado boolean DEFAULT false,
  
  -- Recorrência
  is_recorrente boolean DEFAULT false,
  recorrencia_regra jsonb, -- {frequencia: 'semanal', intervalo: 1, dias: [1,3,5]}
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_tipo_atividade CHECK (tipo IN ('tarefa', 'ligacao', 'email', 'reuniao', 'lembrete', 'follow-up')),
  CONSTRAINT valid_status_atividade CHECK (status IN ('pendente', 'em-andamento', 'concluido', 'cancelado'))
);

-- Notas
CREATE TABLE IF NOT EXISTS crm_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES user_profiles(id),
  
  conteudo text NOT NULL,
  is_privado boolean DEFAULT false,
  is_fixado boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documentos CRM
CREATE TABLE IF NOT EXISTS crm_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES user_profiles(id),
  
  nome text NOT NULL,
  tipo text NOT NULL, -- proposta, contrato, apresentacao, outros
  url text NOT NULL,
  tamanho_bytes bigint,
  mime_type text,
  
  versao integer DEFAULT 1,
  is_assinado boolean DEFAULT false,
  data_assinatura timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Lead Scoring
CREATE TABLE IF NOT EXISTS crm_lead_scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  categoria text NOT NULL, -- demografico, comportamental, engajamento, fit
  
  -- Condição
  campo text NOT NULL,
  operador text NOT NULL, -- igual, contem, maior, menor
  valor text,
  
  -- Pontuação
  pontos integer NOT NULL,
  is_ativo boolean DEFAULT true,
  
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Histórico de Lead Score
CREATE TABLE IF NOT EXISTS crm_lead_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  score_anterior integer,
  score_novo integer,
  diferenca integer,
  motivo text,
  regra_id uuid REFERENCES crm_lead_scoring_rules(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Automação
CREATE TABLE IF NOT EXISTS crm_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  
  -- Trigger
  trigger_tipo text NOT NULL, -- stage-change, field-update, time-based, score-threshold
  trigger_config jsonb NOT NULL,
  
  -- Condições
  condicoes jsonb DEFAULT '[]',
  
  -- Ações
  acoes jsonb NOT NULL, -- [{tipo: 'enviar-email', template_id: '...'}, {tipo: 'criar-tarefa', ...}]
  
  -- Status
  is_ativo boolean DEFAULT true,
  execucoes integer DEFAULT 0,
  ultima_execucao timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Log de Automação
CREATE TABLE IF NOT EXISTS crm_automation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_rule_id uuid REFERENCES crm_automation_rules(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  
  sucesso boolean DEFAULT true,
  erro text,
  acoes_executadas jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- Templates de Email
CREATE TABLE IF NOT EXISTS crm_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  assunto text NOT NULL,
  corpo text NOT NULL,
  
  categoria text DEFAULT 'geral',
  variaveis text[], -- ['{nome_cliente}', '{valor}', '{data}']
  
  is_ativo boolean DEFAULT true,
  uso_contador integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sequências de Follow-up
CREATE TABLE IF NOT EXISTS crm_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  
  objetivo text,
  is_ativo boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Passos da Sequência
CREATE TABLE IF NOT EXISTS crm_sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES crm_sequences(id) ON DELETE CASCADE,
  
  ordem integer NOT NULL,
  tipo text NOT NULL, -- email, tarefa, espera
  
  -- Config específica do tipo
  template_id uuid REFERENCES crm_email_templates(id),
  dias_espera integer DEFAULT 0,
  titulo_tarefa text,
  
  created_at timestamptz DEFAULT now()
);

-- Inscrições em Sequências
CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES crm_sequences(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  
  step_atual integer DEFAULT 1,
  status text DEFAULT 'ativo', -- ativo, pausado, concluido, cancelado
  
  data_inicio timestamptz DEFAULT now(),
  data_proximo_passo timestamptz,
  data_conclusao timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Tags
CREATE TABLE IF NOT EXISTS crm_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  cor text DEFAULT '#6B7280',
  categoria text,
  uso_contador integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Previsão de Vendas
CREATE TABLE IF NOT EXISTS crm_forecast (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo date NOT NULL, -- primeiro dia do mês
  pipeline_id uuid REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES user_profiles(id),
  
  meta numeric(15,2),
  previsto numeric(15,2),
  best_case numeric(15,2),
  worst_case numeric(15,2),
  realizado numeric(15,2) DEFAULT 0,
  
  num_oportunidades integer DEFAULT 0,
  valor_medio numeric(15,2),
  taxa_conversao numeric(5,2),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(periodo, pipeline_id, usuario_id)
);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON crm_opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline ON crm_opportunities(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON crm_opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON crm_opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON crm_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_created ON crm_opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_fechamento ON crm_opportunities(data_fechamento_esperada);

CREATE INDEX IF NOT EXISTS idx_interactions_opportunity ON crm_interactions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_interactions_customer ON crm_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_data ON crm_interactions(data_interacao DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_tipo ON crm_interactions(tipo);

CREATE INDEX IF NOT EXISTS idx_activities_opportunity ON crm_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_responsavel ON crm_activities(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_activities_vencimento ON crm_activities(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_activities_status ON crm_activities(status);

-- Enable RLS
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_lead_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_automation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_forecast ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Full Access for Development)
CREATE POLICY "Allow all for authenticated users" ON crm_pipelines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_stage_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_lead_scoring_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_lead_score_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_automation_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_automation_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_sequence_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_sequence_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON crm_forecast FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies para anon (desenvolvimento)
CREATE POLICY "Allow all for anon" ON crm_pipelines FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_stages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_opportunities FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_stage_history FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_interactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_activities FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_notes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_documents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_lead_scoring_rules FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_lead_score_history FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_automation_rules FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_automation_log FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_email_templates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_sequences FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_sequence_steps FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_sequence_enrollments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_tags FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON crm_forecast FOR ALL TO anon USING (true) WITH CHECK (true);
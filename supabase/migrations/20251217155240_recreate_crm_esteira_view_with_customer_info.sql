/*
  # Recriar view CRM Esteira Completa com mais informações do cliente
  
  1. Alterações
    - Drop e recriar a view v_crm_esteira_completa
    - Adiciona tipo_pessoa do cliente
    - Adiciona telefone do cliente
    - Adiciona endereço completo do cliente (endereço principal)
    - Mantém todos os campos existentes na mesma ordem
  
  2. Impacto
    - Melhora a visualização de informações nos cards do CRM
    - Permite que a equipe tenha acesso rápido a dados de contato e localização
*/

-- Dropar a view existente
DROP VIEW IF EXISTS v_crm_esteira_completa;

-- Recriar a view com mais informações do cliente
CREATE VIEW v_crm_esteira_completa AS
SELECT 
  o.id,
  o.titulo,
  o.customer_id,
  c.nome_razao AS customer_name,
  c.whatsapp AS customer_whatsapp,
  c.celular AS customer_celular,
  c.email AS customer_email,
  c.tipo_pessoa AS customer_tipo_pessoa,
  c.telefone AS customer_telefone,
  
  -- Endereço principal do cliente
  CASE 
    WHEN ca.logradouro IS NOT NULL THEN 
      ca.logradouro || ', ' || ca.numero || 
      CASE WHEN ca.complemento IS NOT NULL THEN ' - ' || ca.complemento ELSE '' END
    ELSE NULL 
  END AS customer_endereco,
  ca.bairro AS customer_bairro,
  ca.cidade AS customer_cidade,
  ca.estado AS customer_estado,
  ca.cep AS customer_cep,
  
  o.valor,
  o.lead_score,
  o.temperatura,
  o.prioridade,
  o.status,
  
  p.id AS pipeline_id,
  p.nome AS pipeline_nome,
  p.tipo AS pipeline_tipo,
  
  s.id AS stage_id,
  s.nome AS stage_nome,
  s.cor AS stage_cor,
  s.ordem AS stage_ordem,
  s.probabilidade,
  
  e.id AS owner_id,
  e.name AS owner_name,
  
  o.data_criacao,
  o.data_fechamento_esperada,
  o.data_proximo_contato,
  o.dias_no_pipeline,
  o.dias_sem_atividade,
  o.is_rotting,
  o.num_interacoes,
  o.custom_fields,
  
  EXTRACT(DAY FROM NOW() - o.updated_at)::INTEGER AS dias_no_stage_atual,
  
  CASE
    WHEN o.data_proximo_contato IS NOT NULL AND o.data_proximo_contato <= CURRENT_DATE THEN 'Contato Urgente'
    WHEN o.dias_sem_atividade > 7 THEN 'Reativar Contato'
    WHEN s.nome = 'Onboarding' THEN 'Welcome Call'
    WHEN s.nome = 'Follow-up Curto' THEN 'Verificar Satisfação'
    WHEN s.nome = 'Follow-up Longo' THEN 'Pesquisa NPS'
    WHEN s.nome = 'Retenção/Upsell' THEN 'Apresentar Novos Serviços'
    WHEN s.nome = 'Indicação/Referral' THEN 'Solicitar Indicação'
    WHEN s.nome = 'Churn Risk' THEN 'Ação de Retenção URGENTE'
    ELSE 'Acompanhar Pipeline'
  END AS proxima_acao_sugerida,
  
  CASE
    WHEN p.tipo = 'pos_venda' THEN 
      GREATEST(0, LEAST(100,
        100 
        - COALESCE(o.dias_sem_atividade, 0) * 2
        - CASE WHEN o.data_proximo_contato < CURRENT_DATE THEN 20 ELSE 0 END
        + COALESCE(o.num_interacoes, 0) * 5
      ))
    ELSE NULL
  END AS cliente_health_score

FROM crm_opportunities o
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN crm_stages s ON s.id = o.stage_id
LEFT JOIN crm_pipelines p ON p.id = o.pipeline_id
LEFT JOIN employees e ON e.id = o.owner_id
LEFT JOIN customer_addresses ca ON ca.customer_id = c.id AND ca.principal = true

WHERE o.is_archived = false

ORDER BY p.ordem, s.ordem, o.data_proximo_contato;

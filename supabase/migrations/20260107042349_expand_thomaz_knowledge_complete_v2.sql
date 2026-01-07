/*
  # Expandir Base de Conhecimento do Thomaz AI Completo
  
  1. Novos Conhecimentos
    - 5 guias completos sobre capacidades do sistema
    - Padrões de conversação avançados
    - Templates de respostas contextuais
  
  2. Segurança
    - Todos com acesso público para anon e authenticated
*/

-- Limpar conhecimento de teste se houver
DELETE FROM thomaz_knowledge_sources WHERE title LIKE '%Placeholder%' OR title LIKE '%Test%';

-- CONHECIMENTOS DO SISTEMA
INSERT INTO thomaz_knowledge_sources (
  source_type, title, description, content, category, tags, sensitivity, is_active
) VALUES 
(
  'MANUAL',
  'Capacidades Analíticas do Thomaz AI',
  'Descrição completa de todas as capacidades analíticas disponíveis',
  E'# Capacidades Analíticas\n\nAnálises Financeiras: DRE, Fluxo de Caixa, Health Score (0-100), Detecção de Anomalias\n\nAnálises de Estoque: Níveis Críticos, Giro, Análise por Técnico\n\nAnálises de OS: Taxa de Conclusão, Tempo Médio, Ticket Médio\n\nAnálises de Clientes: RFM, CLV, Taxa de Churn, Segmentação\n\nPredições: Projeção de Receita, Fluxo de Caixa 30/60/90 dias, Análise de Tendências',
  'analytics',
  ARRAY['capacidades', 'análises'],
  'public',
  true
),
(
  'GUIDE',
  'Como Usar o Thomaz AI',
  'Guia completo de uso do assistente',
  E'# Como Usar\n\nÍcone Flutuante: Consultas rápidas, métricas atuais, alertas\n\nAba Thomaz AI: Análises profundas, conversação contextual\n\nPerguntas Financeiras: saúde financeira, saldo, anomalias, margem\n\nPerguntas Estoque: itens críticos, reposição, giro\n\nPerguntas OS: atrasadas, ticket médio, taxa conclusão\n\nPerguntas Clientes: melhores clientes, inativos, RFM',
  'guide',
  ARRAY['tutorial', 'uso'],
  'public',
  true
),
(
  'MANUAL',
  'Indicadores Financeiros',
  'Fórmulas e interpretação de indicadores',
  E'# Indicadores\n\nHealth Score (0-100): Lucratividade 30%, Crescimento 25%, Liquidez 25%, Eficiência 20%\n\nInterpretação: 80-100 Excelente, 60-79 Bom, 40-59 Regular, 20-39 Ruim, 0-19 Crítico\n\nMargem Lucro: (Receitas-Despesas)/Receitas x100. Ótima>20%, Boa 10-20%, Regular 5-10%\n\nCrescimento: (Atual-Anterior)/Anterior x100. Excelente>20%, Bom 10-20%\n\nLiquidez: Receber/Pagar. Saudável>1.5, Aceitável 1-1.5, Crítico<0.5',
  'analytics',
  ARRAY['financeiro', 'indicadores'],
  'public',
  true
),
(
  'GUIDE',
  'Troubleshooting',
  'Soluções para problemas comuns',
  E'# Problemas Comuns\n\nAnálises não aparecem: Precisa 7+ dias de dados, categorias configuradas\n\nAlertas não aparecem: Verificar se foram resolvidos, ajustar sensibilidade\n\nProjeção não funciona: Configurar lançamentos futuros, contas bancárias\n\nThoaz não responde bem: Configurar API key, ser mais específico na pergunta',
  'support',
  ARRAY['troubleshooting', 'ajuda'],
  'public',
  true
),
(
  'FAQ',
  'Perguntas Frequentes',
  'FAQ do sistema',
  E'# FAQ\n\nComo melhorar health score? Aumentar margem, crescer receitas, manter liquidez, melhorar eficiência\n\nPreciso de API Key? Não obrigatório. Funciona sem, mas com API fica mais elaborado\n\nDados são seguros? Sim. Não enviados sem API key. Quando enviados, são anonimizados\n\nThoamz aprende? Sim! ML registra padrões e melhora com feedback\n\nFunciona offline? Parcialmente. Funções básicas sim, análises precisam conexão',
  'faq',
  ARRAY['perguntas', 'dúvidas'],
  'public',
  true
);

-- PADRÕES DE CONVERSAÇÃO
INSERT INTO thomaz_conversation_patterns (
  pattern_type, user_input_pattern, intent, required_context, response_template, priority, active
) VALUES
(
  'regex',
  '(?i)(quanto|qual|valor|saldo)(.*)(tenho|atual|hoje)',
  'balance_query',
  ARRAY['saldo', 'contas'],
  'Saldo Atual: {saldo}\nContas a Receber: {receber}\nContas a Pagar: {pagar}\nProjetado 30d: {projetado}',
  9,
  true
),
(
  'regex',
  '(?i)(como|está)(.*)(saúde|desempenho)(.*)(financeiro|empresa)',
  'health_check',
  ARRAY['health_score'],
  'Score: {score}/100 - {status}\nLucratividade: {lucro}/30\nCrescimento: {crescimento}/25\nLiquidez: {liquidez}/25\nEficiência: {eficiencia}/20',
  10,
  true
),
(
  'regex',
  '(?i)(recomend|suger|devo fazer)',
  'recommendation_request',
  ARRAY['recomendacoes'],
  'Recomendações:\n\nPrioridade Alta: {rec1}\nPrioridade Média: {rec2}\nImpacto Estimado: {impacto}',
  8,
  true
),
(
  'regex',
  '(?i)(alert|problema|crítico|urgente)',
  'alert_query',
  ARRAY['alertas'],
  'Alertas Ativos: {total}\n\n{lista_alertas}\n\nAções Recomendadas: {acoes}',
  10,
  true
);

-- RESPOSTAS CONVERSACIONAIS
INSERT INTO thomaz_conversational_responses (
  intent, response_variations, tone, active
) VALUES
(
  'sem_dados',
  ARRAY[
    'Ainda não tenho dados suficientes. Preciso: 7+ dias de lançamentos, 1+ conta bancária, categorias configuradas',
    'Poucos dados disponíveis. Aguarde acumular mais histórico para análises precisas',
    'Para essa análise, preciso de mais dados. Continue usando o sistema que logo terei insights!'
  ],
  'helpful',
  true
),
(
  'sem_api_key',
  ARRAY[
    'Funcionando no modo básico. Para respostas mais elaboradas, configure uma API key em Configurações → Provedores de IA',
    'Modo básico ativo. Posso ajudar com minha base de conhecimento, mas com API key seria ainda melhor!',
    'API key não configurada. Mesmo assim consigo te ajudar bastante!'
  ],
  'informative',
  true
),
(
  'primeira_vez',
  ARRAY[
    'Olá! Sou o Thomaz, sua IA de gestão. Posso te ajudar com análises financeiras, estoque, OS e clientes. Como posso te ajudar?',
    'Oi! Thomaz aqui. Transformo seus dados em decisões inteligentes. Sobre o que quer saber?',
    'Olá! Pronto para analisar seu negócio. Pergunte sobre finanças, estoque, OS ou clientes!'
  ],
  'friendly',
  true
),
(
  'sucesso',
  ARRAY[
    'Análise concluída! {resultado}. Posso te ajudar com mais alguma coisa?',
    'Pronto! {resultado}. Quer explorar outro aspecto do seu negócio?',
    'Feito! {resultado}. Tem mais alguma pergunta?'
  ],
  'positive',
  true
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_thomaz_knowledge_cat ON thomaz_knowledge_sources(category);
CREATE INDEX IF NOT EXISTS idx_thomaz_knowledge_tags_gin ON thomaz_knowledge_sources USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_thomaz_patterns_intent ON thomaz_conversation_patterns(intent);
CREATE INDEX IF NOT EXISTS idx_thomaz_responses_intent ON thomaz_conversational_responses(intent);

-- Grants
GRANT SELECT ON thomaz_knowledge_sources TO anon, authenticated;
GRANT SELECT ON thomaz_conversation_patterns TO anon, authenticated;
GRANT SELECT ON thomaz_conversational_responses TO anon, authenticated;

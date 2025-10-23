/*
  # Thomaz AI - Acesso Total ao Sistema

  1. Expansão do Sistema
    - Adiciona intenções para acessar TODOS os dados
    - Integra com biblioteca de documentos
    - Adiciona comandos para dashboards e KPIs
    - Implementa linguagem coloquial brasileira
    - Acesso a indicadores e métricas

  2. Novas Funcionalidades
    - Busca em documentos da biblioteca
    - Análise de indicadores (ROI, margem, etc)
    - Comparações temporais
    - Previsões e tendências
    - Linguagem natural avançada
*/

-- Limpar e recriar com mais comandos
DELETE FROM chat_intents WHERE intent_name LIKE '%_extended';

-- ========================================
-- NOVOS COMANDOS - LINGUAGEM COLOQUIAL
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'quem_sou_eu',
    ARRAY[
      'quem é você', 'seu nome', 'como se chama', 'quem é thomaz',
      'se apresente', 'me fale sobre você', 'qual seu nome'
    ],
    'Apresentação do Thomaz',
    NULL,
    'Apresentação do assistente Thomaz'
  ),
  (
    'listar_todos_clientes',
    ARRAY[
      'lista todos os clientes', 'todos os clientes', 'cadastro completo de clientes',
      'ver todos clientes', 'mostrar clientes', 'relação de clientes',
      'quem são meus clientes', 'lista completa clientes'
    ],
    'Lista TODOS os clientes cadastrados',
    'SELECT name, email, phone, city, state, cpf_cnpj FROM customers ORDER BY name LIMIT 50',
    'Lista completa de clientes'
  ),
  (
    'todas_os',
    ARRAY[
      'todas as os', 'todas ordens', 'lista completa de os', 'histórico completo',
      'todas as ordens de serviço', 'ver todas os', 'listar tudo'
    ],
    'Lista TODAS as ordens de serviço',
    'SELECT order_number, customer_name, status, total_value, created_at FROM service_orders ORDER BY created_at DESC LIMIT 50',
    'Histórico completo de ordens de serviço'
  ),
  (
    'indicadores_roi',
    ARRAY[
      'roi', 'retorno sobre investimento', 'rentabilidade', 'lucratividade',
      'quanto estou lucrando', 'margem de lucro', 'indicadores financeiros'
    ],
    'Calcula indicadores ROI e margens',
    NULL,
    'Indicadores de rentabilidade'
  ),
  (
    'comparar_periodos',
    ARRAY[
      'comparar meses', 'comparação mensal', 'este mês vs mês passado',
      'evolução', 'crescimento', 'como está indo comparado', 'performance comparada'
    ],
    'Compara performance entre períodos',
    NULL,
    'Comparação entre períodos'
  ),
  (
    'ticket_medio',
    ARRAY[
      'ticket médio', 'valor médio', 'média de venda', 'valor médio por os',
      'quanto é meu ticket', 'preço médio'
    ],
    'Calcula ticket médio de vendas',
    NULL,
    'Ticket médio calculado'
  ),
  (
    'clientes_inadimplentes',
    ARRAY[
      'clientes inadimplentes', 'quem deve', 'devedores', 'clientes devendo',
      'inadimplência', 'contas em aberto', 'quem não pagou'
    ],
    'Lista clientes com contas em atraso',
    NULL,
    'Clientes inadimplentes'
  ),
  (
    'previsao_faturamento',
    ARRAY[
      'previsão de faturamento', 'projeção', 'quanto vou faturar',
      'estimativa', 'tendência', 'forecast'
    ],
    'Projeta faturamento baseado em histórico',
    NULL,
    'Previsão de faturamento'
  ),
  (
    'buscar_documento',
    ARRAY[
      'buscar documento', 'procurar manual', 'achar arquivo', 'documentação',
      'manual de', 'tem algum documento sobre', 'onde está o manual',
      'biblioteca', 'procurar na biblioteca'
    ],
    'Busca documentos na biblioteca',
    NULL,
    'Resultados da busca na biblioteca'
  ),
  (
    'listar_documentos',
    ARRAY[
      'lista de documentos', 'quais documentos', 'manuais disponíveis',
      'o que tem na biblioteca', 'documentos cadastrados', 'ver manuais'
    ],
    'Lista todos os documentos da biblioteca',
    NULL,
    'Documentos disponíveis na biblioteca'
  );

-- ========================================
-- COMANDOS DE DASHBOARDS E INDICADORES
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'dashboard_vendas',
    ARRAY[
      'dashboard de vendas', 'painel de vendas', 'resumo de vendas',
      'visão de vendas', 'estatísticas de vendas'
    ],
    'Mostra dashboard completo de vendas',
    NULL,
    'Dashboard de vendas'
  ),
  (
    'dashboard_financeiro_completo',
    ARRAY[
      'dashboard financeiro completo', 'visão financeira total',
      'todos indicadores financeiros', 'painel financeiro'
    ],
    'Dashboard financeiro com todos indicadores',
    NULL,
    'Dashboard financeiro completo'
  ),
  (
    'analise_margem',
    ARRAY[
      'análise de margem', 'margem de lucro', 'margens', 'markup',
      'quanto lucro por os', 'lucro por serviço'
    ],
    'Analisa margem de lucro por serviço',
    NULL,
    'Análise de margens'
  ),
  (
    'top_servicos_lucrativos',
    ARRAY[
      'serviços mais lucrativos', 'o que dá mais lucro', 'top lucro',
      'melhores margens', 'serviços rentáveis'
    ],
    'Lista serviços mais lucrativos',
    NULL,
    'Serviços mais lucrativos'
  ),
  (
    'tendencia_vendas',
    ARRAY[
      'tendência de vendas', 'como está a tendência', 'vendas estão crescendo',
      'evolução das vendas', 'vendas aumentando ou diminuindo'
    ],
    'Analisa tendência de vendas',
    NULL,
    'Tendência de vendas'
  );

-- ========================================
-- EXPRESSÕES COLOQUIAIS BRASILEIRAS
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'como_ta_indo',
    ARRAY[
      'como tá indo', 'como está indo', 'tá bom', 'está bom',
      'como anda', 'tá tudo certo', 'como vão as coisas',
      'e aí como é que tá', 'tá indo bem'
    ],
    'Responde sobre status geral do negócio',
    NULL,
    'Status geral do negócio'
  ),
  (
    'tamo_lucrando',
    ARRAY[
      'tamo lucrando', 'tá dando lucro', 'está lucrativo',
      'tá no azul', 'no verde', 'dando dinheiro', 'tá rendendo'
    ],
    'Informa se está tendo lucro',
    NULL,
    'Situação de lucro'
  ),
  (
    'ta_ruim',
    ARRAY[
      'tá ruim', 'está ruim', 'tá apertado', 'no vermelho',
      'no prejuízo', 'está difícil', 'tá complicado'
    ],
    'Analisa se há problemas financeiros',
    NULL,
    'Análise de problemas'
  ),
  (
    'quem_paga_em_dia',
    ARRAY[
      'quem paga em dia', 'clientes bons pagadores', 'quem é certinho',
      'pagadores pontuais', 'clientes que não atrasam'
    ],
    'Lista clientes com bom histórico de pagamento',
    NULL,
    'Clientes bons pagadores'
  ),
  (
    'ta_faltando_dinheiro',
    ARRAY[
      'tá faltando dinheiro', 'preciso de dinheiro', 'caixa baixo',
      'sem grana', 'fluxo negativo', 'tá curto'
    ],
    'Analisa fluxo de caixa',
    NULL,
    'Análise de fluxo de caixa'
  );

-- ========================================
-- COMANDOS DE EQUIPE E PRODUTIVIDADE
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'quem_trabalha_mais',
    ARRAY[
      'quem trabalha mais', 'funcionário mais produtivo', 'quem faz mais os',
      'quem atende mais', 'ranking de funcionários'
    ],
    'Ranking de produtividade por funcionário',
    NULL,
    'Ranking de produtividade'
  ),
  (
    'equipe_disponivel',
    ARRAY[
      'quem está disponível', 'equipe livre', 'quem pode atender',
      'funcionários disponíveis', 'quem está sem serviço'
    ],
    'Lista funcionários disponíveis',
    NULL,
    'Funcionários disponíveis'
  ),
  (
    'custo_por_os',
    ARRAY[
      'custo por os', 'quanto custa cada os', 'custo médio por ordem',
      'gasto por serviço', 'despesa por os'
    ],
    'Calcula custo médio por OS',
    NULL,
    'Custo médio por OS'
  );

-- ========================================
-- COMANDOS SOBRE EQUIPAMENTOS
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'listar_equipamentos',
    ARRAY[
      'equipamentos', 'lista de equipamentos', 'quais equipamentos',
      'máquinas', 'ferramentas', 'aparelhos'
    ],
    'Lista equipamentos cadastrados',
    'SELECT name, brand, model, serial_number FROM equipments WHERE active = true ORDER BY name LIMIT 30',
    'Equipamentos cadastrados'
  ),
  (
    'equipamentos_manutencao',
    ARRAY[
      'equipamentos em manutenção', 'máquinas paradas', 'em manutenção',
      'equipamentos com problema', 'o que está quebrado'
    ],
    'Lista equipamentos em manutenção',
    NULL,
    'Equipamentos em manutenção'
  );

-- Atualizar configuração do chatbot
UPDATE chat_intents 
SET description = 'Apresentação do assistente Thomaz - seu assistente inteligente'
WHERE intent_name = 'quem_sou_eu';

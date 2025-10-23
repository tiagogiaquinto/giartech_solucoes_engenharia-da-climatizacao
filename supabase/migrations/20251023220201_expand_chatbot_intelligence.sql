/*
  # Expande Inteligência do Thomaz

  1. Adiciona MUITAS variações de keywords
  2. Melhora compreensão de linguagem natural
  3. Adiciona sinônimos e gírias brasileiras
  4. Cobre mais formas de fazer as mesmas perguntas
*/

-- Limpar intenções antigas e adicionar versões melhoradas
DELETE FROM chat_intents;

-- ========================================
-- SAUDAÇÕES E APRESENTAÇÃO
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
(
  'quem_sou_eu',
  ARRAY[
    'quem é você', 'quem e voce', 'seu nome', 'se chama', 'quem é thomaz',
    'se apresente', 'me fale sobre você', 'qual seu nome', 'quem e vc',
    'o que você é', 'o que voce e', 'vc é o que', 'explica quem vc e',
    'apresentacao', 'apresentação', 'conhecer você', 'conhecer voce'
  ],
  'Apresentação do Thomaz',
  NULL,
  'Apresentação do assistente Thomaz'
);

-- ========================================
-- ORDENS DE SERVIÇO
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
(
  'listar_os_abertas',
  ARRAY[
    'os abertas', 'ordens abertas', 'os pendentes', 'ordens pendentes',
    'quantas os abertas', 'quantas ordens abertas', 'os em aberto',
    'servicos abertos', 'serviços abertos', 'trabalhos pendentes',
    'o que tem aberto', 'o que tá aberto', 'mostrar os abertas',
    'ver os abertas', 'lista os abertas', 'listar os abertas',
    'os que estao abertas', 'os que não fecharam', 'os não concluidas',
    'os pra fazer', 'os para fazer', 'tem os aberta', 'tem ordem aberta',
    'quais os abertas', 'me mostra as os abertas', 'cadê as os abertas'
  ],
  'Lista ordens de serviço abertas',
  'SELECT order_number, customer_name, created_at, total_value FROM service_orders WHERE status IN (''pending'', ''in_progress'') ORDER BY created_at DESC LIMIT 20',
  'Lista de ordens de serviço abertas'
),
(
  'todas_os',
  ARRAY[
    'todas as os', 'todas ordens', 'lista completa de os', 'histórico completo',
    'todas as ordens de serviço', 'ver todas os', 'listar tudo',
    'todas os cadastradas', 'historico de os', 'historico completo',
    'mostra todas os', 'me mostra todas as os', 'quero ver todas os',
    'lista geral de os', 'relacao de os', 'relação de os',
    'cadastro completo de os', 'os do sistema', 'todas as ordens'
  ],
  'Lista TODAS as ordens de serviço',
  'SELECT order_number, customer_name, status, total_value, created_at FROM service_orders ORDER BY created_at DESC LIMIT 50',
  'Histórico completo de ordens de serviço'
),
(
  'quantas_os',
  ARRAY[
    'quantas os', 'quantas ordens', 'total de os', 'numero de os',
    'quantidade de os', 'conta as os', 'contar os', 'quantos servicos',
    'quantos serviços', 'tenho quantas os', 'total de ordens',
    'numero total de os', 'quantidade total', 'soma das os'
  ],
  'Conta total de OS',
  'SELECT COUNT(*) as total FROM service_orders',
  'Total de ordens de serviço'
),
(
  'os_atrasadas',
  ARRAY[
    'os atrasadas', 'ordens atrasadas', 'servicos atrasados', 'serviços atrasados',
    'os com atraso', 'os vencidas', 'os atrasada', 'trabalhos atrasados',
    'o que tá atrasado', 'o que está atrasado', 'tem atraso', 'tem os atrasada',
    'os passadas', 'os venceu', 'prazo vencido', 'fora do prazo'
  ],
  'Lista OS atrasadas',
  'SELECT order_number, customer_name, created_at FROM service_orders WHERE status != ''completed'' AND created_at < NOW() - INTERVAL ''7 days'' ORDER BY created_at LIMIT 20',
  'Ordens de serviço atrasadas'
);

-- ========================================
-- CLIENTES
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
(
  'listar_todos_clientes',
  ARRAY[
    'lista todos os clientes', 'todos os clientes', 'cadastro completo de clientes',
    'ver todos clientes', 'mostrar clientes', 'relação de clientes', 'relacao de clientes',
    'quem são meus clientes', 'quem sao meus clientes', 'lista completa clientes',
    'clientes cadastrados', 'base de clientes', 'carteira de clientes',
    'meus clientes', 'me mostra os clientes', 'quero ver os clientes',
    'tem quantos clientes', 'listar clientes', 'lista geral de clientes'
  ],
  'Lista TODOS os clientes cadastrados',
  'SELECT name, email, phone, city, state, cpf_cnpj FROM customers ORDER BY name LIMIT 50',
  'Lista completa de clientes'
),
(
  'buscar_cliente',
  ARRAY[
    'buscar cliente', 'procurar cliente', 'achar cliente', 'encontrar cliente',
    'pesquisar cliente', 'localizar cliente', 'cliente chamado', 'cadê o cliente',
    'cade o cliente', 'onde tá o cliente', 'onde esta o cliente',
    'tem cliente', 'existe cliente', 'ver dados do cliente', 'info do cliente'
  ],
  'Busca cliente específico',
  NULL,
  'Busca de cliente'
),
(
  'melhores_clientes',
  ARRAY[
    'melhores clientes', 'top clientes', 'principais clientes', 'maiores clientes',
    'clientes que mais compram', 'quem compra mais', 'clientes vip',
    'clientes importantes', 'clientes destaque', 'ranking de clientes',
    'clientes que mais gastam', 'maiores compradores', 'clientes fieis'
  ],
  'Ranking de melhores clientes',
  NULL,
  'Top clientes por faturamento'
);

-- ========================================
-- FINANCEIRO
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
(
  'faturamento_mes',
  ARRAY[
    'faturamento do mês', 'faturamento do mes', 'faturamento mensal', 'quanto faturei',
    'receita do mês', 'receita do mes', 'receita mensal', 'vendas do mês',
    'vendas do mes', 'quanto vendi', 'total de vendas', 'valor faturado',
    'quanto entrou', 'entrada do mês', 'entrada do mes', 'ganho do mês',
    'ganho do mes', 'faturei quanto', 'vendi quanto'
  ],
  'Faturamento do mês atual',
  NULL,
  'Faturamento mensal'
),
(
  'lucro_mes',
  ARRAY[
    'lucro do mês', 'lucro do mes', 'lucro mensal', 'quanto lucrei',
    'resultado do mês', 'resultado do mes', 'saldo do mês', 'saldo do mes',
    'balanço do mês', 'balanco do mes', 'lucro liquido', 'lucro líquido',
    'quanto sobrou', 'sobra do mês', 'sobra do mes', 'lucrei quanto'
  ],
  'Lucro do mês',
  NULL,
  'Lucro mensal calculado'
),
(
  'como_ta_indo',
  ARRAY[
    'como tá indo', 'como ta indo', 'como está indo', 'como esta indo',
    'tá bom', 'ta bom', 'está bom', 'esta bom', 'como anda',
    'tá tudo certo', 'ta tudo certo', 'como vão as coisas', 'como vao as coisas',
    'e aí como é que tá', 'e ai como e que ta', 'tá indo bem', 'ta indo bem',
    'situação do negócio', 'situacao do negocio', 'status do negócio',
    'como vai o negócio', 'como vai o negocio', 'como vai a empresa'
  ],
  'Status geral do negócio',
  NULL,
  'Status geral'
),
(
  'tamo_lucrando',
  ARRAY[
    'tamo lucrando', 'tá dando lucro', 'ta dando lucro', 'está lucrativo',
    'tá no azul', 'ta no azul', 'no verde', 'dando dinheiro', 'tá rendendo',
    'ta rendendo', 'tá dando resultado', 'ta dando resultado',
    'tem lucro', 'tá positivo', 'ta positivo', 'tá lucrativo', 'ta lucrativo'
  ],
  'Verifica se está tendo lucro',
  NULL,
  'Análise de lucro'
),
(
  'contas_vencidas',
  ARRAY[
    'contas vencidas', 'contas atrasadas', 'o que preciso pagar', 'o que venceu',
    'pagamentos atrasados', 'boletos vencidos', 'contas em atraso',
    'dívidas vencidas', 'dividas vencidas', 'o que tá vencido', 'o que ta vencido',
    'tem conta vencida', 'tem pagamento atrasado', 'contas a vencer'
  ],
  'Lista contas vencidas',
  NULL,
  'Contas vencidas'
);

-- ========================================
-- ESTOQUE
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
(
  'estoque_baixo',
  ARRAY[
    'estoque baixo', 'o que está acabando', 'o que esta acabando', 'o que tá acabando',
    'o que ta acabando', 'materiais acabando', 'falta material', 'faltando material',
    'preciso comprar', 'precisa repor', 'estoque mínimo', 'estoque minimo',
    'tá faltando', 'ta faltando', 'o que falta', 'material em falta',
    'acabando material', 'reposição necessária', 'reposicao necessaria'
  ],
  'Materiais com estoque baixo',
  NULL,
  'Materiais em falta'
),
(
  'buscar_material',
  ARRAY[
    'buscar material', 'procurar material', 'achar material', 'encontrar material',
    'pesquisar material', 'material chamado', 'cadê o material', 'cade o material',
    'onde tá o material', 'tem material', 'existe material', 'info do material',
    'dados do material', 'ver material', 'mostrar material'
  ],
  'Busca material específico',
  NULL,
  'Busca de material'
),
(
  'valor_estoque',
  ARRAY[
    'valor do estoque', 'quanto tenho em estoque', 'capital em estoque',
    'valor investido em estoque', 'total do estoque', 'patrimônio em estoque',
    'patrimonio em estoque', 'quanto vale o estoque', 'valor total dos materiais',
    'investimento em estoque', 'dinheiro em estoque'
  ],
  'Valor total do estoque',
  NULL,
  'Valor do estoque'
);

-- ========================================
-- MANUAIS DO SISTEMA
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
(
  'ajuda_sistema',
  ARRAY[
    'como criar os', 'como criar ordem', 'como cadastrar cliente', 'como usar',
    'manual de', 'ajuda com', 'tutorial de', 'como fazer', 'explica como',
    'me ensina', 'como funciona', 'passo a passo', 'guia de',
    'como faço para', 'como faco para', 'preciso saber como', 'não sei como',
    'nao sei como', 'ensina a', 'me ajuda a', 'como eu', 'tutorial',
    'procedimento', 'instruções', 'instrucoes', 'como', 'fazer'
  ],
  'Busca manuais do sistema',
  NULL,
  'Manual do sistema'
),
(
  'listar_manuais',
  ARRAY[
    'lista de manuais', 'quais manuais', 'manuais disponíveis', 'manuais disponiveis',
    'tutoriais disponíveis', 'tutoriais disponiveis', 'o que tem de ajuda',
    'guias do sistema', 'ajudas disponíveis', 'ajudas disponiveis',
    'tem quais manuais', 'mostra os manuais', 'ver manuais'
  ],
  'Lista todos os manuais',
  NULL,
  'Manuais disponíveis'
);

-- ========================================
-- INDICADORES E MÉTRICAS
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
(
  'indicadores_roi',
  ARRAY[
    'roi', 'retorno sobre investimento', 'rentabilidade', 'lucratividade',
    'quanto estou lucrando', 'margem de lucro', 'indicadores financeiros',
    'taxa de retorno', 'retorno do investimento', 'lucro percentual',
    'porcentagem de lucro', 'análise de rentabilidade', 'analise de rentabilidade'
  ],
  'Indicadores ROI',
  NULL,
  'ROI calculado'
),
(
  'ticket_medio',
  ARRAY[
    'ticket médio', 'ticket medio', 'valor médio', 'valor medio',
    'média de venda', 'media de venda', 'valor médio por os', 'valor medio por os',
    'quanto é meu ticket', 'quanto e meu ticket', 'preço médio', 'preco medio',
    'média por venda', 'media por venda', 'ticket de venda'
  ],
  'Ticket médio de vendas',
  NULL,
  'Ticket médio'
),
(
  'clientes_inadimplentes',
  ARRAY[
    'clientes inadimplentes', 'quem deve', 'devedores', 'clientes devendo',
    'inadimplência', 'inadimplencia', 'contas em aberto', 'quem não pagou',
    'quem nao pagou', 'clientes que devem', 'dívidas de clientes',
    'dividas de clientes', 'clientes atrasados', 'pagamentos pendentes'
  ],
  'Clientes inadimplentes',
  NULL,
  'Lista de inadimplentes'
);

-- ========================================
-- AGENDA
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
(
  'agenda_hoje',
  ARRAY[
    'agenda hoje', 'agenda de hoje', 'o que tenho hoje', 'compromissos hoje',
    'eventos hoje', 'o que tem hoje', 'o que tá marcado hoje', 'o que ta marcado hoje',
    'reuniões hoje', 'reunioes hoje', 'programação de hoje', 'programacao de hoje',
    'o que fazer hoje', 'tarefas de hoje', 'hoje tem o que'
  ],
  'Agenda de hoje',
  NULL,
  'Eventos de hoje'
),
(
  'proximos_eventos',
  ARRAY[
    'próximos eventos', 'proximos eventos', 'agenda da semana', 'eventos da semana',
    'o que vem', 'próximas reuniões', 'proximas reunioes', 'agenda futura',
    'compromissos futuros', 'o que tá marcado', 'o que ta marcado',
    'próximos compromissos', 'proximos compromissos'
  ],
  'Próximos eventos',
  NULL,
  'Eventos futuros'
);

-- ========================================
-- DASHBOARD E RELATÓRIOS
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
(
  'resumo_dashboard',
  ARRAY[
    'dashboard', 'resumo geral', 'visão geral', 'visao geral', 'resumo do sistema',
    'panorama', 'overview', 'resumo completo', 'situação geral', 'situacao geral',
    'me mostra tudo', 'dados gerais', 'informações gerais', 'informacoes gerais'
  ],
  'Dashboard geral',
  NULL,
  'Resumo do dashboard'
);

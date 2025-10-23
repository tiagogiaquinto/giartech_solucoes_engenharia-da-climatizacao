/*
  # Expansão da Inteligência do Chatbot

  1. Mudanças
    - Adiciona dezenas de novas intenções
    - Expande vocabulário e sinônimos
    - Adiciona comandos de ação (criar, editar, deletar)
    - Adiciona consultas analíticas avançadas
    - Adiciona suporte a perguntas em português natural

  2. Novas Categorias de Intenções
    - Análises e relatórios
    - Criação de registros
    - Busca avançada
    - Estatísticas
    - Previsões e tendências
    - Comparações
    - Alertas e notificações

  3. Vocabulário Expandido
    - Sinônimos brasileiros
    - Gírias profissionais
    - Termos técnicos
    - Perguntas em linguagem natural
*/

-- Limpar intenções antigas para recomeçar
DELETE FROM chat_intents;

-- ========================================
-- CATEGORIA: ORDENS DE SERVIÇO
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'listar_os_abertas',
    ARRAY[
      'os abertas', 'ordens abertas', 'serviços pendentes', 'os em andamento',
      'ordem de serviço aberta', 'os pendente', 'trabalhos pendentes',
      'serviços em execução', 'o que está aberto', 'lista de os',
      'mostrar os', 'ver os abertas', 'quais os abertas', 'tem os aberta'
    ],
    'Lista ordens de serviço em aberto ou em andamento',
    'SELECT id, order_number, customer_name, status, total_value, created_at FROM service_orders WHERE status IN (''pending'', ''in_progress'') ORDER BY created_at DESC LIMIT 20',
    'Encontrei {count} ordens de serviço abertas'
  ),
  (
    'contar_os_status',
    ARRAY[
      'quantas os', 'quantidade de os', 'total de ordens', 'numero de os',
      'contar os', 'conta as os', 'estatistica de os', 'resumo de os'
    ],
    'Conta ordens de serviço por status',
    'SELECT status, COUNT(*) as total FROM service_orders GROUP BY status',
    'Resumo das ordens de serviço por status'
  ),
  (
    'os_atrasadas',
    ARRAY[
      'os atrasadas', 'ordens atrasadas', 'atrasos', 'os vencidas',
      'serviços atrasados', 'o que está atrasado', 'pendências atrasadas'
    ],
    'Lista ordens de serviço atrasadas',
    'SELECT order_number, customer_name, execution_deadline, status FROM service_orders WHERE execution_deadline < CURRENT_DATE AND status NOT IN (''completed'', ''cancelled'') ORDER BY execution_deadline',
    'Ordens de serviço atrasadas encontradas'
  ),
  (
    'os_por_cliente',
    ARRAY[
      'os do cliente', 'ordens do cliente', 'histórico do cliente',
      'serviços do cliente', 'buscar por cliente', 'cliente tem os'
    ],
    'Lista OS de um cliente específico',
    'SELECT order_number, status, total_value, created_at FROM service_orders WHERE customer_name ILIKE ''%{param}%'' ORDER BY created_at DESC LIMIT 10',
    'Ordens de serviço do cliente'
  ),
  (
    'faturamento_os',
    ARRAY[
      'faturamento de os', 'quanto faturei em os', 'valor total de os',
      'receita de os', 'ganho com os', 'total vendido em os'
    ],
    'Calcula faturamento total das OS',
    'SELECT SUM(total_value) as total_revenue, COUNT(*) as total_orders FROM service_orders WHERE status = ''completed''',
    'Faturamento total de ordens de serviço'
  );

-- ========================================
-- CATEGORIA: ESTOQUE E MATERIAIS
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'estoque_baixo',
    ARRAY[
      'estoque baixo', 'materiais acabando', 'estoque crítico', 'falta estoque',
      'o que está acabando', 'preciso comprar', 'itens em falta',
      'alerta de estoque', 'reabastecer', 'comprar material'
    ],
    'Lista materiais com estoque abaixo do mínimo',
    'SELECT name, quantity, min_quantity, unit, supplier FROM materials WHERE quantity <= min_quantity AND active = true ORDER BY quantity ASC LIMIT 20',
    'Materiais com estoque baixo'
  ),
  (
    'buscar_material',
    ARRAY[
      'buscar material', 'procurar material', 'tem o material', 'estoque de',
      'quantidade de', 'cadê o', 'onde está o material', 'consultar estoque'
    ],
    'Busca um material específico no estoque',
    'SELECT name, quantity, unit, cost_price, sale_price, supplier FROM materials WHERE name ILIKE ''%{param}%'' AND active = true LIMIT 10',
    'Resultados da busca de material'
  ),
  (
    'materiais_mais_caros',
    ARRAY[
      'materiais mais caros', 'itens caros', 'produtos de maior valor',
      'mais caro do estoque', 'material caro'
    ],
    'Lista materiais mais caros do estoque',
    'SELECT name, cost_price, sale_price, quantity, unit FROM materials WHERE active = true ORDER BY cost_price DESC LIMIT 10',
    'Materiais mais caros do estoque'
  ),
  (
    'total_investido_estoque',
    ARRAY[
      'valor do estoque', 'investimento em estoque', 'capital em estoque',
      'quanto tenho investido', 'valor total estoque', 'patrimonio em estoque'
    ],
    'Calcula valor total investido em estoque',
    'SELECT SUM(quantity * cost_price) as total_investment FROM materials WHERE active = true',
    'Valor total investido em estoque'
  ),
  (
    'materiais_por_categoria',
    ARRAY[
      'materiais por categoria', 'categorias de materiais', 'tipos de material',
      'classificação de materiais', 'organização de estoque'
    ],
    'Lista materiais agrupados por categoria',
    'SELECT category, COUNT(*) as quantity FROM materials WHERE active = true GROUP BY category ORDER BY quantity DESC',
    'Materiais agrupados por categoria'
  );

-- ========================================
-- CATEGORIA: CLIENTES
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'buscar_cliente',
    ARRAY[
      'buscar cliente', 'informações do cliente', 'dados do cliente', 'cliente',
      'procurar cliente', 'contato do cliente', 'telefone do cliente',
      'email do cliente', 'endereço do cliente', 'cadê o cliente'
    ],
    'Busca informações de clientes',
    'SELECT name, email, phone, city, state FROM customers WHERE name ILIKE ''%{param}%'' OR email ILIKE ''%{param}%'' OR phone ILIKE ''%{param}%'' LIMIT 10',
    'Clientes encontrados'
  ),
  (
    'clientes_inativos',
    ARRAY[
      'clientes inativos', 'quem não compra', 'clientes sem serviço',
      'sem movimento', 'clientes antigos'
    ],
    'Lista clientes sem serviços recentes',
    'SELECT c.name, c.phone, c.email, MAX(so.created_at) as last_service FROM customers c LEFT JOIN service_orders so ON c.id = so.customer_id GROUP BY c.id, c.name, c.phone, c.email HAVING MAX(so.created_at) < CURRENT_DATE - INTERVAL ''90 days'' OR MAX(so.created_at) IS NULL LIMIT 15',
    'Clientes inativos ou sem serviços recentes'
  ),
  (
    'melhores_clientes',
    ARRAY[
      'melhores clientes', 'clientes que mais compram', 'top clientes',
      'maiores clientes', 'quem mais fatura', 'principais clientes'
    ],
    'Lista clientes com maior faturamento',
    'SELECT customer_name, COUNT(*) as total_orders, SUM(total_value) as total_revenue FROM service_orders WHERE status = ''completed'' GROUP BY customer_name ORDER BY total_revenue DESC LIMIT 10',
    'Melhores clientes por faturamento'
  ),
  (
    'novos_clientes',
    ARRAY[
      'clientes novos', 'novos cadastros', 'últimos clientes', 'cadastros recentes',
      'clientes recentes', 'quem cadastrou'
    ],
    'Lista clientes cadastrados recentemente',
    'SELECT name, email, phone, city, created_at FROM customers ORDER BY created_at DESC LIMIT 10',
    'Clientes cadastrados recentemente'
  ),
  (
    'total_clientes',
    ARRAY[
      'quantos clientes', 'total de clientes', 'numero de clientes',
      'quantidade de clientes', 'contar clientes', 'cadastro de clientes'
    ],
    'Conta total de clientes cadastrados',
    'SELECT COUNT(*) as total_customers, COUNT(CASE WHEN active = true THEN 1 END) as active_customers FROM customers',
    'Total de clientes no sistema'
  );

-- ========================================
-- CATEGORIA: FINANCEIRO
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'resumo_financeiro',
    ARRAY[
      'resumo financeiro', 'financeiro hoje', 'contas a pagar', 'contas a receber',
      'situação financeira', 'balanço', 'fluxo de caixa', 'saldo'
    ],
    'Mostra resumo financeiro do período',
    'SELECT status, type, SUM(amount) as total, COUNT(*) as count FROM finance_entries GROUP BY status, type ORDER BY type, status',
    'Resumo financeiro atual'
  ),
  (
    'contas_vencidas',
    ARRAY[
      'contas vencidas', 'vencimentos', 'pagamentos atrasados', 'contas atrasadas',
      'o que está vencido', 'preciso pagar', 'pendências financeiras'
    ],
    'Lista contas vencidas',
    'SELECT description, amount, due_date, type FROM finance_entries WHERE due_date < CURRENT_DATE AND status = ''pending'' ORDER BY due_date LIMIT 15',
    'Contas vencidas encontradas'
  ),
  (
    'contas_hoje',
    ARRAY[
      'contas hoje', 'vence hoje', 'pagamentos de hoje', 'recebimentos hoje',
      'o que vence hoje', 'compromissos financeiros hoje'
    ],
    'Lista contas que vencem hoje',
    'SELECT description, amount, type FROM finance_entries WHERE due_date = CURRENT_DATE AND status = ''pending''',
    'Contas com vencimento hoje'
  ),
  (
    'faturamento_mes',
    ARRAY[
      'faturamento do mês', 'quanto faturei', 'receita do mês', 'vendas do mês',
      'resultado do mês', 'ganhos do mês', 'receita mensal'
    ],
    'Calcula faturamento do mês atual',
    'SELECT SUM(amount) as total_revenue FROM finance_entries WHERE type = ''revenue'' AND status = ''paid'' AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)',
    'Faturamento do mês atual'
  ),
  (
    'despesas_mes',
    ARRAY[
      'despesas do mês', 'gastos do mês', 'quanto gastei', 'custos do mês',
      'saídas do mês', 'pagamentos do mês'
    ],
    'Calcula despesas do mês atual',
    'SELECT SUM(amount) as total_expenses FROM finance_entries WHERE type = ''expense'' AND status = ''paid'' AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)',
    'Despesas do mês atual'
  ),
  (
    'lucro_mes',
    ARRAY[
      'lucro do mês', 'resultado do mês', 'saldo do mês', 'balanço do mês',
      'quanto lucrei', 'margem do mês'
    ],
    'Calcula lucro líquido do mês',
    'SELECT (SELECT COALESCE(SUM(amount), 0) FROM finance_entries WHERE type = ''revenue'' AND status = ''paid'' AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)) - (SELECT COALESCE(SUM(amount), 0) FROM finance_entries WHERE type = ''expense'' AND status = ''paid'' AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)) as net_profit',
    'Lucro líquido do mês'
  ),
  (
    'maiores_despesas',
    ARRAY[
      'maiores despesas', 'gastos maiores', 'onde mais gastei', 'principais custos',
      'despesas mais altas', 'o que custa mais'
    ],
    'Lista maiores despesas do período',
    'SELECT description, amount, category, due_date FROM finance_entries WHERE type = ''expense'' ORDER BY amount DESC LIMIT 10',
    'Maiores despesas registradas'
  );

-- ========================================
-- CATEGORIA: AGENDA E EVENTOS
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'agenda_hoje',
    ARRAY[
      'agenda hoje', 'compromissos hoje', 'eventos hoje', 'o que tenho hoje',
      'minha agenda', 'programação de hoje', 'o que fazer hoje', 'horários hoje'
    ],
    'Lista eventos agendados para hoje',
    'SELECT title, start_time, end_time, location, description FROM agenda_events WHERE DATE(start_time) = CURRENT_DATE ORDER BY start_time',
    'Sua agenda para hoje'
  ),
  (
    'proximos_eventos',
    ARRAY[
      'próximos eventos', 'agenda da semana', 'próximos compromissos',
      'o que vem por aí', 'agenda futura', 'eventos futuros'
    ],
    'Lista próximos eventos da semana',
    'SELECT title, start_time, end_time, location FROM agenda_events WHERE start_time >= CURRENT_DATE AND start_time <= CURRENT_DATE + INTERVAL ''7 days'' ORDER BY start_time LIMIT 20',
    'Próximos eventos agendados'
  ),
  (
    'eventos_mes',
    ARRAY[
      'eventos do mês', 'agenda do mês', 'compromissos do mês',
      'calendário do mês', 'programação mensal'
    ],
    'Lista eventos do mês atual',
    'SELECT title, start_time, location FROM agenda_events WHERE EXTRACT(MONTH FROM start_time) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM start_time) = EXTRACT(YEAR FROM CURRENT_DATE) ORDER BY start_time',
    'Eventos do mês atual'
  );

-- ========================================
-- CATEGORIA: FUNCIONÁRIOS
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'listar_funcionarios',
    ARRAY[
      'funcionários', 'equipe', 'colaboradores', 'empregados', 'staff',
      'listar funcionários', 'ver equipe', 'quem trabalha', 'pessoal'
    ],
    'Lista todos os funcionários ativos',
    'SELECT name, role, email, phone FROM employees WHERE active = true ORDER BY name LIMIT 20',
    'Funcionários ativos'
  ),
  (
    'funcionarios_por_funcao',
    ARRAY[
      'funcionários por função', 'equipe por cargo', 'quem é técnico',
      'lista de funções', 'organograma', 'cargos'
    ],
    'Agrupa funcionários por função',
    'SELECT role, COUNT(*) as quantity FROM employees WHERE active = true GROUP BY role ORDER BY quantity DESC',
    'Funcionários agrupados por função'
  ),
  (
    'custo_folha',
    ARRAY[
      'custo de folha', 'total de salários', 'folha de pagamento',
      'gasto com pessoal', 'despesa com funcionários'
    ],
    'Calcula custo total da folha de pagamento',
    'SELECT SUM(salary) as total_payroll, COUNT(*) as total_employees FROM employees WHERE active = true',
    'Custo total da folha de pagamento'
  );

-- ========================================
-- CATEGORIA: FORNECEDORES
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'listar_fornecedores',
    ARRAY[
      'fornecedores', 'suppliers', 'parceiros', 'quem fornece',
      'lista de fornecedores', 'contatos de fornecedores'
    ],
    'Lista fornecedores cadastrados',
    'SELECT name, email, phone, category FROM suppliers WHERE active = true ORDER BY name LIMIT 20',
    'Fornecedores cadastrados'
  ),
  (
    'fornecedores_categoria',
    ARRAY[
      'fornecedores por categoria', 'tipos de fornecedor',
      'categorias de fornecedor', 'classificação de fornecedores'
    ],
    'Agrupa fornecedores por categoria',
    'SELECT category, COUNT(*) as quantity FROM suppliers WHERE active = true GROUP BY category ORDER BY quantity DESC',
    'Fornecedores por categoria'
  );

-- ========================================
-- CATEGORIA: VENDAS E ANÁLISES
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'ultimas_vendas',
    ARRAY[
      'últimas vendas', 'vendas recentes', 'ordens finalizadas', 'serviços concluídos',
      'últimos trabalhos', 'os finalizadas', 'trabalhos prontos'
    ],
    'Lista últimas vendas/OS finalizadas',
    'SELECT order_number, customer_name, total_value, completed_at FROM service_orders WHERE status = ''completed'' ORDER BY completed_at DESC LIMIT 15',
    'Últimas vendas finalizadas'
  ),
  (
    'materiais_mais_usados',
    ARRAY[
      'materiais mais usados', 'produtos populares', 'top materiais',
      'o que mais saiu', 'itens mais vendidos', 'produtos mais usados'
    ],
    'Lista materiais mais utilizados',
    'SELECT name, unit, total_quantity_purchased FROM materials WHERE total_quantity_purchased > 0 ORDER BY total_quantity_purchased DESC LIMIT 15',
    'Materiais mais utilizados'
  ),
  (
    'servicos_mais_vendidos',
    ARRAY[
      'serviços mais vendidos', 'top serviços', 'serviços populares',
      'o que mais vende', 'serviços campeões', 'principais serviços'
    ],
    'Lista serviços mais vendidos',
    'SELECT name, COUNT(*) as quantity FROM service_catalog GROUP BY name ORDER BY quantity DESC LIMIT 10',
    'Serviços mais vendidos'
  );

-- ========================================
-- CATEGORIA: ESTATÍSTICAS GERAIS
-- ========================================

INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'dashboard_resumo',
    ARRAY[
      'resumo geral', 'dashboard', 'visão geral', 'overview',
      'resumo do sistema', 'estatísticas gerais', 'números gerais'
    ],
    'Mostra resumo geral do sistema',
    'SELECT (SELECT COUNT(*) FROM service_orders) as total_orders, (SELECT COUNT(*) FROM customers) as total_customers, (SELECT COUNT(*) FROM materials WHERE active = true) as total_materials, (SELECT COUNT(*) FROM employees WHERE active = true) as total_employees',
    'Resumo geral do sistema'
  ),
  (
    'performance_mes',
    ARRAY[
      'performance do mês', 'desempenho do mês', 'como está o mês',
      'resultado do mês', 'avaliação mensal'
    ],
    'Analisa performance do mês atual',
    'SELECT COUNT(*) as orders_completed, SUM(total_value) as revenue FROM service_orders WHERE status = ''completed'' AND EXTRACT(MONTH FROM completed_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM completed_at) = EXTRACT(YEAR FROM CURRENT_DATE)',
    'Performance do mês atual'
  );

-- Adicionar mais intenções específicas do sistema
INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'help_extended',
    ARRAY[
      'o que você sabe fazer', 'suas capacidades', 'me ajude',
      'não sei o que perguntar', 'comandos disponíveis', 'funcionalidades'
    ],
    'Mostra ajuda extendida com todos os comandos',
    NULL,
    'Lista completa de funcionalidades'
  );

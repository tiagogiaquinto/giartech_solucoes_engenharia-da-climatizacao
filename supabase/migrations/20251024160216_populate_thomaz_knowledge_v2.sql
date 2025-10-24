/*
  # Popular Conhecimento Completo do Thomaz - V2

  ## Áreas de Conhecimento
  
  1. Funcionalidades do Sistema
  2. Processos de Negócio  
  3. Tutoriais e Guias
  4. Métricas e Análises
  
  ## Estrutura
  - entity_type: tipo de conhecimento
  - entity_name: nome/título
  - properties: conteúdo, keywords, categoria
  - related_entities: relações com outros conceitos
*/

-- =====================================================
-- CONHECIMENTO: Módulos do Sistema
-- =====================================================

INSERT INTO thomaz_knowledge_graph (
  entity_type, entity_name, properties, related_entities, confidence, source
) VALUES
(
  'funcionalidade',
  'Sistema de Ordens de Serviço',
  '{
    "descricao": "Módulo completo para criar, editar e gerenciar ordens de serviço (OS). Inclui dados de cliente, serviços, materiais, equipe e custos. Status: pendente, em andamento, completada, cancelada. Gera PDFs profissionais.",
    "keywords": ["os", "ordem de serviço", "atendimento", "trabalho", "manutenção"],
    "categoria": "modulo_principal",
    "como_usar": "Menu Ordens de Serviço > Nova OS > Preencher dados > Salvar"
  }'::jsonb,
  '{"clientes": "relacionado", "financeiro": "integrado", "estoque": "consome"}'::jsonb,
  0.95,
  'system_core'
),
(
  'funcionalidade',
  'Gestão de Clientes',
  '{
    "descricao": "Cadastro de clientes PF e PJ com dados completos, endereços, documentos e histórico. Busca automática por CNPJ (ReceitaWS) e CEP (ViaCEP). Rastreamento de receita, ticket médio e fidelidade.",
    "keywords": ["cliente", "customer", "pf", "pj", "cadastro"],
    "categoria": "modulo_principal",
    "como_usar": "Menu Clientes > Novo Cliente > Preencher dados > Salvar"
  }'::jsonb,
  '{"os": "gera", "financeiro": "impacta"}'::jsonb,
  0.95,
  'system_core'
),
(
  'funcionalidade',
  'Controle Financeiro',
  '{
    "descricao": "Sistema financeiro completo: receitas, despesas, contas bancárias, categorias, relatórios, DRE, fluxo de caixa. Integrado com OSs completadas. Suporta recorrência de lançamentos.",
    "keywords": ["financeiro", "receita", "despesa", "pagamento", "caixa", "banco"],
    "categoria": "modulo_principal",
    "formulas": {
      "lucro": "receitas - despesas",
      "margem": "(lucro / receitas) × 100%"
    }
  }'::jsonb,
  '{"os": "recebe_de", "dashboard": "alimenta"}'::jsonb,
  0.95,
  'system_core'
),
(
  'funcionalidade',
  'Gestão de Estoque',
  '{
    "descricao": "Controle de materiais, produtos e equipamentos. Rastreia quantidades, custos, preços, fornecedores e movimentações. Alertas de estoque mínimo. Calcula lucro potencial automático.",
    "keywords": ["estoque", "inventário", "material", "produto", "almoxarifado"],
    "categoria": "modulo_principal"
  }'::jsonb,
  '{"os": "fornece_para", "compras": "recebe_de"}'::jsonb,
  0.95,
  'system_core'
),
(
  'funcionalidade',
  'Dashboard Executivo',
  '{
    "descricao": "Métricas em tempo real: receita, lucro, margem, evolução financeira, top 5 clientes, top 5 serviços, KPIs, gráficos comparativos. Atualização automática a cada 24h.",
    "keywords": ["dashboard", "relatório", "kpi", "métrica", "gráfico", "análise"],
    "categoria": "modulo_principal",
    "metricas_disponiveis": [
      "Receita Mensal",
      "Lucro Líquido",
      "Margem de Lucro",
      "Top 5 Clientes",
      "Top 5 Serviços",
      "Taxa de Conversão OS"
    ]
  }'::jsonb,
  '{"financeiro": "consome", "os": "analisa", "clientes": "rankeia"}'::jsonb,
  0.95,
  'system_core'
);

-- =====================================================
-- CONHECIMENTO: Processos de Negócio
-- =====================================================

INSERT INTO thomaz_knowledge_graph (
  entity_type, entity_name, properties, related_entities, confidence, source
) VALUES
(
  'processo',
  'Criação de Ordem de Serviço',
  '{
    "descricao": "Processo completo para criar OS no sistema",
    "passos": [
      "1. Acessar menu Ordens de Serviço",
      "2. Clicar em Nova OS",
      "3. Selecionar ou cadastrar cliente",
      "4. Adicionar serviços do catálogo ou personalizados",
      "5. Configurar materiais necessários",
      "6. Definir equipe responsável",
      "7. Estabelecer prazos e valores",
      "8. Revisar informações",
      "9. Salvar - sistema gera número automático"
    ],
    "keywords": ["criar os", "nova ordem", "abrir os"],
    "resultado": "OS criada com numeração automática NN/AAAA"
  }'::jsonb,
  '{"os": "processo_de", "cliente": "requer"}'::jsonb,
  0.95,
  'business_process'
),
(
  'processo',
  'Ciclo de Vida da OS',
  '{
    "descricao": "Fluxo de status de uma Ordem de Serviço",
    "estados": {
      "PENDENTE": "OS criada, aguardando início dos trabalhos",
      "EM_ANDAMENTO": "Equipe está executando o serviço",
      "COMPLETADA": "Serviço finalizado, aguardando pagamento",
      "CANCELADA": "OS não será realizada"
    },
    "keywords": ["status os", "ciclo", "workflow", "etapa"],
    "rastreamento": "Cada mudança de status é registrada com data e usuário responsável"
  }'::jsonb,
  '{"os": "lifecycle"}'::jsonb,
  0.95,
  'business_process'
),
(
  'processo',
  'Cálculo de Lucratividade',
  '{
    "descricao": "Como o sistema calcula custos e lucros",
    "formulas": {
      "custo_total": "soma de materiais + mão de obra",
      "receita": "valor total da OS",
      "lucro": "receita - custo_total",
      "margem_percentual": "(lucro ÷ receita) × 100"
    },
    "keywords": ["custo", "lucro", "margem", "lucratividade", "cálculo"],
    "atualizacao": "Valores são calculados em tempo real",
    "visualizacao": "Dashboard Executivo e relatórios financeiros"
  }'::jsonb,
  '{"financeiro": "usa", "dashboard": "exibe"}'::jsonb,
  0.95,
  'business_process'
);

-- =====================================================
-- CONHECIMENTO: Tutoriais
-- =====================================================

INSERT INTO thomaz_knowledge_graph (
  entity_type, entity_name, properties, related_entities, confidence, source
) VALUES
(
  'tutorial',
  'Como Buscar um Cliente',
  '{
    "descricao": "Passo a passo para localizar cliente no sistema",
    "passos": [
      "1. Acesse o menu Clientes",
      "2. Use a barra de pesquisa no topo da tela",
      "3. Digite: nome, CNPJ, CPF ou telefone",
      "4. Resultados aparecem em tempo real",
      "5. Clique no cliente para ver detalhes, histórico e gráficos"
    ],
    "keywords": ["buscar cliente", "encontrar cliente", "procurar"],
    "dica": "A busca funciona com termos parciais"
  }'::jsonb,
  '{"clientes": "tutorial_de"}'::jsonb,
  0.95,
  'user_guide'
),
(
  'tutorial',
  'Como Ver Lucro Mensal',
  '{
    "descricao": "Onde consultar lucro do mês",
    "passos": [
      "1. Acesse Dashboard Executivo",
      "2. Veja o card Lucro Líquido (mostra mês atual)",
      "3. Gráfico Lucros Mensais exibe últimos 6 meses",
      "4. Verde indica lucro, vermelho prejuízo"
    ],
    "keywords": ["ver lucro", "consultar lucro", "lucro mensal", "resultado"],
    "informacao": "Valores incluem todas receitas e despesas do período"
  }'::jsonb,
  '{"dashboard": "tutorial_de", "financeiro": "usa_dados_de"}'::jsonb,
  0.95,
  'user_guide'
),
(
  'tutorial',
  'Como Gerar PDF da OS',
  '{
    "descricao": "Gerar documento PDF de Ordem de Serviço",
    "passos": [
      "1. Abra a OS desejada",
      "2. Clique no botão Gerar PDF OS (verde)",
      "3. Escolha formato se houver opções",
      "4. Sistema gera PDF automaticamente",
      "5. Arquivo é baixado no dispositivo"
    ],
    "keywords": ["gerar pdf", "exportar os", "imprimir", "documento"],
    "conteudo_pdf": "Logo, dados empresa/cliente, serviços detalhados, valores, termos"
  }'::jsonb,
  '{"os": "tutorial_de"}'::jsonb,
  0.95,
  'user_guide'
);

-- =====================================================
-- CONHECIMENTO: Métricas e Análises
-- =====================================================

INSERT INTO thomaz_knowledge_graph (
  entity_type, entity_name, properties, related_entities, confidence, source
) VALUES
(
  'metrica',
  'Top 5 Clientes por Receita',
  '{
    "descricao": "Ranking dos 5 clientes que mais geraram receita",
    "calculo": "Soma de OSs completadas por cliente nos últimos 12 meses",
    "keywords": ["top clientes", "melhores clientes", "clientes vip", "ranking"],
    "atualizacao": "Tempo real",
    "uso_recomendado": "Identificar clientes VIP, criar programas de fidelidade, priorizar atendimento"
  }'::jsonb,
  '{"dashboard": "exibe", "clientes": "analisa"}'::jsonb,
  0.95,
  'analytics'
),
(
  'metrica',
  'Top 5 Serviços Mais Lucrativos',
  '{
    "descricao": "Ranking dos serviços com maior receita",
    "calculo": "Soma de itens em OSs completadas × valor unitário (últimos 12 meses)",
    "keywords": ["top serviços", "serviços lucrativos", "melhores serviços"],
    "uso_recomendado": "Focar em serviços rentáveis, ajustar preços, planejar estoque"
  }'::jsonb,
  '{"dashboard": "exibe", "catalogo": "analisa"}'::jsonb,
  0.95,
  'analytics'
),
(
  'metrica',
  'Taxa de Conversão de OS',
  '{
    "descricao": "Percentual de OSs que foram completadas vs criadas",
    "formula": "(OSs completadas ÷ Total de OSs) × 100%",
    "keywords": ["taxa conversão", "eficiência", "aproveitamento"],
    "meta_recomendada": "Acima de 80%",
    "interpretacao": "Valores baixos indicam problemas de execução, cancelamentos excessivos ou orçamentos não aprovados"
  }'::jsonb,
  '{"dashboard": "exibe", "os": "mede"}'::jsonb,
  0.95,
  'analytics'
);

-- =====================================================
-- Garantir permissões
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON thomaz_knowledge_graph TO anon, authenticated;

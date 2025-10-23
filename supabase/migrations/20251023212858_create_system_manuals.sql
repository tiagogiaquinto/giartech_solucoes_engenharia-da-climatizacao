/*
  # Sistema de Manuais Internos

  1. Nova Tabela
    - `system_manuals` - Manuais de uso do sistema
      - `id` (uuid, primary key)
      - `title` (text) - Título do manual
      - `category` (text) - Categoria (OS, Clientes, Financeiro, etc)
      - `topic` (text) - Tópico específico
      - `content` (text) - Conteúdo do manual
      - `keywords` (text[]) - Palavras-chave para busca
      - `order` (integer) - Ordem de exibição
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilita RLS
    - Políticas para acesso anônimo (todos podem ler manuais)
*/

-- Criar tabela de manuais do sistema
CREATE TABLE IF NOT EXISTS system_manuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  topic text NOT NULL,
  content text NOT NULL,
  keywords text[] DEFAULT '{}',
  "order" integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE system_manuals ENABLE ROW LEVEL SECURITY;

-- Políticas: todos podem ler manuais
CREATE POLICY "Permitir leitura de manuais para todos"
  ON system_manuals FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_system_manuals_category ON system_manuals(category);
CREATE INDEX IF NOT EXISTS idx_system_manuals_keywords ON system_manuals USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_system_manuals_active ON system_manuals(active);

-- ========================================
-- POPULAR COM MANUAIS BÁSICOS DO SISTEMA
-- ========================================

-- CATEGORIA: ORDENS DE SERVIÇO
INSERT INTO system_manuals (title, category, topic, content, keywords, "order") VALUES
(
  'Como Criar uma Nova Ordem de Serviço',
  'Ordens de Serviço',
  'Criar OS',
  E'# Como Criar uma Nova Ordem de Serviço\n\n## Passo a Passo:\n\n1. **Acessar o Menu**\n   - Clique em "Ordens de Serviço" no menu lateral\n   - Clique no botão "+ Nova OS"\n\n2. **Dados do Cliente**\n   - Selecione o cliente na lista OU\n   - Clique em "Novo Cliente" para cadastrar\n   - Preencha nome, telefone e endereço\n\n3. **Serviços**\n   - Clique em "Adicionar Serviço"\n   - Escolha o serviço do catálogo OU\n   - Digite um serviço personalizado\n   - Informe quantidade e valor\n\n4. **Materiais (Opcional)**\n   - Clique em "Adicionar Material"\n   - Selecione do estoque\n   - Informe quantidade\n\n5. **Equipe (Opcional)**\n   - Adicione funcionários responsáveis\n   - Defina prazo de execução\n\n6. **Finalizar**\n   - Revise os valores (são calculados automaticamente)\n   - Clique em "Salvar"\n\n✅ Pronto! A OS foi criada com sucesso!',
  ARRAY['criar os', 'nova ordem', 'cadastrar os', 'abrir os', 'como criar'],
  1
),
(
  'Como Editar uma Ordem de Serviço',
  'Ordens de Serviço',
  'Editar OS',
  E'# Como Editar uma Ordem de Serviço\n\n## Passo a Passo:\n\n1. **Localizar a OS**\n   - Vá em "Ordens de Serviço"\n   - Use a busca ou encontre na lista\n   - Clique na OS desejada\n\n2. **Modo de Edição**\n   - Clique no botão "Editar" (ícone de lápis)\n\n3. **O que pode editar:**\n   - Dados do cliente\n   - Adicionar/remover serviços\n   - Adicionar/remover materiais\n   - Modificar equipe\n   - Alterar valores\n   - Mudar status\n\n4. **Salvar Alterações**\n   - Clique em "Salvar Alterações"\n\n⚠️ **IMPORTANTE:**\n- OS concluídas podem ter restrições de edição\n- Alterações ficam registradas no histórico',
  ARRAY['editar os', 'modificar ordem', 'alterar os', 'mudar os'],
  2
),
(
  'Como Finalizar uma Ordem de Serviço',
  'Ordens de Serviço',
  'Finalizar OS',
  E'# Como Finalizar uma Ordem de Serviço\n\n## Passo a Passo:\n\n1. **Abrir a OS**\n   - Localize a OS a ser finalizada\n   - Clique para abrir\n\n2. **Verificar**\n   - Confirme que todos os serviços foram realizados\n   - Verifique se materiais foram registrados\n   - Confira os valores\n\n3. **Alterar Status**\n   - Clique em "Editar"\n   - No campo "Status", selecione "Concluída"\n   - Preencha a data de conclusão (se necessário)\n\n4. **Gerar Documento (Opcional)**\n   - Clique em "Gerar PDF" para criar a OS finalizada\n\n5. **Salvar**\n   - Clique em "Salvar"\n\n✅ A OS está finalizada!\n\n💡 **Dica:** OS finalizadas geram automaticamente:\n- Atualização no estoque (materiais usados)\n- Registro no financeiro (se configurado)',
  ARRAY['finalizar os', 'concluir ordem', 'terminar os', 'completar os'],
  3
);

-- CATEGORIA: CLIENTES
INSERT INTO system_manuals (title, category, topic, content, keywords, "order") VALUES
(
  'Como Cadastrar um Novo Cliente',
  'Clientes',
  'Cadastrar Cliente',
  E'# Como Cadastrar um Novo Cliente\n\n## Passo a Passo:\n\n1. **Acessar Clientes**\n   - Clique em "Clientes" no menu lateral\n   - Clique em "+ Novo Cliente"\n\n2. **Dados Básicos** (obrigatórios)\n   - Nome completo ou Razão Social\n   - CPF ou CNPJ\n   - Telefone principal\n   - Email\n\n3. **Endereço**\n   - Digite o CEP (sistema busca automaticamente)\n   - Confirme ou corrija: Rua, Número, Bairro\n   - Complemento (se houver)\n\n4. **Dados Adicionais** (opcional)\n   - Telefone secundário\n   - Observações\n   - Data de nascimento\n\n5. **Salvar**\n   - Clique em "Cadastrar Cliente"\n\n✅ Cliente cadastrado com sucesso!\n\n💡 **Dicas:**\n- Use a busca de CEP para agilizar\n- Sempre confira CPF/CNPJ\n- Adicione observações importantes',
  ARRAY['cadastrar cliente', 'novo cliente', 'adicionar cliente', 'criar cliente'],
  1
),
(
  'Como Buscar um Cliente',
  'Clientes',
  'Buscar Cliente',
  E'# Como Buscar um Cliente\n\n## Formas de Buscar:\n\n### 1. Busca Rápida\n- No topo da tela, digite:\n  - Nome do cliente\n  - CPF/CNPJ\n  - Telefone\n  - Email\n\n### 2. Filtros\n- Use os filtros para buscar por:\n  - Cidade\n  - Estado\n  - Clientes ativos/inativos\n\n### 3. Lista Alfabética\n- Role a lista de clientes\n- Clique em qualquer cliente para ver detalhes\n\n💡 **Dicas:**\n- A busca funciona com texto parcial\n- Exemplo: "Silva" encontra "João Silva", "Silva Santos", etc.\n- Use o Thomaz: "buscar cliente Silva"',
  ARRAY['buscar cliente', 'procurar cliente', 'encontrar cliente', 'pesquisar cliente'],
  2
);

-- CATEGORIA: ESTOQUE
INSERT INTO system_manuals (title, category, topic, content, keywords, "order") VALUES
(
  'Como Cadastrar Material no Estoque',
  'Estoque',
  'Cadastrar Material',
  E'# Como Cadastrar Material no Estoque\n\n## Passo a Passo:\n\n1. **Acessar Estoque**\n   - Menu lateral → "Estoque"\n   - Clique em "+ Novo Material"\n\n2. **Informações Básicas**\n   - Nome do material\n   - Categoria\n   - Unidade (UN, MT, KG, etc.)\n\n3. **Valores**\n   - Preço de Custo\n   - Preço de Venda\n   - Estoque Mínimo (alerta)\n\n4. **Fornecedor** (opcional)\n   - Selecione o fornecedor\n   - Ou deixe em branco\n\n5. **Salvar**\n   - Clique em "Cadastrar"\n\n✅ Material cadastrado!\n\n💡 **Importante:**\n- Estoque inicial começa em ZERO\n- Use "Entrada de Estoque" para adicionar quantidade',
  ARRAY['cadastrar material', 'novo material', 'adicionar estoque', 'criar material'],
  1
),
(
  'Como Dar Entrada no Estoque',
  'Estoque',
  'Entrada de Estoque',
  E'# Como Dar Entrada no Estoque\n\n## Passo a Passo:\n\n1. **Acessar Material**\n   - Vá em "Estoque"\n   - Localize o material\n   - Clique para abrir\n\n2. **Registrar Entrada**\n   - Clique em "Entrada"\n   - Informe a quantidade\n   - Adicione observação (opcional)\n     - Ex: "Compra fornecedor X"\n     - Ex: "Devolução cliente"\n\n3. **Confirmar**\n   - Clique em "Registrar Entrada"\n\n✅ Estoque atualizado!\n\n💡 **Dica:**\n- O histórico fica registrado\n- Você pode ver todas as movimentações',
  ARRAY['entrada estoque', 'adicionar estoque', 'aumentar estoque', 'compra material'],
  2
);

-- CATEGORIA: FINANCEIRO
INSERT INTO system_manuals (title, category, topic, content, keywords, "order") VALUES
(
  'Como Lançar uma Receita',
  'Financeiro',
  'Lançar Receita',
  E'# Como Lançar uma Receita\n\n## Passo a Passo:\n\n1. **Acessar Financeiro**\n   - Menu → "Financeiro"\n   - Aba "Receitas"\n   - Clique em "+ Nova Receita"\n\n2. **Informações**\n   - Descrição (ex: "Pagamento OS 2025-001")\n   - Valor\n   - Data de Vencimento\n   - Categoria (ex: "Serviços", "Vendas")\n\n3. **Cliente** (opcional)\n   - Vincule a um cliente específico\n\n4. **Status**\n   - "Pendente" = ainda não recebeu\n   - "Pago" = já recebeu\n\n5. **Se já foi pago:**\n   - Marque como "Pago"\n   - Informe a data do pagamento\n   - Selecione conta bancária (opcional)\n\n6. **Salvar**\n   - Clique em "Lançar Receita"\n\n✅ Receita lançada!',
  ARRAY['lançar receita', 'registrar receita', 'entrada dinheiro', 'recebimento'],
  1
),
(
  'Como Lançar uma Despesa',
  'Financeiro',
  'Lançar Despesa',
  E'# Como Lançar uma Despesa\n\n## Passo a Passo:\n\n1. **Acessar Financeiro**\n   - Menu → "Financeiro"\n   - Aba "Despesas"\n   - Clique em "+ Nova Despesa"\n\n2. **Informações**\n   - Descrição (ex: "Compra de materiais")\n   - Valor\n   - Data de Vencimento\n   - Categoria (ex: "Fornecedores", "Salários")\n\n3. **Fornecedor** (opcional)\n   - Vincule a um fornecedor\n\n4. **Status**\n   - "Pendente" = ainda não pagou\n   - "Pago" = já foi pago\n\n5. **Se já foi pago:**\n   - Marque como "Pago"\n   - Informe a data do pagamento\n   - Selecione conta bancária\n\n6. **Recorrência** (opcional)\n   - Marque se é uma despesa recorrente\n   - Ex: Aluguel, internet, etc\n\n7. **Salvar**\n   - Clique em "Lançar Despesa"\n\n✅ Despesa lançada!',
  ARRAY['lançar despesa', 'registrar despesa', 'pagar conta', 'pagamento'],
  2
);

-- CATEGORIA: AGENDA
INSERT INTO system_manuals (title, category, topic, content, keywords, "order") VALUES
(
  'Como Criar um Evento na Agenda',
  'Agenda',
  'Criar Evento',
  E'# Como Criar um Evento na Agenda\n\n## Passo a Passo:\n\n1. **Acessar Agenda**\n   - Menu → "Agenda"\n   - Clique em "+ Novo Evento"\n\n2. **Informações do Evento**\n   - Título (ex: "Reunião com cliente")\n   - Data e hora de início\n   - Data e hora de término\n   - Local (opcional)\n\n3. **Descrição** (opcional)\n   - Adicione detalhes importantes\n   - Observações\n\n4. **Vincular** (opcional)\n   - Cliente\n   - Ordem de Serviço\n   - Funcionário responsável\n\n5. **Salvar**\n   - Clique em "Criar Evento"\n\n✅ Evento agendado!\n\n💡 **Dica:**\n- Eventos aparecem no dashboard\n- Você recebe lembretes',
  ARRAY['criar evento', 'agendar', 'marcar compromisso', 'nova agenda'],
  1
);

-- CATEGORIA: GERAL
INSERT INTO system_manuals (title, category, topic, content, keywords, "order") VALUES
(
  'Como Usar o Thomaz (Assistente IA)',
  'Geral',
  'Thomaz',
  E'# Como Usar o Thomaz - Assistente Inteligente\n\n## O que é o Thomaz?\nThomazé seu assistente pessoal que responde perguntas sobre o sistema!\n\n## Como Acessar:\n- Clique no botão azul no canto inferior direito\n- Ele se chama "🤖 Thomaz"\n\n## O que Perguntar:\n\n### Exemplos Práticos:\n```\n"Como criar uma OS?"\n"Como cadastrar cliente?"\n"Como dar entrada no estoque?"\n"Como lançar uma receita?"\n"Explica como finalizar OS"\n```\n\n### Dados do Sistema:\n```\n"Quantas OS abertas?"\n"Quem são os melhores clientes?"\n"Tá faltando material?"\n"Quanto faturei esse mês?"\n```\n\n### Linguagem Natural:\n```\n"E aí, como tá indo?"\n"Tamo lucrando?"\n"Quem deve dinheiro?"\n```\n\n## Dicas:\n✅ Fale naturalmente\n✅ Use gírias à vontade\n✅ Seja direto ou detalhado\n✅ Pergunte "ajuda" para ver tudo que ele faz\n\n💡 Thomaz entende VOCÊ!',
  ARRAY['thomaz', 'assistente', 'ia', 'ajuda', 'chatbot', 'como usar'],
  1
),
(
  'Como Navegar pelo Sistema',
  'Geral',
  'Navegação',
  E'# Como Navegar pelo Sistema\n\n## Menu Lateral (Esquerda)\n\n### Principais Seções:\n- 📊 **Dashboard** → Visão geral\n- 📋 **Ordens de Serviço** → Gerenciar OS\n- 👥 **Clientes** → Cadastro de clientes\n- 📦 **Estoque** → Controle de materiais\n- 💰 **Financeiro** → Receitas e despesas\n- 📅 **Agenda** → Eventos e compromissos\n- 👨‍💼 **Funcionários** → Equipe\n- 🏭 **Fornecedores** → Parceiros\n\n## Menu Superior (Direita)\n- 🔔 Notificações\n- 👤 Seu perfil\n- ⚙️ Configurações\n\n## Busca Rápida\n- Use o campo de busca no topo\n- Funciona em qualquer tela\n\n## Atalhos:\n- **Thomaz** → Pergunte qualquer coisa!\n- **ESC** → Fecha modais\n- **ENTER** → Confirma ações\n\n💡 Explore à vontade, é intuitivo!',
  ARRAY['navegar', 'menu', 'onde fica', 'como acessar', 'navegação'],
  2
);

-- Adicionar intenções do Thomaz para manuais
INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
(
  'ajuda_sistema',
  ARRAY[
    'como criar os', 'como cadastrar cliente', 'como usar', 'manual de',
    'ajuda com', 'tutorial de', 'como fazer', 'explica como',
    'me ensina', 'como funciona', 'passo a passo', 'guia de'
  ],
  'Busca manuais do sistema para ajudar usuários',
  NULL,
  'Manual do sistema encontrado'
),
(
  'listar_manuais',
  ARRAY[
    'lista de manuais', 'quais manuais', 'manuais disponíveis',
    'tutoriais disponíveis', 'o que tem de ajuda', 'guias do sistema'
  ],
  'Lista todos os manuais disponíveis do sistema',
  NULL,
  'Manuais do sistema disponíveis'
);

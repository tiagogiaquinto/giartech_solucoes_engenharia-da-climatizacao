/*
  # Base de Conhecimento Completa do Thomaz

  1. Novas Tabelas
    - `knowledge_base` - Base de conhecimento com artigos, manuais, dicas
    - `knowledge_categories` - Categorias de conhecimento
    - `knowledge_tags` - Tags para busca
    - `knowledge_search_history` - Histórico de buscas para melhorar IA
    
  2. Funcionalidades
    - Busca semântica de conhecimento
    - Sugestões inteligentes
    - Ranking de relevância
    - Aprendizado de padrões
*/

-- Categorias de conhecimento
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT '📚',
  created_at timestamptz DEFAULT now()
);

-- Base de conhecimento
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  keywords text[] DEFAULT '{}',
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  view_count int DEFAULT 0,
  helpful_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_keywords ON knowledge_base USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_kb_title ON knowledge_base USING gin(to_tsvector('portuguese', title));
CREATE INDEX IF NOT EXISTS idx_kb_content ON knowledge_base USING gin(to_tsvector('portuguese', content));

-- Histórico de buscas
CREATE TABLE IF NOT EXISTS knowledge_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query text NOT NULL,
  results_found int DEFAULT 0,
  article_clicked uuid REFERENCES knowledge_base(id) ON DELETE SET NULL,
  was_helpful boolean,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_query ON knowledge_search_history(search_query);
CREATE INDEX IF NOT EXISTS idx_search_created ON knowledge_search_history(created_at DESC);

-- RLS
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público a categorias" ON knowledge_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público a base de conhecimento" ON knowledge_base FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público a histórico" ON knowledge_search_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================
-- POPULAR BASE DE CONHECIMENTO
-- ============================================

-- Categorias
INSERT INTO knowledge_categories (name, description, icon) VALUES
('Ordens de Serviço', 'Tudo sobre criação, gestão e execução de OS', '📋'),
('Clientes', 'Cadastro, relacionamento e gestão de clientes', '👥'),
('Financeiro', 'Gestão financeira, fluxo de caixa, análises', '💰'),
('Estoque', 'Controle de materiais, inventário, compras', '📦'),
('Equipe', 'Gestão de funcionários e recursos humanos', '👷'),
('Análises', 'Indicadores, KPIs, dashboards e relatórios', '📊'),
('Sistema', 'Como usar o sistema, dicas e truques', '⚙️'),
('Estratégia', 'Crescimento, planejamento e decisões estratégicas', '🎯')
ON CONFLICT (name) DO NOTHING;

-- Manuais de OS
INSERT INTO knowledge_base (category_id, title, content, summary, keywords, difficulty_level) VALUES
(
  (SELECT id FROM knowledge_categories WHERE name = 'Ordens de Serviço'),
  'Como Criar uma Ordem de Serviço Completa',
  E'# Passo a Passo para Criar OS\n\n## 1. Acesse o Menu\nClique em "Ordens de Serviço" no menu lateral\n\n## 2. Nova OS\nClique no botão "+ Nova OS"\n\n## 3. Informações Básicas\n- **Cliente**: Selecione ou cadastre novo cliente\n- **Data**: Data de criação (automática)\n- **Prazo**: Defina prazo de execução\n- **Prioridade**: Baixa, Média, Alta ou Urgente\n\n## 4. Serviços\n- Adicione serviços do catálogo\n- Ou crie serviços personalizados\n- Defina quantidades e valores\n\n## 5. Materiais\n- Selecione materiais do estoque\n- Defina quantidades necessárias\n- Sistema calcula custos automaticamente\n\n## 6. Equipe\n- Adicione funcionários responsáveis\n- Defina horas estimadas por pessoa\n- Sistema calcula custo de mão de obra\n\n## 7. Custos Adicionais\n- Transporte\n- Alimentação\n- Hospedagem\n- Ferramentas especiais\n\n## 8. Finalizar\n- Revise todos os dados\n- Clique em "Salvar"\n- OS recebe número automático\n\n## Dicas Importantes\n✅ Sempre preencha descrição detalhada\n✅ Anexe fotos quando possível\n✅ Defina prazos realistas\n✅ Revise custos antes de salvar',
  'Tutorial completo para criar ordens de serviço',
  ARRAY['os', 'criar', 'nova', 'ordem', 'serviço', 'tutorial', 'passo a passo'],
  'beginner'
),
(
  (SELECT id FROM knowledge_categories WHERE name = 'Ordens de Serviço'),
  'Gestão de OS: Da Abertura ao Fechamento',
  E'# Ciclo Completo de uma OS\n\n## Status de OS\n\n### 1. Pendente\n- OS criada, aguardando início\n- Aloque equipe e materiais\n- Planeje execução\n\n### 2. Em Andamento\n- Serviço sendo executado\n- Atualize progresso regularmente\n- Registre ocorrências\n\n### 3. Em Revisão\n- Serviço concluído, aguardando aprovação\n- Cliente avalia qualidade\n- Possíveis ajustes\n\n### 4. Concluída\n- Serviço aprovado e finalizado\n- Gera faturamento\n- Histórico do cliente atualizado\n\n### 5. Cancelada\n- OS não executada\n- Registre motivo\n- Não gera faturamento\n\n## Boas Práticas\n- Atualize status em tempo real\n- Documente tudo com fotos\n- Comunique cliente sempre\n- Registre tempo real gasto\n- Compare estimado vs real',
  'Gestão completa do ciclo de vida das OS',
  ARRAY['os', 'gestão', 'status', 'ciclo', 'execução', 'controle'],
  'intermediate'
);

-- Manuais de Clientes
INSERT INTO knowledge_base (category_id, title, content, summary, keywords, difficulty_level) VALUES
(
  (SELECT id FROM knowledge_categories WHERE name = 'Clientes'),
  'Como Cadastrar Clientes Corretamente',
  E'# Cadastro Completo de Clientes\n\n## Dados Obrigatórios\n- Nome/Razão Social\n- CPF ou CNPJ\n- Telefone\n- Email\n\n## Dados Recomendados\n- Endereço completo com CEP\n- Data de nascimento\n- RG\n- Observações importantes\n\n## Busca Automática\nAo digitar CEP:\n✅ Rua preenchida automaticamente\n✅ Bairro identificado\n✅ Cidade e UF carregados\n\nAo digitar CNPJ:\n✅ Razão Social buscada\n✅ Nome fantasia preenchido\n✅ Endereço completo\n\n## Histórico do Cliente\nO sistema registra automaticamente:\n- Todas as OS do cliente\n- Valor total gasto\n- Frequência de compras\n- Ticket médio\n- Última compra\n\n## Dicas\n✅ Sempre confirme dados com cliente\n✅ Mantenha observações atualizadas\n✅ Cadastre preferências especiais',
  'Guia completo de cadastro de clientes',
  ARRAY['cliente', 'cadastro', 'cpf', 'cnpj', 'dados', 'registro'],
  'beginner'
);

-- Manuais Financeiros
INSERT INTO knowledge_base (category_id, title, content, summary, keywords, difficulty_level) VALUES
(
  (SELECT id FROM knowledge_categories WHERE name = 'Financeiro'),
  'Entendendo o Fluxo de Caixa',
  E'# Fluxo de Caixa: Guia Completo\n\n## O Que É?\nFluxo de caixa é o registro de todas as entradas e saídas de dinheiro da empresa.\n\n## Tipos de Entrada\n- 💰 Recebimento de OS\n- 💰 Vendas de produtos\n- 💰 Recebimento de parcelas\n- 💰 Outras receitas\n\n## Tipos de Saída\n- 💸 Pagamento de fornecedores\n- 💸 Salários e encargos\n- 💸 Aluguel e contas\n- 💸 Impostos\n- 💸 Outras despesas\n\n## Como Analisar\n\n### Saldo Atual\n= Total Entradas - Total Saídas\n\n### Projeção Futura\nOlhe contas a receber e a pagar\n\n### Índices Importantes\n- Liquidez (pode pagar contas?)\n- Capital de giro (reserva disponível)\n- Margem de segurança\n\n## Boas Práticas\n✅ Registre TUDO imediatamente\n✅ Categorize corretamente\n✅ Concilie com banco diariamente\n✅ Projete 30-60-90 dias\n✅ Mantenha reserva de emergência',
  'Entenda e domine seu fluxo de caixa',
  ARRAY['financeiro', 'fluxo', 'caixa', 'dinheiro', 'entrada', 'saída', 'saldo'],
  'intermediate'
),
(
  (SELECT id FROM knowledge_categories WHERE name = 'Financeiro'),
  'Como Calcular e Melhorar Seu ROI',
  E'# ROI: Retorno Sobre Investimento\n\n## Fórmula\nROI = (Lucro - Investimento) / Investimento × 100\n\n## Exemplo Prático\nInvestimento: R$ 10.000\nLucro Total: R$ 15.000\nROI = (15.000 - 10.000) / 10.000 × 100 = 50%\n\nSignificado: Cada R$ 1 investido retornou R$ 1,50\n\n## ROI por Tipo\n\n### ROI de Marketing\nInvestiu R$ 1.000 em anúncios\nGerou R$ 5.000 em vendas\nROI = 400%\n\n### ROI de Equipamento\nComprou ferramenta por R$ 3.000\nEconomizou R$ 1.000/mês em serviços\nROI em 3 meses\n\n### ROI de Treinamento\nTreinamento R$ 500\nAumento de produtividade: R$ 2.000/mês\nROI em 2 semanas\n\n## Como Melhorar ROI\n1. Reduza custos operacionais\n2. Aumente ticket médio\n3. Melhore taxa de conversão\n4. Fidelize clientes\n5. Elimine desperdícios\n\n## Meta Ideal\nROI acima de 100% = Investimento positivo\nROI acima de 200% = Excelente\nROI acima de 500% = Extraordinário',
  'Aprenda a calcular e otimizar seu ROI',
  ARRAY['roi', 'retorno', 'investimento', 'lucro', 'análise', 'financeiro'],
  'advanced'
);

-- Manuais de Estoque
INSERT INTO knowledge_base (category_id, title, content, summary, keywords, difficulty_level) VALUES
(
  (SELECT id FROM knowledge_categories WHERE name = 'Estoque'),
  'Controle de Estoque Eficiente',
  E'# Gestão de Estoque: Guia Prático\n\n## Conceitos Básicos\n\n### Estoque Mínimo\nQuantidade mínima antes de comprar mais\nEvita falta de material\n\n### Estoque Máximo\nQuantidade máxima a manter\nEvita capital parado\n\n### Ponto de Pedido\nQuando atingir, faça nova compra\n\n## Cálculo de Necessidade\n\n### Consumo Médio Mensal\nSoma últimos 3 meses ÷ 3\n\n### Lead Time\nTempo entre pedido e entrega\n\n### Estoque de Segurança\nReserva para imprevistos (10-20%)\n\n## Movimentações\n\n### Entrada\n- Compras de fornecedores\n- Devolução de clientes\n- Ajuste de inventário\n\n### Saída\n- Uso em OS\n- Vendas diretas\n- Perdas/quebras\n\n## Inventário\nFaça contagem física:\n- Mensal: produtos A (alto giro)\n- Trimestral: produtos B (médio giro)\n- Semestral: produtos C (baixo giro)\n\n## Indicadores\n- Giro de estoque = Vendas / Estoque médio\n- Cobertura = Estoque / Consumo médio\n- Acuracidade = Físico / Sistema × 100',
  'Domine a gestão de estoque',
  ARRAY['estoque', 'material', 'inventário', 'controle', 'reposição'],
  'intermediate'
);

-- Análises e Indicadores
INSERT INTO knowledge_base (category_id, title, content, summary, keywords, difficulty_level) VALUES
(
  (SELECT id FROM knowledge_categories WHERE name = 'Análises'),
  'Dashboard Executivo: Como Interpretar',
  E'# Interpretando o Dashboard\n\n## Indicadores Principais\n\n### Faturamento\nValor total de vendas no período\n📈 Crescendo = Bom\n📉 Caindo = Atenção\n\n### Lucro\nFaturamento - Custos\n💚 Positivo = Lucrativo\n❌ Negativo = Prejuízo\n\n### Margem\nLucro ÷ Faturamento × 100\n✅ > 30% = Excelente\n⚠️ 15-30% = Bom\n❌ < 15% = Ajuste necessário\n\n### Ticket Médio\nFaturamento ÷ Número de OS\nAumentar = Mais valor por serviço\n\n### Taxa de Conversão\nOS fechadas ÷ Propostas × 100\n✅ > 50% = Ótimo\n⚠️ 30-50% = Bom\n❌ < 30% = Melhorar\n\n## Tendências\n\n### Gráficos de Linha\nMostram evolução temporal\nProcure padrões e sazonalidade\n\n### Gráficos de Pizza\nMostram composição/participação\nIdentifique maiores fatias\n\n### Gráficos de Barra\nComparam categorias\nVeja melhores e piores\n\n## Ações Baseadas em Dados\n- Faturamento baixo? Faça promoções\n- Margem baixa? Revise custos\n- Conversão baixa? Melhore atendimento\n- Estoque alto? Liquidação',
  'Aprenda a ler e agir com base nos indicadores',
  ARRAY['dashboard', 'análise', 'indicador', 'kpi', 'métrica', 'gráfico'],
  'advanced'
);

-- Estratégia e Crescimento
INSERT INTO knowledge_base (category_id, title, content, summary, keywords, difficulty_level) VALUES
(
  (SELECT id FROM knowledge_categories WHERE name = 'Estratégia'),
  'Estratégias para Crescer Seu Negócio',
  E'# Crescimento Sustentável\n\n## 1. Aumente Ticket Médio\n\n### Como:\n- Ofereça serviços complementares\n- Crie pacotes/combos\n- Upsell (produto premium)\n- Cross-sell (produtos relacionados)\n\n### Exemplo:\nCliente pede limpeza → Ofereça manutenção preventiva\nTicket R$ 200 → R$ 350 (+75%)\n\n## 2. Fidelize Clientes\n\n### Benefícios:\n- Custa 5x menos que buscar novo\n- Compram mais frequentemente\n- Indicam para conhecidos\n\n### Como:\n- Programa de pontos\n- Descontos para recorrentes\n- Atendimento excepcional\n- Pós-venda ativo\n\n## 3. Otimize Operações\n\n### Áreas:\n- Reduza tempo de execução\n- Padronize processos\n- Elimine retrabalho\n- Automatize tarefas\n\n### Resultado:\nMais OS no mesmo tempo = Mais faturamento\n\n## 4. Expanda Serviços\n\n### Estratégia:\n- Pesquise demanda não atendida\n- Capacite equipe\n- Invista em equipamentos\n- Teste mercado\n\n## 5. Marketing Inteligente\n\n### Invista em:\n- Google Meu Negócio\n- Redes sociais\n- Indicações incentivadas\n- Parcerias locais\n\n### ROI esperado: 300-500%',
  'Estratégias práticas de crescimento',
  ARRAY['crescimento', 'estratégia', 'expansão', 'marketing', 'vendas'],
  'advanced'
);

-- Sistema e Dicas
INSERT INTO knowledge_base (category_id, title, content, summary, keywords, difficulty_level) VALUES
(
  (SELECT id FROM knowledge_categories WHERE name = 'Sistema'),
  'Atalhos e Dicas do Sistema',
  E'# Dicas Para Usar o Sistema Melhor\n\n## Atalhos de Teclado\n- **CTRL + B**: Busca rápida\n- **CTRL + N**: Nova OS\n- **CTRL + S**: Salvar\n- **ESC**: Fechar modal\n\n## Busca Inteligente\n\n### Na barra de busca, digite:\n- Nome do cliente\n- Número da OS\n- CPF/CNPJ\n- Telefone\n- Qualquer palavra-chave\n\n### Filtre por:\n- Status\n- Data\n- Valor\n- Cliente\n\n## Organização\n\n### Use Tags\nCrie tags personalizadas:\n- #urgente\n- #garantia\n- #especial\n\n### Cores e Prioridades\n🔴 Urgente = Fazer AGORA\n🟡 Alta = Hoje\n🟢 Normal = Esta semana\n⚪ Baixa = Quando possível\n\n## Backup Automático\nSistema salva automaticamente:\n✅ A cada edição\n✅ A cada hora\n✅ Diariamente completo\n\n## Acesso Mobile\nUse pelo celular:\n- Consulte OS em campo\n- Tire fotos direto na OS\n- Atualize status em tempo real\n\n## Relatórios Personalizados\nCrie seus próprios relatórios:\n1. Escolha período\n2. Selecione campos\n3. Aplique filtros\n4. Exporte Excel/PDF',
  'Domine o sistema com dicas práticas',
  ARRAY['sistema', 'dicas', 'atalhos', 'tutorial', 'ajuda'],
  'beginner'
);

-- Função de busca semântica melhorada
CREATE OR REPLACE FUNCTION search_knowledge(
  p_query text,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  category_name text,
  title text,
  summary text,
  content text,
  relevance real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kc.name as category_name,
    kb.title,
    kb.summary,
    kb.content,
    (
      ts_rank(to_tsvector('portuguese', kb.title), plainto_tsquery('portuguese', p_query)) * 2.0 +
      ts_rank(to_tsvector('portuguese', kb.content), plainto_tsquery('portuguese', p_query)) +
      CASE 
        WHEN kb.keywords && string_to_array(lower(p_query), ' ') THEN 1.5
        ELSE 0
      END
    )::real as relevance
  FROM knowledge_base kb
  LEFT JOIN knowledge_categories kc ON kb.category_id = kc.id
  WHERE 
    to_tsvector('portuguese', kb.title || ' ' || kb.content) @@ plainto_tsquery('portuguese', p_query)
    OR kb.keywords && string_to_array(lower(p_query), ' ')
  ORDER BY relevance DESC, kb.helpful_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter conhecimento por categoria
CREATE OR REPLACE FUNCTION get_knowledge_by_category(p_category_name text)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  difficulty_level text,
  view_count int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.title,
    kb.summary,
    kb.difficulty_level,
    kb.view_count
  FROM knowledge_base kb
  JOIN knowledge_categories kc ON kb.category_id = kc.id
  WHERE kc.name = p_category_name
  ORDER BY kb.view_count DESC, kb.helpful_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

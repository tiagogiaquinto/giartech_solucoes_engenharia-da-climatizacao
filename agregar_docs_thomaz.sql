-- ========================================
-- AGREGAÇÃO DE DOCUMENTAÇÃO PARA THOMAZ AI
-- Data: 2025-10-28
-- ========================================

-- Limpar dados antigos de documentação (manter apenas registros importantes)
DELETE FROM thomaz_knowledge_base WHERE category = 'system_documentation' AND updated_at < NOW() - INTERVAL '7 days';

-- ========================================
-- 1. CONSOLIDAÇÃO DO MENU FINANCEIRO
-- ========================================
INSERT INTO thomaz_knowledge_base (
  title,
  content,
  category,
  tags,
  metadata
) VALUES (
  'Consolidação do Menu Financeiro - Fase 6',
  '# CONSOLIDAÇÃO DO MENU FINANCEIRO

## Resumo
Reduzimos o menu financeiro de 9 itens para 3 módulos consolidados (67% de redução), organizando funcionalidades relacionadas em abas internas.

## Estrutura Nova
### 💰 Financeiro (/financeiro)
- Dashboard: Visão geral integrada
- Movimentações: Receitas, despesas e DRE
- Análise: EBITDA, ROI, margens
- Contas Bancárias: Gestão de contas
- Categorias: Organização financeira

### 👔 CFO & Executivo (/executivo)
- Dashboard CFO: 20+ KPIs executivos com cards interativos
- Credit Scoring: Análise de risco de clientes
- Metas & Targets: Acompanhamento de objetivos
- Alertas Críticos: Monitoramento

### 📄 Relatórios (/relatorios)
- Dashboards: Relatórios interativos
- PDFs Profissionais: Para impressão
- Customizados: Relatórios personalizados
- Histórico: Relatórios anteriores

## Cards CFO Interativos
Todos os 4 cards principais são funcionais:
1. Receita Total: Detalhes de despesas e lucro
2. EBITDA: Margens bruta, operacional e EBITDA
3. ROI: Break-even, payback e ROI
4. Capital de Giro: Recebíveis, pagáveis e capital líquido

Interações:
- Hover: Animação e sombra
- Click no card: Navega para /financeiro
- Click no (i): Expande/colapsa detalhes
- Trends visuais: ↑ verde (positivo) ou ↓ vermelho (negativo)

## Componentes Criados
- TabContainer.tsx: Sistema de abas reutilizável
- InteractiveKPICard.tsx: Cards interativos
- FinanceiroConsolidado.tsx: Módulo financeiro
- ExecutivoConsolidado.tsx: Módulo executivo
- RelatoriosConsolidado.tsx: Módulo de relatórios
- CreditScoring.tsx: Análise de crédito

## Benefícios
- Menu 67% mais limpo
- Navegação mais intuitiva
- Cards 100% funcionais
- Interface profissional
- Performance otimizada',
  'system_documentation',
  ARRAY['menu', 'financeiro', 'cfo', 'consolidação', 'cards-interativos', 'fase-6'],
  jsonb_build_object(
    'version', '6.0',
    'date', '2025-10-28',
    'status', 'implementado',
    'priority', 'high'
  )
) ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- ========================================
-- 2. ESTRUTURA DO SISTEMA
-- ========================================
INSERT INTO thomaz_knowledge_base (
  title,
  content,
  category,
  tags,
  metadata
) VALUES (
  'Arquitetura Completa do Sistema Giartech',
  '# ARQUITETURA DO SISTEMA GIARTECH

## Stack Tecnológico
- Frontend: React 18 + TypeScript + Vite
- UI: TailwindCSS + Framer Motion
- Backend: Supabase (PostgreSQL + Edge Functions)
- Autenticação: Supabase Auth
- Storage: Supabase Storage

## Estrutura de Pastas
```
src/
├── components/     # Componentes reutilizáveis
│   ├── TabContainer.tsx
│   ├── InteractiveKPICard.tsx
│   └── navigation/
├── pages/         # Páginas da aplicação
│   ├── FinanceiroConsolidado.tsx
│   ├── ExecutivoConsolidado.tsx
│   └── CFODashboard.tsx
├── services/      # Serviços e integrações
├── hooks/         # React hooks customizados
├── utils/         # Funções utilitárias
└── lib/          # Configurações e bibliotecas
```

## Banco de Dados
### Tabelas Principais
- customers: Clientes (PF e PJ)
- service_orders: Ordens de serviço
- service_order_items: Itens das OS
- service_order_materials: Materiais das OS
- service_order_labor: Mão de obra das OS
- finance_entries: Lançamentos financeiros
- financial_categories: Categorias financeiras
- bank_accounts: Contas bancárias
- inventory_items: Itens de estoque
- service_catalog: Catálogo de serviços
- employees: Funcionários
- suppliers: Fornecedores

### Views Importantes
- v_cfo_kpis: KPIs executivos consolidados
- v_customer_credit_scoring: Análise de crédito
- v_customer_intelligence: Inteligência de clientes
- v_business_kpis: KPIs de negócio
- v_financial_dashboard: Dashboard financeiro

### Edge Functions
- thomaz-ai: IA conversacional do Thomaz
- buscar-cep: Busca de endereços
- buscar-cnpj: Busca de CNPJs
- send-email: Envio de emails
- whatsapp-connect: Integração WhatsApp

## Funcionalidades Principais
1. Gestão de Clientes (PF/PJ)
2. Ordens de Serviço (completas)
3. Gestão Financeira (completa)
4. Dashboard CFO (20+ KPIs)
5. Credit Scoring (automático)
6. Catálogo de Serviços
7. Controle de Estoque
8. Gestão de Funcionários
9. WhatsApp CRM
10. Thomaz AI (assistente inteligente)',
  'system_documentation',
  ARRAY['arquitetura', 'estrutura', 'tecnologia', 'banco-dados'],
  jsonb_build_object(
    'version', '6.0',
    'date', '2025-10-28',
    'status', 'atualizado'
  )
) ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- ========================================
-- 3. ROTAS DO SISTEMA
-- ========================================
INSERT INTO thomaz_knowledge_base (
  title,
  content,
  category,
  tags,
  metadata
) VALUES (
  'Mapa Completo de Rotas',
  '# ROTAS DO SISTEMA

## Principais Rotas

### Gestão
- `/` - Início/Dashboard principal
- `/calendar` - Agenda de compromissos
- `/client-management` - Gestão de clientes
- `/suppliers` - Gestão de fornecedores
- `/purchasing` - Compras e pedidos
- `/service-orders` - Ordens de serviço
- `/service-orders/create` - Criar nova OS
- `/service-orders/:id/view` - Visualizar OS
- `/rotas` - Rastreamento de rotas

### Financeiro (Consolidado)
- `/financeiro` - Centro financeiro com 5 abas
  - Dashboard
  - Movimentações
  - Análise
  - Contas Bancárias
  - Categorias

### Executivo (Consolidado)
- `/executivo` - Módulo executivo com 4 abas
  - Dashboard CFO
  - Credit Scoring
  - Metas & Targets
  - Alertas Críticos

### Relatórios (Consolidado)
- `/relatorios` - Módulo de relatórios com 4 abas
  - Dashboards
  - PDFs Profissionais
  - Customizados
  - Histórico

### Operacional
- `/service-catalog` - Catálogo de serviços
- `/inventory` - Controle de estoque
- `/automacoes` - Workflows e automações

### Comunicação
- `/whatsapp-crm` - WhatsApp CRM
- `/email/inbox` - Email corporativo
- `/thomaz` - Thomaz AI chat

### Sistema
- `/digital-library` - Biblioteca digital
- `/funcionarios` - Gestão de funcionários
- `/users` - Gestão de usuários
- `/access-management` - Controle de acessos
- `/audit-logs` - Logs de auditoria
- `/document-templates` - Templates de documentos
- `/visual-customization` - Personalização visual
- `/settings` - Configurações gerais

## Rotas Antigas (Ainda Funcionam)
- `/financial` - Integração financeira (agora em /financeiro)
- `/financial-management` - Gestão financeira (agora em /financeiro)
- `/financial-analysis` - Análise financeira (agora em /financeiro)
- `/dashboard-cfo` - Dashboard CFO (agora em /executivo)
- `/credit-scoring` - Credit scoring (agora em /executivo)
- `/reports` - Relatórios (agora em /relatorios)
- `/relatorios-avancados` - Relatórios avançados (agora em /relatorios)',
  'system_documentation',
  ARRAY['rotas', 'navegação', 'urls', 'menu'],
  jsonb_build_object(
    'version', '6.0',
    'date', '2025-10-28',
    'status', 'atualizado'
  )
) ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- ========================================
-- 4. FUNCIONALIDADES DO CFO DASHBOARD
-- ========================================
INSERT INTO thomaz_knowledge_base (
  title,
  content,
  category,
  tags,
  metadata
) VALUES (
  'CFO Dashboard - Cards Interativos',
  '# CFO DASHBOARD - CARDS INTERATIVOS

## Visão Geral
O Dashboard CFO possui 4 cards principais totalmente funcionais e interativos.

## Card 1: Receita Total 💰
**Cor:** Verde (from-green-500 to-emerald-600)
**Valor Principal:** Receita total do período
**Subtitle:** Lucro líquido
**Trend:** Margem de lucro (%)

### Detalhes Expandíveis
1. Despesas totais
2. Lucro líquido
3. Margem de lucro (%)

### Interações
- Hover: Animação + shadow
- Click no card: Navega para /financeiro
- Click no (i): Expande/colapsa detalhes

## Card 2: EBITDA 📈
**Cor:** Azul (from-blue-500 to-cyan-600)
**Valor Principal:** EBITDA do período
**Subtitle:** Margem EBITDA (%)
**Trend:** Margem EBITDA (%)

### Detalhes Expandíveis
1. Margem Bruta (%)
2. Margem Operacional (%)
3. Margem EBITDA (%)

### Cálculo
EBITDA = Lucro Operacional + Depreciação + Amortização

## Card 3: ROI 🎯
**Cor:** Roxo (from-purple-500 to-pink-600)
**Valor Principal:** ROI (%)
**Subtitle:** Break-even point
**Trend:** ROI (%)

### Detalhes Expandíveis
1. Break-even (R$)
2. Payback period (dias)
3. ROI (%)

### Cálculo
ROI = (Lucro Líquido / Investimento Total) × 100

## Card 4: Capital de Giro 💼
**Cor:** Laranja (from-orange-500 to-red-600)
**Valor Principal:** Capital de giro líquido
**Subtitle:** Eficiência operacional (%)
**Trend:** Eficiência (%)

### Detalhes Expandíveis
1. Contas a receber (R$)
2. Contas a pagar (R$)
3. Capital líquido (R$)

### Cálculo
Capital de Giro = Contas a Receber - Contas a Pagar

## Outros Componentes

### Alertas Financeiros
- Lista de alertas ativos
- Severidade: Critical, Warning, Info
- Valores atuais vs limites
- Data de criação

### Análise de Margens
Indicadores de rentabilidade:
1. Margem Bruta (meta: 60%)
2. Margem Operacional (meta: 40%)
3. Margem Líquida (meta: 30%)
4. Margem EBITDA (meta: 35%)

### Top 10 Clientes
- Classificação ABC
- Score de crédito
- Risco de churn
- Receita total
- Valor médio de pedido',
  'system_documentation',
  ARRAY['cfo', 'dashboard', 'kpis', 'cards', 'interativos'],
  jsonb_build_object(
    'version', '6.0',
    'date', '2025-10-28',
    'status', 'implementado'
  )
) ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- ========================================
-- 5. CREDIT SCORING
-- ========================================
INSERT INTO thomaz_knowledge_base (
  title,
  content,
  category,
  tags,
  metadata
) VALUES (
  'Sistema de Credit Scoring',
  '# SISTEMA DE CREDIT SCORING

## Visão Geral
Sistema automatizado de análise de crédito de clientes com score de 0-1000 pontos.

## Categorias de Risco

### 1. Excelente (800-1000)
- **Cor:** Verde
- **Limite Sugerido:** R$ 50.000+
- **Características:**
  - Histórico de pagamento perfeito
  - Alta frequência de compras
  - Ticket médio elevado
  - Baixíssimo risco

### 2. Bom (600-799)
- **Cor:** Azul
- **Limite Sugerido:** R$ 20.000 - R$ 50.000
- **Características:**
  - Bom histórico de pagamento
  - Compras regulares
  - Risco baixo

### 3. Médio (400-599)
- **Cor:** Amarelo
- **Limite Sugerido:** R$ 10.000 - R$ 20.000
- **Características:**
  - Histórico irregular
  - Alguns atrasos
  - Risco moderado

### 4. Alto Risco (200-399)
- **Cor:** Laranja
- **Limite Sugerido:** R$ 5.000 - R$ 10.000
- **Características:**
  - Histórico ruim
  - Atrasos frequentes
  - Risco elevado

### 5. Bloqueado (0-199)
- **Cor:** Vermelho
- **Limite Sugerido:** R$ 0 (bloqueado)
- **Características:**
  - Inadimplência grave
  - Múltiplos atrasos
  - Risco crítico

## Cálculo do Score

### Fatores Considerados (peso)
1. **Histórico de Pagamentos (40%)**
   - Pagamentos em dia: +10 pontos cada
   - Atrasos de 1-7 dias: -5 pontos
   - Atrasos de 8-30 dias: -15 pontos
   - Atrasos >30 dias: -30 pontos

2. **Volume de Compras (25%)**
   - Total de compras
   - Frequência
   - Crescimento

3. **Ticket Médio (20%)**
   - Valor médio por pedido
   - Consistência

4. **Tempo de Relacionamento (10%)**
   - Meses como cliente
   - Primeira compra

5. **Diversificação (5%)**
   - Variedade de produtos/serviços
   - Quantidade de categorias

## Funcionalidades

### Página Principal
- 5 cards de estatísticas (clicáveis para filtrar)
- Busca por nome de cliente
- Tabela com todos os clientes
- Botão "Recalcular Todos"

### Filtros
- Por categoria de risco
- Por nome (busca)
- Por tipo (PF/PJ)

### Informações Exibidas
- Nome do cliente
- Tipo (PF/PJ)
- Score (0-1000)
- Categoria de risco
- Limite sugerido
- Total de compras

## Recálculo
- Manual: Botão "Recalcular Todos"
- Automático: Função `recalculate_all_credit_scores()`
- Atualização: Após cada novo lançamento financeiro

## View no Banco
```sql
v_customer_credit_scoring
- customer_id
- customer_name
- customer_type
- credit_score
- risk_category
- suggested_credit_limit
- total_purchases
- payment_history_score
- last_updated
```',
  'system_documentation',
  ARRAY['credit-scoring', 'risco', 'clientes', 'análise-crédito'],
  jsonb_build_object(
    'version', '6.0',
    'date', '2025-10-28',
    'status', 'implementado'
  )
) ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- ========================================
-- 6. GUIA DE USO DO SISTEMA
-- ========================================
INSERT INTO thomaz_knowledge_base (
  title,
  content,
  category,
  tags,
  metadata
) VALUES (
  'Guia Rápido de Uso do Sistema',
  '# GUIA RÁPIDO DE USO

## Acesso Inicial
1. Abra o sistema no navegador
2. Faça login (ou acesse diretamente - sistema está aberto)
3. Você verá o Dashboard inicial

## Navegação Principal

### Menu Lateral
O menu está organizado em grupos:

**GESTÃO**
- Início: Dashboard principal
- Agenda: Compromissos e eventos
- Clientes: Cadastro e gestão
- Fornecedores: Cadastro e gestão
- Compras: Pedidos de compra
- Ordens de Serviço: Criar e gerenciar OS
- Rotas: Rastreamento

**FINANCEIRO** (3 módulos consolidados)
- 💰 Financeiro: Centro financeiro completo
- 👔 CFO & Executivo: Análises executivas
- 📄 Relatórios: Todos os relatórios

**OPERACIONAL**
- Catálogo de Serviços
- Estoque
- Automações

**COMUNICAÇÃO**
- WhatsApp CRM
- Email Corporativo
- Thomaz AI

**SISTEMA**
- Biblioteca Digital
- Funcionários
- Usuários
- Acessos
- Auditoria
- Templates
- Personalização
- Configurações

## Como Usar Módulos Consolidados

### Financeiro
1. Clique em "Financeiro" no menu
2. Selecione a aba desejada:
   - **Dashboard:** Visão geral
   - **Movimentações:** Adicionar receitas/despesas
   - **Análise:** Ver indicadores (EBITDA, ROI)
   - **Contas:** Gerenciar contas bancárias
   - **Categorias:** Organizar categorias

### CFO & Executivo
1. Clique em "CFO & Executivo" no menu
2. Explore as abas:
   - **Dashboard CFO:** Veja KPIs executivos
   - **Credit Scoring:** Analise risco de clientes
   - **Metas:** Acompanhe objetivos
   - **Alertas:** Veja problemas críticos

### Relatórios
1. Clique em "Relatórios" no menu
2. Escolha o tipo:
   - **Dashboards:** Visualizações interativas
   - **PDFs:** Relatórios para impressão
   - **Customizados:** Crie seus próprios
   - **Histórico:** Acesse antigos

## Interagindo com Cards CFO

### Passar o Mouse
- Card sobe suavemente
- Sombra aumenta
- Mostra interatividade

### Clicar no Card
- Navega para página relacionada
- Ex: Card "Receita" → vai para /financeiro

### Clicar no Ícone (i)
- Expande detalhes adicionais
- Mostra métricas complementares
- Clique novamente para colapsar

### Ver Trends
- Seta verde ↑ = Positivo
- Seta vermelha ↓ = Negativo
- Percentual ao lado

## Criando uma Ordem de Serviço

1. Menu → "Ordens de Serviço"
2. Botão "Nova OS"
3. Preencha:
   - Cliente
   - Serviços (múltiplos)
   - Materiais
   - Equipe
   - Prazos
4. Salve

## Usando Credit Scoring

1. Menu → "CFO & Executivo"
2. Aba "Credit Scoring"
3. Veja estatísticas no topo
4. Clique em um card para filtrar
5. Use busca para encontrar cliente
6. Botão "Recalcular Todos" atualiza scores

## Usando Thomaz AI

1. Clique no ícone do Thomaz (canto inferior direito)
2. OU vá em Menu → "Thomaz AI"
3. Digite sua pergunta
4. Thomaz responde com base nos dados reais
5. Pode perguntar sobre:
   - Dados financeiros
   - Clientes
   - Ordens de serviço
   - Análises
   - Como usar funcionalidades

## Atalhos Úteis

### Teclado
- `Ctrl + K`: Busca global
- `Alt + F`: Ir para Financeiro
- `Alt + E`: Ir para Executivo
- `Alt + R`: Ir para Relatórios

### Navegação
- Clique no logo → Volta ao início
- Breadcrumbs → Navegação contextual
- Botão voltar do navegador funciona',
  'user_guide',
  ARRAY['guia', 'tutorial', 'como-usar', 'ajuda'],
  jsonb_build_object(
    'version', '6.0',
    'date', '2025-10-28',
    'status', 'atualizado'
  )
) ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- ========================================
-- 7. RESUMO DE FUNCIONALIDADES PRINCIPAIS
-- ========================================
INSERT INTO thomaz_knowledge_base (
  title,
  content,
  category,
  tags,
  metadata
) VALUES (
  'Funcionalidades Principais do Sistema',
  '# FUNCIONALIDADES PRINCIPAIS

## 1. Gestão de Clientes
- Cadastro PF (Pessoa Física) e PJ (Pessoa Jurídica)
- Busca de CNPJ automática (ReceitaWS)
- Busca de CEP automática (ViaCEP)
- Histórico de compras
- Análise de crédito
- Score automático
- Classificação ABC

## 2. Ordens de Serviço
- Criação completa de OS
- Múltiplos serviços por OS
- Materiais vinculados
- Equipe de trabalho
- Custos detalhados
- Status: Pendente, Em Execução, Concluída
- Impressão de OS profissional
- Timeline de atividades
- Checklist de execução

## 3. Gestão Financeira
- Lançamentos de receitas
- Lançamentos de despesas
- Categorização
- Contas bancárias
- Fluxo de caixa
- DRE (Demonstrativo de Resultado)
- Conciliação bancária
- Recorrências

## 4. Dashboard CFO
- 20+ KPIs executivos
- Cards interativos
- Receita Total
- EBITDA e margens
- ROI e payback
- Capital de giro
- Alertas financeiros
- Top 10 clientes
- Análise de saúde financeira

## 5. Credit Scoring
- Score automático (0-1000)
- 5 categorias de risco
- Limites sugeridos
- Análise de histórico
- Filtros avançados
- Recálculo sob demanda

## 6. Catálogo de Serviços
- Serviços cadastrados
- Preços e margens
- Materiais necessários
- Tempo de execução
- Fotos e descrições
- Busca inteligente

## 7. Controle de Estoque
- Items cadastrados
- Quantidades
- Valores de custo e venda
- Alertas de estoque mínimo
- Entrada e saída
- Inventário

## 8. Gestão de Funcionários
- Cadastro completo
- Documentos
- Cargos e salários
- Histórico
- Alocação em OS

## 9. WhatsApp CRM
- Conexão via QR Code
- Recebimento de mensagens
- Envio de mensagens
- Criar OS do chat
- Histórico de conversas

## 10. Thomaz AI
- Assistente inteligente
- Acesso a dados reais
- Análises financeiras
- Sugestões
- Ajuda contextual
- Respostas baseadas em documentação

## 11. Relatórios
- Dashboards interativos
- PDFs profissionais
- Exportação Excel
- Gráficos dinâmicos
- Filtros avançados
- Agendamento

## 12. Email Corporativo
- Envio de emails
- Recebimento
- Anexos
- Templates
- Integração com documentos

## 13. Automações
- Workflows automáticos
- Triggers configuráveis
- Ações programadas
- Notificações

## 14. Auditoria
- Logs de todas as ações
- Rastreamento de mudanças
- Histórico completo
- Segurança

## 15. Personalização
- Temas customizáveis
- Logo da empresa
- Cores
- Layout
- Preferências',
  'system_documentation',
  ARRAY['funcionalidades', 'recursos', 'features'],
  jsonb_build_object(
    'version', '6.0',
    'date', '2025-10-28',
    'status', 'completo'
  )
) ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- ========================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índice para busca rápida por categoria
CREATE INDEX IF NOT EXISTS idx_thomaz_kb_category ON thomaz_knowledge_base(category);

-- Índice para busca por tags
CREATE INDEX IF NOT EXISTS idx_thomaz_kb_tags ON thomaz_knowledge_base USING gin(tags);

-- Índice full-text search
CREATE INDEX IF NOT EXISTS idx_thomaz_kb_search ON thomaz_knowledge_base USING gin(to_tsvector('portuguese', title || ' ' || content));

-- ========================================
-- ATUALIZAR METADADOS
-- ========================================

-- Marcar última atualização do conhecimento
UPDATE thomaz_system_config
SET
  config_value = jsonb_build_object(
    'last_knowledge_update', NOW(),
    'total_documents', (SELECT COUNT(*) FROM thomaz_knowledge_base),
    'version', '6.0',
    'status', 'updated'
  )
WHERE config_key = 'knowledge_base_status';

-- Se não existir, criar
INSERT INTO thomaz_system_config (config_key, config_value)
VALUES (
  'knowledge_base_status',
  jsonb_build_object(
    'last_knowledge_update', NOW(),
    'total_documents', (SELECT COUNT(*) FROM thomaz_knowledge_base),
    'version', '6.0',
    'status', 'updated'
  )
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Mostrar resumo do que foi agregado
SELECT
  category,
  COUNT(*) as total_docs,
  MAX(updated_at) as last_updated
FROM thomaz_knowledge_base
GROUP BY category
ORDER BY category;

-- Mostrar documentos mais recentes
SELECT
  title,
  category,
  array_length(tags, 1) as num_tags,
  updated_at
FROM thomaz_knowledge_base
ORDER BY updated_at DESC
LIMIT 10;

COMMIT;

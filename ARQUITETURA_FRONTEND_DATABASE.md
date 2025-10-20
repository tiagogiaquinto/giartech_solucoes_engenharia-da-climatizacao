# Arquitetura Frontend - Engenharia Reversa do Banco de Dados

## 📊 Visão Geral do Sistema

Sistema integrado de gestão empresarial com foco em ordens de serviço, controle financeiro, estoque e CRM.

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais e Relacionamentos

```
CLIENTES (customers) [5 registros]
├── Endereços (customer_addresses)
├── Contatos (customer_contacts)
├── Ordens de Serviço (service_orders) [8 registros]
├── Equipamentos (equipments)
├── Contratos (contracts)
├── Pedidos (orders)
├── Agenda (agenda) [18 registros]
└── Lançamentos Financeiros (finance_entries)

ESTOQUE
├── Itens de Inventário (inventory_items) [12 registros]
├── Materiais (materials) [5 registros]
├── Movimentações de Estoque (stock_movements)
└── Movimentações de Inventário (inventory_movements)

SERVIÇOS
├── Catálogo de Serviços (catalog_services) [8 registros]
├── Ordens de Serviço (service_orders) [8 registros]
├── Itens da OS (service_order_items)
└── Equipe da OS (service_order_team)

FINANCEIRO
├── Lançamentos (finance_entries)
├── Categorias (finance_categories)
├── Notas Fiscais (finance_invoices)
├── Transações (financial_transactions)
└── Contas Bancárias (bank_accounts)

RECURSOS HUMANOS
├── Funcionários (staff)
├── Equipe das Ordens (order_staff)
└── Equipe das OS (service_order_team)

AGENDA E PROJETOS
├── Agenda (agenda) [18 eventos]
└── Projetos (projects)

SISTEMA
├── Tenants (tenants)
├── Empresas (empresas)
├── Usuários (users)
├── Perfis de Usuário (user_profiles)
└── Configurações (company_settings)
```

## 📈 Dados Existentes e Prioridades

### Alto Volume de Dados (Implementar Primeiro)
1. **Agenda** (18 registros)
   - Eventos operacionais, administrativos, financeiros e pessoais
   - Status: a_fazer, feito
   - Prioridades: low, medium, high
   - ✅ **JÁ IMPLEMENTADO** com 5 visualizações

2. **Inventory Items** (12 registros)
   - Controle de estoque de produtos/peças
   - Necessita: Lista, Cards, Filtros, Relatórios

3. **Service Orders** (8 registros)
   - Ordens de serviço técnico
   - Status workflow completo
   - Necessita: Kanban, Timeline, Detalhes

4. **Catalog Services** (8 registros)
   - Serviços oferecidos pela empresa
   - Necessita: Grid, Listagem, Formulários

### Médio Volume (Implementar em Seguida)
5. **Customers** (5 registros)
   - Clientes PF e PJ
   - Necessita: CRM completo, Cards, Detalhes

6. **Materials** (5 registros)
   - Materiais para serviços
   - Necessita: Catálogo, Estoque mínimo

### Sem Dados (Implementar Interface + Dados de Teste)
- Staff (funcionários)
- Contracts (contratos)
- Equipments (equipamentos dos clientes)
- Orders (pedidos)
- Projects (projetos)
- Finance Entries (lançamentos financeiros)

## 🎨 Proposta de Frontend Perfeito

### 1. Dashboard Executivo (Página Inicial)

```typescript
interface DashboardMetrics {
  // KPIs Principais
  ordensServicoAbertas: number
  ordensServicoHoje: number
  receitaMensal: number
  clientesAtivos: number

  // Gráficos
  ordensServicoStatus: PieChart
  receitaMensalTendencia: LineChart
  agendaSemana: CalendarView
  estoqueAlertas: BarChart

  // Alertas e Notificações
  alertasEstoqueBaixo: Alert[]
  osAtrasadas: Alert[]
  compromissosHoje: AgendaEvent[]
}
```

**Visualizações:**
- Cards com KPIs animados
- Gráficos interativos (Chart.js/Recharts)
- Mini calendário com eventos do dia
- Lista de alertas prioritários
- Ações rápidas (Nova OS, Novo Cliente, etc)

### 2. Módulo de Ordens de Serviço

**Visualizações Múltiplas:**
- **Kanban Board**: Por status (Aberta → Em Andamento → Concluída)
- **Lista**: Tabela completa com filtros avançados
- **Calendário**: Agendamento de serviços
- **Timeline**: Histórico e progresso
- **Mapa**: Localização geográfica (se houver endereços)

**Detalhes da OS:**
```typescript
interface ServiceOrderDetail {
  // Informações Básicas
  numero: string
  cliente: Customer
  equipamento?: Equipment
  status: string
  prioridade: string

  // Datas
  dataAbertura: Date
  dataAgendamento?: Date
  dataFechamento?: Date

  // Equipe e Materiais
  equipe: Staff[]
  materiais: ServiceOrderItem[]

  // Financeiro
  valorTotal: number
  valorMaoObra: number
  valorMateriais: number

  // Documentação
  descricao: string
  observacoes: string
  fotos: string[]
  contratoGerado?: string
}
```

### 3. Módulo de Clientes (CRM)

**Visualizações:**
- **Cards Grid**: Visual cards com foto/avatar
- **Lista Completa**: Tabela com filtros
- **Mapa**: Clientes por região
- **Pipeline**: Funil de vendas (se houver leads)

**Perfil do Cliente:**
```typescript
interface CustomerProfile {
  // Dados Básicos
  nomeRazao: string
  tipo: 'pf' | 'pj'
  cpfCnpj: string
  email: string
  telefone: string

  // Endereços Múltiplos
  enderecos: CustomerAddress[]

  // Contatos
  contatos: CustomerContact[]

  // Equipamentos
  equipamentos: Equipment[]

  // Histórico
  ordensServico: ServiceOrder[]
  contratos: Contract[]
  lancamentosFinanceiros: FinanceEntry[]

  // Estatísticas
  totalGasto: number
  totalOS: number
  ultimoAtendimento: Date
  score: number // NPS ou satisfação
}
```

### 4. Módulo de Estoque

**Visualizações:**
- **Grid de Cards**: Produtos com imagem e estoque
- **Lista**: Tabela com ordenação e filtros
- **Alertas**: Produtos com estoque baixo
- **Movimentações**: Histórico de entrada/saída

**Dashboard de Estoque:**
```typescript
interface InventoryDashboard {
  // Métricas
  totalItens: number
  valorTotal: number
  itensAbaixoMinimo: number
  movimentacoesMes: number

  // Alertas
  alertasEstoque: {
    item: InventoryItem
    qtdeAtual: number
    qtdeMinima: number
    necessidadeCompra: number
  }[]

  // Top Itens
  maisUsados: InventoryItem[]
  maisCaros: InventoryItem[]

  // Gráficos
  movimentacoesTempo: LineChart
  distribuicaoCategorias: PieChart
}
```

### 5. Módulo Financeiro

**Visualizações:**
- **Fluxo de Caixa**: Entradas vs Saídas
- **Contas a Pagar**: Lista priorizada
- **Contas a Receber**: Acompanhamento
- **Relatórios**: DRE, Balanço, etc

**Dashboard Financeiro:**
```typescript
interface FinancialDashboard {
  // Resumo do Mês
  receitaMensal: number
  despesaMensal: number
  saldo: number
  margemLucro: number

  // Pendências
  contasPagar: FinanceEntry[]
  contasReceber: FinanceEntry[]
  vencimentosProximos: FinanceEntry[]

  // Análises
  receitaPorCategoria: PieChart
  despesaPorCategoria: PieChart
  fluxoCaixaMensal: LineChart
  comparativoAnual: BarChart
}
```

### 6. Módulo de Agenda (✅ Já Implementado)

**5 Visualizações:**
- Calendário (Dia/Semana/Quinzena/Mês)
- Lista
- Quadro Kanban
- Linha do Tempo
- Gantt

### 7. Catálogo de Serviços

**Visualizações:**
- **Grid de Cards**: Serviços com preço e descrição
- **Lista**: Tabela completa
- **Categorias**: Agrupamento por categoria

**Card de Serviço:**
```typescript
interface ServiceCatalogCard {
  nome: string
  descricao: string
  preco: number
  categoria: FinanceCategory
  tempoEstimado: number
  materiaisNecessarios: Material[]
  imagem?: string
  ativo: boolean
}
```

## 🎯 Padrões de Interface

### Design System

**Cores:**
```typescript
const colors = {
  // Status
  operacional: '#3B82F6',    // blue-500
  administrativo: '#10B981', // green-500
  financeiro: '#EF4444',     // red-500
  pessoal: '#A855F7',        // purple-500

  // Estado
  pendente: '#F59E0B',       // yellow-500
  emAndamento: '#3B82F6',    // blue-500
  concluido: '#10B981',      // green-500
  cancelado: '#6B7280',      // gray-500

  // Prioridade
  alta: '#EF4444',           // red-500
  media: '#F59E0B',          // yellow-500
  baixa: '#10B981',          // green-500
}
```

**Componentes Reutilizáveis:**
1. **StatCard**: Card de estatística com ícone, valor e tendência
2. **DataTable**: Tabela com paginação, ordenação e filtros
3. **KanbanBoard**: Quadro arrastar e soltar
4. **TimelineView**: Linha do tempo visual
5. **FormModal**: Modal para criar/editar registros
6. **DetailPanel**: Painel lateral com detalhes
7. **ChartCard**: Card com gráfico responsivo
8. **AlertBanner**: Banner de alertas e notificações
9. **SearchBar**: Busca global com filtros
10. **QuickActions**: Botão flutuante com ações rápidas

### Responsividade

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Adaptações:**
- Mobile: Bottom navigation, cards em coluna única
- Tablet: Sidebar colapsável, grid 2 colunas
- Desktop: Sidebar fixa, grid 3-4 colunas

## 🔄 Fluxos de Dados

### Principais Queries Necessárias

```sql
-- Dashboard Principal
SELECT
  (SELECT COUNT(*) FROM service_orders WHERE status != 'concluida') as os_abertas,
  (SELECT COUNT(*) FROM agenda WHERE data = CURRENT_DATE) as eventos_hoje,
  (SELECT COUNT(DISTINCT id) FROM customers) as clientes,
  (SELECT COUNT(*) FROM inventory_items WHERE quantidade < quantidade_minima) as alertas_estoque;

-- Ordens de Serviço com Cliente
SELECT
  so.*,
  c.nome_razao,
  c.telefone,
  c.email,
  COUNT(soi.id) as total_itens,
  SUM(soi.quantity * m.unit_price) as valor_materiais
FROM service_orders so
LEFT JOIN customers c ON c.id = so.customer_id
LEFT JOIN service_order_items soi ON soi.order_id = so.id
LEFT JOIN materials m ON m.id = soi.material_id
GROUP BY so.id, c.id;

-- Estoque com Alertas
SELECT
  i.*,
  CASE
    WHEN quantidade < quantidade_minima THEN 'critico'
    WHEN quantidade < quantidade_minima * 1.5 THEN 'alerta'
    ELSE 'ok'
  END as status_estoque
FROM inventory_items i
ORDER BY status_estoque, nome;

-- Agenda Semanal
SELECT
  a.*,
  c.nome_razao as cliente_nome
FROM agenda a
LEFT JOIN customers c ON c.id = a.customer_id
WHERE data BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
ORDER BY data, hora;
```

## 📱 Navegação Proposta

```
/ (Dashboard)
├── /clientes
│   ├── /novo
│   └── /:id (detalhes)
├── /ordens-servico
│   ├── /nova
│   ├── /:id (detalhes)
│   └── /calendario
├── /estoque
│   ├── /itens
│   ├── /movimentacoes
│   └── /alertas
├── /financeiro
│   ├── /lancamentos
│   ├── /categorias
│   ├── /contas-bancarias
│   └── /relatorios
├── /agenda (✅ implementado)
├── /catalogo-servicos
├── /contratos
├── /equipamentos
├── /equipe
└── /configuracoes
```

## 🚀 Próximos Passos

### Fase 1: Ordens de Serviço (Prioridade Alta)
1. Criar visualização Kanban
2. Implementar lista com filtros
3. Formulário de criação/edição
4. Página de detalhes completa
5. Integração com agenda

### Fase 2: Estoque (Prioridade Alta)
1. Dashboard de estoque
2. Grid de produtos
3. Sistema de alertas
4. Movimentações
5. Relatórios

### Fase 3: Clientes/CRM (Prioridade Média)
1. Grid de clientes
2. Perfil completo
3. Histórico de atendimentos
4. Gestão de endereços/contatos
5. Pipeline de vendas

### Fase 4: Financeiro (Prioridade Média)
1. Dashboard financeiro
2. Lançamentos
3. Fluxo de caixa
4. Relatórios gerenciais

### Fase 5: Complementos
1. Catálogo de serviços
2. Gestão de contratos
3. Controle de equipamentos
4. Gestão de equipe
5. Projetos

## 📊 Métricas de Sucesso

- **Performance**: Carregamento < 2s
- **Usabilidade**: < 3 cliques para ação principal
- **Responsividade**: 100% funcional em mobile
- **Acessibilidade**: WCAG 2.1 AA
- **Dados**: 100% das tabelas com dados integrados

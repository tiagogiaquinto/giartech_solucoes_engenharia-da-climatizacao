import { thomazDatabaseService } from './thomazDatabaseService'
import { thomazDataService } from './thomazDataService'
import { reason } from './thomazReasoningEngine'

export interface ThomazResponse {
  message: string
  data?: any
  suggestions?: string[]
  confidence?: number
  sources?: string[]
  executionTime?: number
  reasoning?: any
}

export interface ThomazContext {
  systemConfig?: any
  knowledgeData?: any
  modulesData?: any
  dashboardMetrics?: any
  personalityConfig?: any
  userPreferences?: any
}

class ThomazUltraService {
  private context: ThomazContext = {}
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    console.log('🚀 Inicializando Thomaz Ultra Service...')

    try {
      const [systemConfig, knowledgeData, modulesData, dashboardMetrics, personalityConfig] =
        await Promise.all([
          thomazDatabaseService.getSystemConfiguration(),
          thomazDatabaseService.getKnowledgeData(),
          thomazDatabaseService.getModulesAndPermissions(),
          thomazDatabaseService.getDashboardMetrics(),
          thomazDatabaseService.getPersonalityConfig()
        ])

      this.context = {
        systemConfig,
        knowledgeData,
        modulesData,
        dashboardMetrics,
        personalityConfig
      }

      this.initialized = true
      console.log('✅ Thomaz Ultra Service inicializado com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao inicializar Thomaz Ultra:', error)
      this.initialized = false
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  async processQuery(query: string, userId?: string): Promise<ThomazResponse> {
    const startTime = Date.now()
    await this.ensureInitialized()

    try {
      const normalizedQuery = query.toLowerCase().trim()

      if (normalizedQuery.length < 3) {
        return {
          message: 'Por favor, escreva uma pergunta mais específica.',
          confidence: 0.1,
          executionTime: Date.now() - startTime
        }
      }

      const queryType = this.classifyQuery(normalizedQuery)
      console.log('🔍 Tipo de consulta:', queryType)

      let response: ThomazResponse

      switch (queryType) {
        case 'greeting':
          response = await this.handleGreeting(normalizedQuery)
          break
        case 'dashboard':
          response = await this.handleDashboardQuery()
          break
        case 'customers':
          response = await this.handleCustomersQuery(normalizedQuery)
          break
        case 'orders':
          response = await this.handleOrdersQuery(normalizedQuery)
          break
        case 'financial':
          response = await this.handleFinancialQuery(normalizedQuery)
          break
        case 'employees':
          response = await this.handleEmployeesQuery(normalizedQuery)
          break
        case 'inventory':
          response = await this.handleInventoryQuery(normalizedQuery)
          break
        case 'crm':
          response = await this.handleCRMQuery(normalizedQuery)
          break
        case 'agenda':
          response = await this.handleAgendaQuery(normalizedQuery)
          break
        case 'configuration':
          response = await this.handleConfigurationQuery(normalizedQuery)
          break
        case 'help':
          response = await this.handleHelpQuery(normalizedQuery)
          break
        case 'search':
          response = await this.handleSearchQuery(normalizedQuery)
          break
        default:
          response = await this.handleGeneralQuery(normalizedQuery)
      }

      response.executionTime = Date.now() - startTime

      await thomazDatabaseService.saveInteraction({
        query,
        response: response.message,
        query_type: queryType,
        success: true,
        execution_time: response.executionTime
      })

      return response
    } catch (error: any) {
      console.error('❌ Erro ao processar consulta:', error)

      const errorResponse: ThomazResponse = {
        message:
          'Desculpe, tive um problema ao processar sua pergunta. Pode reformular ou tentar novamente?',
        confidence: 0,
        executionTime: Date.now() - startTime
      }

      await thomazDatabaseService.saveInteraction({
        query,
        response: errorResponse.message,
        success: false,
        execution_time: errorResponse.executionTime
      })

      return errorResponse
    }
  }

  private classifyQuery(query: string): string {
    if (/^(oi|ol[aá]|bom dia|boa tarde|boa noite|hey|e a[ií])/i.test(query)) {
      return 'greeting'
    }

    if (/(dashboard|visão geral|resumo|panorama|metricas)/i.test(query)) {
      return 'dashboard'
    }

    if (/(cliente|customer|consumidor)/i.test(query)) {
      return 'customers'
    }

    if (/(ordem|os|serviço|atendimento)/i.test(query)) {
      return 'orders'
    }

    if (/(financeiro|receita|despesa|faturamento|lucro|caixa|contas)/i.test(query)) {
      return 'financial'
    }

    if (/(funcionário|colaborador|equipe|time|rh)/i.test(query)) {
      return 'employees'
    }

    if (/(estoque|inventário|material|produto|item)/i.test(query)) {
      return 'inventory'
    }

    if (/(crm|oportunidade|lead|venda|negociação|pipeline)/i.test(query)) {
      return 'crm'
    }

    if (/(agenda|evento|compromisso|reunião|calendário)/i.test(query)) {
      return 'agenda'
    }

    if (/(configuração|config|sistema|módulo|permissão)/i.test(query)) {
      return 'configuration'
    }

    if (/(ajuda|help|como|tutorial|dúvida)/i.test(query)) {
      return 'help'
    }

    if (/(buscar|procurar|encontrar|pesquisar)/i.test(query)) {
      return 'search'
    }

    return 'general'
  }

  private async handleGreeting(query: string): Promise<ThomazResponse> {
    const greetings = [
      'Boa noite! Como posso te ajudar hoje?',
      'Olá! Estou aqui para auxiliar. O que você precisa?',
      'Oi! Em que posso ser útil?',
      'Boa noite! Pronto para responder suas dúvidas.',
      'Hey! Como posso ajudar com o negócio hoje?'
    ]

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]

    const metrics = this.context.dashboardMetrics

    const contextInfo = metrics
      ? `\n\nAqui está um resumo rápido:\n• ${metrics.clientes} clientes\n• ${metrics.ordens_servico} ordens de serviço\n• ${metrics.funcionarios} funcionários\n• ${metrics.oportunidades} oportunidades no CRM`
      : ''

    return {
      message: randomGreeting + contextInfo,
      confidence: 1.0,
      suggestions: [
        'Mostre o dashboard',
        'Como estão as finanças?',
        'Listar clientes',
        'Ordens de serviço pendentes'
      ]
    }
  }

  private async handleDashboardQuery(): Promise<ThomazResponse> {
    const metrics = await thomazDatabaseService.getDashboardMetrics()

    const message = `📊 **Visão Geral do Sistema**

**Clientes:** ${metrics.clientes} cadastrados
**Ordens de Serviço:** ${metrics.ordens_servico} registradas
**Receita Total:** R$ ${metrics.receita_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
**Funcionários:** ${metrics.funcionarios} ativos
**Oportunidades CRM:** ${metrics.oportunidades} em andamento

Tudo funcionando bem! 🚀`

    return {
      message,
      data: metrics,
      confidence: 1.0,
      suggestions: ['Detalhar finanças', 'Ver clientes', 'Ordens de serviço', 'Oportunidades CRM']
    }
  }

  private async handleCustomersQuery(query: string): Promise<ThomazResponse> {
    const result = await thomazDatabaseService.getCustomerData()

    if (!result.success || result.data.length === 0) {
      return {
        message: 'Não encontrei clientes no sistema.',
        confidence: 0.5,
        suggestions: ['Cadastrar novo cliente', 'Ver dashboard']
      }
    }

    const total = result.data.length
    const active = result.data.filter((c) => c.status === 'ativo' || c.status === 'active').length

    const message = `👥 **Clientes no Sistema**

**Total:** ${total} clientes cadastrados
**Ativos:** ${active} clientes

Alguns clientes recentes:
${result.data.slice(0, 5).map((c) => `• ${c.name} - ${c.email || c.phone || 'Sem contato'}`).join('\n')}

${total > 5 ? `\n...e mais ${total - 5} clientes` : ''}`

    return {
      message,
      data: result.data,
      confidence: 1.0,
      suggestions: ['Buscar cliente específico', 'Ver ordens de serviço', 'Análise de clientes']
    }
  }

  private async handleOrdersQuery(query: string): Promise<ThomazResponse> {
    const status = query.includes('pendente') ? 'pendente' : undefined
    const result = await thomazDatabaseService.getServiceOrders({ status })

    if (!result.success || result.data.length === 0) {
      return {
        message: 'Não encontrei ordens de serviço no momento.',
        confidence: 0.5
      }
    }

    const total = result.data.length
    const pendentes = result.data.filter((o) => o.status === 'pendente').length
    const emAndamento = result.data.filter((o) => o.status === 'em_andamento').length

    const message = `📋 **Ordens de Serviço**

**Total:** ${total} ordens
**Pendentes:** ${pendentes}
**Em Andamento:** ${emAndamento}

Ordens recentes:
${result.data.slice(0, 5).map((o) => `• #${o.order_number} - ${o.cliente_nome} - ${o.status} - R$ ${(o.total_geral || 0).toFixed(2)}`).join('\n')}

${total > 5 ? `\n...e mais ${total - 5} ordens` : ''}`

    return {
      message,
      data: result.data,
      confidence: 1.0,
      suggestions: ['Ver ordem específica', 'Criar nova ordem', 'Ordens pendentes']
    }
  }

  private async handleFinancialQuery(query: string): Promise<ThomazResponse> {
    const result = await thomazDatabaseService.getFinancialData()

    if (!result.success || result.data.length === 0) {
      return {
        message: 'Não encontrei lançamentos financeiros.',
        confidence: 0.5
      }
    }

    const receitas = result.data.filter((f) => f.tipo === 'receita')
    const despesas = result.data.filter((f) => f.tipo === 'despesa')

    const totalReceitas = receitas.reduce((sum, r) => sum + (r.valor || 0), 0)
    const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor || 0), 0)
    const saldo = totalReceitas - totalDespesas

    const message = `💰 **Situação Financeira**

**Receitas:** R$ ${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
**Despesas:** R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
**Saldo:** R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

**Lançamentos recentes:**
${result.data.slice(0, 5).map((f) => `• ${f.descricao} - ${f.tipo} - R$ ${(f.valor || 0).toFixed(2)} - ${f.status}`).join('\n')}

${result.data.length > 5 ? `\n...e mais ${result.data.length - 5} lançamentos` : ''}`

    return {
      message,
      data: {
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo,
        lancamentos: result.data
      },
      confidence: 1.0,
      suggestions: ['Análise detalhada', 'Contas a pagar', 'Contas a receber', 'Fluxo de caixa']
    }
  }

  private async handleEmployeesQuery(query: string): Promise<ThomazResponse> {
    const result = await thomazDatabaseService.getEmployees()

    if (!result.success || result.data.length === 0) {
      return {
        message: 'Não encontrei funcionários cadastrados.',
        confidence: 0.5
      }
    }

    const total = result.data.length
    const ativos = result.data.filter((e) => e.status === 'ativo').length

    const message = `👷 **Equipe**

**Total:** ${total} funcionários
**Ativos:** ${ativos}

Funcionários:
${result.data.slice(0, 8).map((e) => `• ${e.nome} - ${e.cargo || 'Sem cargo'}`).join('\n')}

${total > 8 ? `\n...e mais ${total - 8} funcionários` : ''}`

    return {
      message,
      data: result.data,
      confidence: 1.0,
      suggestions: ['Ver detalhes de funcionário', 'Performance da equipe', 'Adicionar funcionário']
    }
  }

  private async handleInventoryQuery(query: string): Promise<ThomazResponse> {
    const lowStock = query.includes('baixo') || query.includes('mínimo')
    const result = await thomazDatabaseService.getInventoryItems(lowStock)

    if (!result.success || result.data.length === 0) {
      return {
        message: lowStock
          ? 'Nenhum item com estoque baixo no momento. Tudo certo! ✅'
          : 'Não encontrei itens no inventário.',
        confidence: 0.7
      }
    }

    const total = result.data.length
    const valorTotal = result.data.reduce(
      (sum, item) => sum + (item.quantidade || 0) * (item.preco_venda || 0),
      0
    )

    const message = `📦 **Inventário ${lowStock ? '(Estoque Baixo)' : ''}**

**Total de itens:** ${total}
**Valor total estimado:** R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${lowStock ? '⚠️ **Itens com estoque baixo:**' : '**Itens:**'}
${result.data.slice(0, 8).map((i) => `• ${i.nome} - Qtd: ${i.quantidade} ${i.unidade || 'un'} ${lowStock ? `(Mín: ${i.estoque_minimo})` : ''}`).join('\n')}

${total > 8 ? `\n...e mais ${total - 8} itens` : ''}`

    return {
      message,
      data: result.data,
      confidence: 1.0,
      suggestions: lowStock
        ? ['Criar ordem de compra', 'Ver todos os itens', 'Alertas de estoque']
        : ['Estoque baixo', 'Adicionar item', 'Movimentações']
    }
  }

  private async handleCRMQuery(query: string): Promise<ThomazResponse> {
    const result = await thomazDatabaseService.getCRMOpportunities()

    if (!result.success || result.data.length === 0) {
      return {
        message: 'Não encontrei oportunidades no CRM.',
        confidence: 0.5
      }
    }

    const total = result.data.length
    const valorTotal = result.data.reduce((sum, o) => sum + (o.valor || 0), 0)
    const valorPonderado = result.data.reduce((sum, o) => sum + (o.valor || 0) * (o.probabilidade || 0) / 100, 0)

    const message = `🎯 **Pipeline CRM**

**Oportunidades:** ${total}
**Valor Total:** R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
**Valor Ponderado:** R$ ${valorPonderado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

**Oportunidades em destaque:**
${result.data.slice(0, 5).map((o) => `• ${o.titulo} - R$ ${(o.valor || 0).toLocaleString('pt-BR')} - ${o.probabilidade}% - ${o.estagio}`).join('\n')}

${total > 5 ? `\n...e mais ${total - 5} oportunidades` : ''}`

    return {
      message,
      data: result.data,
      confidence: 1.0,
      suggestions: ['Análise de pipeline', 'Oportunidades quentes', 'Criar oportunidade', 'Funil de vendas']
    }
  }

  private async handleAgendaQuery(query: string): Promise<ThomazResponse> {
    const hoje = new Date()
    const proximaSemana = new Date()
    proximaSemana.setDate(hoje.getDate() + 7)

    const result = await thomazDatabaseService.getAgendaEvents({
      startDate: hoje.toISOString(),
      endDate: proximaSemana.toISOString()
    })

    if (!result.success || result.data.length === 0) {
      return {
        message: 'Nenhum evento agendado para os próximos dias.',
        confidence: 0.7,
        suggestions: ['Criar evento', 'Ver agenda completa']
      }
    }

    const message = `📅 **Agenda - Próximos 7 Dias**

**Total de eventos:** ${result.data.length}

${result.data.slice(0, 8).map((e) => {
  const data = new Date(e.data_inicio).toLocaleDateString('pt-BR')
  const hora = new Date(e.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `• ${data} às ${hora} - ${e.titulo} (${e.tipo_evento})`
}).join('\n')}

${result.data.length > 8 ? `\n...e mais ${result.data.length - 8} eventos` : ''}`

    return {
      message,
      data: result.data,
      confidence: 1.0,
      suggestions: ['Hoje', 'Esta semana', 'Este mês', 'Criar evento']
    }
  }

  private async handleConfigurationQuery(query: string): Promise<ThomazResponse> {
    const config = this.context.systemConfig
    const modules = this.context.modulesData

    if (!config || !modules) {
      return {
        message: 'Não consegui acessar as configurações no momento.',
        confidence: 0.3
      }
    }

    const message = `⚙️ **Configurações do Sistema**

**Módulos Ativos:** ${modules.modules?.length || 0}
**Departamentos:** ${modules.departments?.length || 0}
**Automações:** ${modules.automations?.length || 0}

**Provedores de IA:** ${config.aiProviders?.length || 0} configurados

O sistema está configurado e pronto para uso!`

    return {
      message,
      data: { config, modules },
      confidence: 0.9,
      suggestions: ['Ver módulos', 'Configurar IA', 'Permissões', 'Automações']
    }
  }

  private async handleHelpQuery(query: string): Promise<ThomazResponse> {
    const message = `❓ **Como Posso Ajudar**

Sou o Thomaz, seu assistente inteligente! Posso te ajudar com:

**📊 Dados do Sistema:**
• Dashboard e métricas gerais
• Clientes e histórico
• Ordens de serviço
• Situação financeira

**👥 Gestão:**
• Funcionários e equipe
• Inventário e estoque
• CRM e oportunidades
• Agenda e eventos

**🔍 Ações:**
• Buscar informações
• Análises e relatórios
• Sugestões inteligentes
• Configurações

Pergunte qualquer coisa sobre o negócio!`

    return {
      message,
      confidence: 1.0,
      suggestions: ['Mostrar dashboard', 'Como estão as finanças?', 'Listar clientes', 'Ver agenda']
    }
  }

  private async handleSearchQuery(query: string): Promise<ThomazResponse> {
    const searchTerm = query
      .replace(/(buscar|procurar|encontrar|pesquisar)/gi, '')
      .trim()

    if (searchTerm.length < 3) {
      return {
        message: 'Por favor, especifique o que você quer buscar.',
        confidence: 0.3
      }
    }

    const results = await thomazDatabaseService.searchAllTables(searchTerm)

    if (results.totalResults === 0) {
      return {
        message: `Não encontrei resultados para "${searchTerm}".`,
        confidence: 0.5,
        suggestions: ['Tentar outra busca', 'Ver tudo']
      }
    }

    let message = `🔍 **Resultados para "${searchTerm}"**\n\n`

    if (results.customers.length > 0) {
      message += `**Clientes (${results.customers.length}):**\n`
      message += results.customers.map((c) => `• ${c.name} - ${c.email || c.phone}`).join('\n')
      message += '\n\n'
    }

    if (results.orders.length > 0) {
      message += `**Ordens de Serviço (${results.orders.length}):**\n`
      message += results.orders.map((o) => `• #${o.order_number} - ${o.cliente_nome} - ${o.status}`).join('\n')
      message += '\n\n'
    }

    if (results.employees.length > 0) {
      message += `**Funcionários (${results.employees.length}):**\n`
      message += results.employees.map((e) => `• ${e.nome} - ${e.cargo}`).join('\n')
      message += '\n\n'
    }

    if (results.opportunities.length > 0) {
      message += `**Oportunidades (${results.opportunities.length}):**\n`
      message += results.opportunities.map((o) => `• ${o.titulo} - R$ ${o.valor} - ${o.estagio}`).join('\n')
    }

    return {
      message: message.trim(),
      data: results,
      confidence: 0.9
    }
  }

  private async handleGeneralQuery(query: string): Promise<ThomazResponse> {
    try {
      const reasoning = await reason(query, this.context)

      let message = reasoning.response || 'Entendi sua pergunta, mas preciso de mais contexto para responder adequadamente.'

      if (reasoning.dataInsights && Object.keys(reasoning.dataInsights).length > 0) {
        message += '\n\n'
        message += this.formatDataInsights(reasoning.dataInsights)
      }

      return {
        message,
        confidence: reasoning.confidence || 0.5,
        reasoning,
        suggestions: ['Ver dashboard', 'Buscar algo específico', 'Ajuda']
      }
    } catch (error) {
      console.error('Erro no reasoning:', error)

      return {
        message:
          'Essa é uma boa pergunta! Estou aprendendo mais sobre isso. Pode reformular ou ser mais específico?',
        confidence: 0.3,
        suggestions: ['Ver dashboard', 'Listar opções', 'Ajuda']
      }
    }
  }

  private formatDataInsights(insights: any): string {
    let formatted = '**Insights:**\n'

    if (insights.summary) {
      formatted += `${insights.summary}\n`
    }

    if (insights.metrics) {
      formatted += '\n**Métricas:**\n'
      Object.entries(insights.metrics).forEach(([key, value]) => {
        formatted += `• ${key}: ${value}\n`
      })
    }

    if (insights.trends) {
      formatted += '\n**Tendências:**\n'
      insights.trends.forEach((trend: string) => {
        formatted += `• ${trend}\n`
      })
    }

    return formatted
  }

  async refreshContext(): Promise<void> {
    console.log('🔄 Atualizando contexto do Thomaz...')
    thomazDatabaseService.clearCache()
    await this.initialize()
  }

  getContext(): ThomazContext {
    return this.context
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

export const thomazUltraService = new ThomazUltraService()
export default thomazUltraService

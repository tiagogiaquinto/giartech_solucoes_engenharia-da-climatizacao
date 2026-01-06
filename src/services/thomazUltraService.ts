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
      const capabilities = await this.getRelevantCapabilities(query)

      if (capabilities && capabilities.length > 0) {
        const mainCapability = capabilities[0]

        const analysisResult = await this.executeAnalyticalCapability(mainCapability, query)

        if (analysisResult.success) {
          return analysisResult.response
        }
      }

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

  private async getRelevantCapabilities(query: string): Promise<any[]> {
    try {
      const { data, error } = await thomazDatabaseService.executeQuery(
        'SELECT * FROM get_relevant_capabilities($1)',
        [query]
      )

      if (error) {
        console.error('Erro ao buscar capacidades:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar capacidades:', error)
      return []
    }
  }

  private async executeAnalyticalCapability(capability: any, query: string): Promise<{success: boolean, response?: ThomazResponse}> {
    try {
      const views = capability.suggested_views || []
      const queryTemplate = capability.suggested_query

      if (!queryTemplate || views.length === 0) {
        return { success: false }
      }

      const { data, error } = await thomazDatabaseService.executeQuery(queryTemplate, [])

      if (error || !data) {
        return { success: false }
      }

      const insights = await this.generateProactiveInsights()

      const message = this.buildAnalyticalResponse(
        capability.capability_name,
        data,
        insights,
        query
      )

      return {
        success: true,
        response: {
          message,
          data,
          confidence: 0.95,
          sources: views,
          suggestions: this.getSuggestionsForCapability(capability.capability_name)
        }
      }
    } catch (error) {
      console.error('Erro ao executar capacidade analítica:', error)
      return { success: false }
    }
  }

  private async generateProactiveInsights(): Promise<any[]> {
    try {
      const { data, error } = await thomazDatabaseService.executeQuery(
        'SELECT * FROM generate_proactive_insights()',
        []
      )

      if (error) {
        console.error('Erro ao gerar insights:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao gerar insights:', error)
      return []
    }
  }

  private buildAnalyticalResponse(capabilityName: string, data: any[], insights: any[], query: string): string {
    let response = `📊 **${capabilityName}**\n\n`

    switch (capabilityName) {
      case 'Análise de Posição de Caixa':
        response += this.analyzeCashPosition(data, insights)
        break

      case 'Análise de Fluxo de Caixa':
        response += this.analyzeCashFlow(data, insights)
        break

      case 'Dashboard Executivo':
        response += this.analyzeExecutiveDashboard(data, insights)
        break

      case 'Análise de Clientes RFM':
        response += this.analyzeCustomerRFM(data, insights)
        break

      default:
        response += this.analyzeGenericData(data, insights)
    }

    if (insights.length > 0) {
      response += '\n\n🚨 **Alertas e Oportunidades:**\n'
      insights.forEach(insight => {
        const icon = insight.severity === 'critical' ? '🔴' :
                     insight.severity === 'warning' ? '⚠️' :
                     insight.severity === 'success' ? '✅' : 'ℹ️'
        response += `${icon} ${insight.insight_message}\n`

        if (insight.recommendations && insight.recommendations.length > 0) {
          response += '   **Ações recomendadas:**\n'
          insight.recommendations.forEach((rec: string) => {
            response += `   • ${rec}\n`
          })
        }
      })
    }

    return response
  }

  private analyzeCashPosition(data: any[], insights: any[]): string {
    if (!data || data.length === 0) {
      return 'Não há contas bancárias cadastradas no sistema.'
    }

    const totalBalance = data.reduce((sum, account) => sum + (account.saldo_calculado || 0), 0)
    const totalRecebiveis = data.reduce((sum, account) => sum + (account.receitas_pendentes || 0), 0)
    const totalPagar = data.reduce((sum, account) => sum + (account.despesas_pendentes || 0), 0)
    const totalVencido = data.reduce((sum, account) => sum + (account.receitas_vencidas || 0), 0)
    const totalAtrasado = data.reduce((sum, account) => sum + (account.despesas_vencidas || 0), 0)

    const negativeAccounts = data.filter(acc => (acc.saldo_calculado || 0) < 0)
    const lowBalanceAccounts = data.filter(acc => (acc.saldo_calculado || 0) > 0 && (acc.saldo_calculado || 0) < 5000)
    const healthyAccounts = data.filter(acc => (acc.saldo_calculado || 0) >= 5000)

    let analysis = `**📋 Resumo Executivo:**\n`
    analysis += `Posição total em caixa: R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    analysis += `${data.length} conta(s) ativa(s) no sistema\n`

    if (totalRecebiveis > 0 || totalPagar > 0) {
      const projecao = totalBalance + totalRecebiveis - totalPagar
      analysis += `Projeção (com pendências): R$ ${projecao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    }
    analysis += '\n'

    if (negativeAccounts.length > 0) {
      analysis += `🔴 **ATENÇÃO CRÍTICA:** ${negativeAccounts.length} conta(s) com saldo negativo:\n`
      negativeAccounts.forEach(acc => {
        analysis += `   • ${acc.conta}: R$ ${acc.saldo_calculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        if (acc.banco) analysis += ` [${acc.banco}]`
        analysis += '\n'
      })
      analysis += '\n'
    }

    if (lowBalanceAccounts.length > 0) {
      analysis += `⚠️ **Saldo Baixo:** ${lowBalanceAccounts.length} conta(s) com saldo reduzido:\n`
      lowBalanceAccounts.forEach(acc => {
        analysis += `   • ${acc.conta}: R$ ${acc.saldo_calculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        if (acc.banco) analysis += ` [${acc.banco}]`
        analysis += '\n'
      })
      analysis += '\n'
    }

    if (healthyAccounts.length > 0) {
      analysis += `✅ **Contas Saudáveis:** ${healthyAccounts.length} conta(s) com boa liquidez:\n`
      healthyAccounts.forEach(acc => {
        analysis += `   • ${acc.conta}: R$ ${acc.saldo_calculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        if (acc.banco) analysis += ` [${acc.banco}]`
        analysis += '\n'
      })
      analysis += '\n'
    }

    if (totalRecebiveis > 0) {
      analysis += `📥 **A Receber:** R$ ${totalRecebiveis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      if (totalVencido > 0) {
        analysis += ` (🔴 R$ ${totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vencido - INADIMPLÊNCIA)`
      }
      analysis += '\n'
    }

    if (totalPagar > 0) {
      analysis += `📤 **A Pagar:** R$ ${totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      if (totalAtrasado > 0) {
        analysis += ` (🔴 R$ ${totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} atrasado - AÇÃO URGENTE)`
      }
      analysis += '\n'
    }

    if (totalRecebiveis > 0 || totalPagar > 0) {
      analysis += '\n'
    }

    if (negativeAccounts.length > 0 && healthyAccounts.length > 0) {
      const bestSourceAccount = healthyAccounts.reduce((max, acc) =>
        acc.saldo_calculado > max.saldo_calculado ? acc : max
      )
      const worstAccount = negativeAccounts[0]
      const transferAmount = Math.abs(worstAccount.saldo_calculado) + 1000

      analysis += `💡 **Recomendação Estratégica:**\n`
      analysis += `Transferir R$ ${transferAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} `
      analysis += `de "${bestSourceAccount.conta}" para "${worstAccount.conta}" `
      analysis += `para cobrir o negativo e manter buffer de segurança.\n\n`
    }

    if (totalVencido > 0) {
      analysis += `⚡ **Ação Imediata - Inadimplência:**\n`
      analysis += `1. Intensificar cobranças dos R$ ${totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vencidos\n`
      analysis += `2. Contatar clientes inadimplentes com urgência\n`
      analysis += `3. Considerar desconto para pagamento imediato\n\n`
    }

    if (totalAtrasado > 0) {
      analysis += `⚡ **Ação Imediata - Contas Atrasadas:**\n`
      analysis += `1. Priorizar pagamento dos R$ ${totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} atrasados\n`
      analysis += `2. Renegociar prazos se necessário\n`
      analysis += `3. Evitar juros e multas adicionais\n`
    }

    return analysis
  }

  private analyzeCashFlow(data: any[], insights: any[]): string {
    if (!data || data.length === 0) {
      return 'Não há dados de fluxo de caixa no período analisado.'
    }

    const totalInflow = data.reduce((sum, entry) =>
      sum + (entry.tipo === 'receita' ? (entry.valor || 0) : 0), 0
    )
    const totalOutflow = data.reduce((sum, entry) =>
      sum + (entry.tipo === 'despesa' ? (entry.valor || 0) : 0), 0
    )
    const netFlow = totalInflow - totalOutflow

    let analysis = `**📋 Resumo Executivo:**\n`
    analysis += `Período: Últimos 30 dias\n`
    analysis += `Entradas: R$ ${totalInflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    analysis += `Saídas: R$ ${totalOutflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    analysis += `Fluxo Líquido: R$ ${netFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`

    if (netFlow < 0) {
      analysis += `🔴 **ALERTA CRÍTICO:** Fluxo de caixa negativo!\n`
      analysis += `Você está gastando mais do que recebendo. Isso é insustentável.\n\n`

      analysis += `💡 **Ações Imediatas:**\n`
      analysis += `1. Revisar e cortar despesas não essenciais\n`
      analysis += `2. Intensificar cobranças de recebíveis\n`
      analysis += `3. Buscar adiantamento de receitas futuras\n`
      analysis += `4. Considerar linha de crédito para emergência\n\n`
    } else if (netFlow < totalInflow * 0.1) {
      analysis += `⚠️ **ATENÇÃO:** Margem de fluxo muito baixa (${(netFlow/totalInflow * 100).toFixed(1)}%).\n`
      analysis += `Recomendado: manter margem acima de 20%.\n\n`
    } else {
      analysis += `✅ **Fluxo Saudável:** Margem de ${(netFlow/totalInflow * 100).toFixed(1)}%.\n\n`
    }

    return analysis
  }

  private analyzeExecutiveDashboard(data: any[], insights: any[]): string {
    if (!data || data.length === 0) {
      return 'Dashboard ainda sem dados para análise.'
    }

    const kpis = data[0]

    let analysis = `**📋 Visão Geral do Negócio:**\n\n`

    if (kpis.total_receita) {
      analysis += `💰 Receita Total: R$ ${kpis.total_receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    }
    if (kpis.total_despesa) {
      analysis += `💸 Despesas: R$ ${kpis.total_despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    }
    if (kpis.total_clientes) {
      analysis += `👥 Clientes: ${kpis.total_clientes}\n`
    }
    if (kpis.total_os) {
      analysis += `📋 Ordens de Serviço: ${kpis.total_os}\n`
    }

    analysis += '\n'

    return analysis
  }

  private analyzeCustomerRFM(data: any[], insights: any[]): string {
    if (!data || data.length === 0) {
      return 'Não há dados de clientes para análise RFM.'
    }

    const champions = data.filter(c => c.rfm_segment === 'Champions')
    const atRisk = data.filter(c => c.rfm_segment === 'At Risk')
    const lost = data.filter(c => c.rfm_segment === 'Lost')

    let analysis = `**📋 Análise de Segmentação RFM:**\n\n`
    analysis += `Total de clientes analisados: ${data.length}\n\n`

    if (champions.length > 0) {
      analysis += `✅ **Champions** (${champions.length}): Seus melhores clientes!\n`
      analysis += `   Ação: Manter relacionamento VIP, oferecer serviços premium\n\n`
    }

    if (atRisk.length > 0) {
      analysis += `⚠️ **Em Risco** (${atRisk.length}): Clientes que estão esfriando\n`
      analysis += `   Ação: Contato proativo, oferta especial de reengajamento\n\n`
    }

    if (lost.length > 0) {
      analysis += `🔴 **Perdidos** (${lost.length}): Clientes inativos\n`
      analysis += `   Ação: Campanha de reativação, entender motivo da saída\n\n`
    }

    return analysis
  }

  private analyzeGenericData(data: any[], insights: any[]): string {
    return `Encontrei ${data.length} registros relacionados à sua consulta.\n\n`
  }

  private getSuggestionsForCapability(capabilityName: string): string[] {
    const suggestions: Record<string, string[]> = {
      'Análise de Posição de Caixa': ['Fluxo de caixa', 'Contas a pagar', 'Projeções'],
      'Análise de Fluxo de Caixa': ['Posição de caixa', 'Análise de inadimplência', 'Projeções'],
      'Dashboard Executivo': ['Análise financeira', 'Clientes', 'Ordens de serviço'],
      'Análise de Clientes RFM': ['Oportunidades CRM', 'Análise de vendas', 'Gamificação']
    }

    return suggestions[capabilityName] || ['Ver dashboard', 'Ajuda']
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

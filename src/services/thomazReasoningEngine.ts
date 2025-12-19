import { supabase } from '../lib/supabase'

export interface ReasoningStep {
  step: number
  thought: string
  action?: string
  result?: any
  confidence: number
}

export interface ReasoningResult {
  result: string
  steps: ReasoningStep[]
  confidence: number
  sources: string[]
  recommendations: string[]
  dataInsights?: any
}

export interface AnalysisContext {
  query: string
  userId?: string
  userRole: string
  companyId?: string
  availableData?: any
  conversationHistory?: any[]
}

export class ThomazReasoningEngine {
  async reason(input: string, context?: AnalysisContext): Promise<ReasoningResult> {
    const steps: ReasoningStep[] = []
    const sources: string[] = []
    const recommendations: string[] = []

    steps.push({
      step: 1,
      thought: 'Analisando intenção do usuário e identificando tipo de pergunta',
      confidence: 0.95
    })

    const queryType = this.classifyQuery(input)
    const relevantData = await this.gatherRelevantData(queryType, context)

    steps.push({
      step: 2,
      thought: `Pergunta classificada como: ${queryType}. Coletando dados relevantes.`,
      result: relevantData,
      confidence: 0.90
    })

    const analysis = await this.analyzeData(relevantData, queryType)

    steps.push({
      step: 3,
      thought: 'Realizando análise profunda dos dados coletados',
      result: analysis,
      confidence: 0.88
    })

    const insights = this.generateInsights(analysis, queryType)

    steps.push({
      step: 4,
      thought: 'Gerando insights e recomendações acionáveis',
      result: insights,
      confidence: 0.92
    })

    recommendations.push(...insights.recommendations)
    sources.push(...insights.sources)

    const finalAnswer = this.synthesizeAnswer(input, steps, insights)

    return {
      result: finalAnswer,
      steps,
      confidence: this.calculateOverallConfidence(steps),
      sources,
      recommendations,
      dataInsights: analysis
    }
  }

  private classifyQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return 'general'
    }
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('financeiro') || lowerQuery.includes('receita') ||
        lowerQuery.includes('lucro') || lowerQuery.includes('custo') ||
        lowerQuery.includes('margem') || lowerQuery.includes('faturamento')) {
      return 'financial'
    }

    if (lowerQuery.includes('ordem') || lowerQuery.includes('os') ||
        lowerQuery.includes('serviço') || lowerQuery.includes('atendimento')) {
      return 'operational'
    }

    if (lowerQuery.includes('cliente') || lowerQuery.includes('crm') ||
        lowerQuery.includes('venda') || lowerQuery.includes('lead')) {
      return 'customer'
    }

    if (lowerQuery.includes('estoque') || lowerQuery.includes('material') ||
        lowerQuery.includes('inventário') || lowerQuery.includes('compra')) {
      return 'inventory'
    }

    if (lowerQuery.includes('funcionário') || lowerQuery.includes('equipe') ||
        lowerQuery.includes('salário') || lowerQuery.includes('rh')) {
      return 'hr'
    }

    if (lowerQuery.includes('como') || lowerQuery.includes('onde') ||
        lowerQuery.includes('usar') || lowerQuery.includes('funciona')) {
      return 'howto'
    }

    return 'general'
  }

  private async gatherRelevantData(queryType: string, context?: AnalysisContext): Promise<any> {
    const data: any = {}

    try {
      switch (queryType) {
        case 'financial':
          data.finances = await this.getFinancialData()
          data.kpis = await this.getKPIData()
          break

        case 'operational':
          data.serviceOrders = await this.getServiceOrdersData()
          data.performance = await this.getPerformanceData()
          break

        case 'customer':
          data.customers = await this.getCustomersData()
          data.rfm = await this.getRFMData()
          break

        case 'inventory':
          data.inventory = await this.getInventoryData()
          data.lowStock = await this.getLowStockItems()
          break

        case 'hr':
          data.employees = await this.getEmployeesData()
          data.performance = await this.getEmployeePerformance()
          break

        case 'howto':
          data.documentation = await this.getRelevantDocumentation(context?.query || '')
          break
      }

      data.systemMetrics = await this.getSystemMetrics()
    } catch (error) {
      console.error('Error gathering data:', error)
    }

    return data
  }

  private async getFinancialData(): Promise<any> {
    const { data: entries } = await supabase
      .from('finance_entries')
      .select('*')
      .order('due_date', { ascending: false })
      .limit(100)

    const { data: totals } = await supabase
      .rpc('get_financial_summary')
      .single()

    return { entries, totals }
  }

  private async getKPIData(): Promise<any> {
    const { data } = await supabase
      .from('v_business_kpis')
      .select('*')
      .single()

    return data
  }

  private async getServiceOrdersData(): Promise<any> {
    const { data } = await supabase
      .from('service_orders')
      .select('*, customers(*)')
      .order('created_at', { ascending: false })
      .limit(50)

    return data
  }

  private async getPerformanceData(): Promise<any> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data } = await supabase
      .from('service_orders')
      .select('status, total_value, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    return data
  }

  private async getCustomersData(): Promise<any> {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    return data
  }

  private async getRFMData(): Promise<any> {
    const { data } = await supabase
      .from('v_customer_rfm_analysis')
      .select('*')
      .order('rfm_score', { ascending: false })
      .limit(50)

    return data
  }

  private async getInventoryData(): Promise<any> {
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .order('quantity', { ascending: true })
      .limit(100)

    return data
  }

  private async getLowStockItems(): Promise<any> {
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .lt('quantity', supabase.sql`minimum_stock`)
      .order('quantity', { ascending: true })

    return data
  }

  private async getEmployeesData(): Promise<any> {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)

    return data
  }

  private async getEmployeePerformance(): Promise<any> {
    const { data } = await supabase
      .from('service_order_labor')
      .select(`
        employee_id,
        employees(name),
        hours_worked,
        labor_cost
      `)

    return data
  }

  private async getRelevantDocumentation(query: string): Promise<any> {
    const { data } = await supabase
      .from('thomaz_knowledge_base')
      .select('*')
      .textSearch('content', query)
      .limit(5)

    return data
  }

  private async getSystemMetrics(): Promise<any> {
    const { data: userCount } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact' })

    const { data: activeOS } = await supabase
      .from('service_orders')
      .select('id', { count: 'exact' })
      .in('status', ['em_andamento', 'aguardando'])

    return {
      userCount: userCount?.length || 0,
      activeServiceOrders: activeOS?.length || 0
    }
  }

  private analyzeData(data: any, queryType: string): any {
    const analysis: any = {
      summary: {},
      trends: [],
      alerts: [],
      opportunities: []
    }

    switch (queryType) {
      case 'financial':
        analysis.summary = this.analyzeFinancials(data.finances, data.kpis)
        break

      case 'operational':
        analysis.summary = this.analyzeOperations(data.serviceOrders, data.performance)
        break

      case 'customer':
        analysis.summary = this.analyzeCustomers(data.customers, data.rfm)
        break

      case 'inventory':
        analysis.summary = this.analyzeInventory(data.inventory, data.lowStock)
        break

      case 'hr':
        analysis.summary = this.analyzeHR(data.employees, data.performance)
        break
    }

    return analysis
  }

  private analyzeFinancials(finances: any, kpis: any): any {
    const receitas = finances?.entries?.filter((e: any) => e.entry_type === 'receita') || []
    const despesas = finances?.entries?.filter((e: any) => e.entry_type === 'despesa') || []

    const totalReceitas = receitas.reduce((sum: number, r: any) => sum + (r.amount || 0), 0)
    const totalDespesas = despesas.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)

    const margem = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0

    return {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      margem: margem.toFixed(2),
      status: margem > 30 ? 'excelente' : margem > 20 ? 'bom' : margem > 10 ? 'atenção' : 'crítico',
      kpis
    }
  }

  private analyzeOperations(orders: any, performance: any): any {
    const total = orders?.length || 0
    const concluidas = orders?.filter((o: any) => o.status === 'concluida')?.length || 0
    const emAndamento = orders?.filter((o: any) => o.status === 'em_andamento')?.length || 0
    const atrasadas = orders?.filter((o: any) => o.status === 'atrasada')?.length || 0

    const taxaConclusao = total > 0 ? (concluidas / total) * 100 : 0

    return {
      total,
      concluidas,
      emAndamento,
      atrasadas,
      taxaConclusao: taxaConclusao.toFixed(2),
      status: taxaConclusao > 90 ? 'excelente' : taxaConclusao > 75 ? 'bom' : 'atenção'
    }
  }

  private analyzeCustomers(customers: any, rfm: any): any {
    const total = customers?.length || 0
    const champions = rfm?.filter((c: any) => c.rfm_segment === 'Champions')?.length || 0
    const atRisk = rfm?.filter((c: any) => c.rfm_segment === 'At Risk')?.length || 0

    return {
      total,
      champions,
      atRisk,
      healthScore: total > 0 ? ((champions / total) * 100).toFixed(2) : 0
    }
  }

  private analyzeInventory(inventory: any, lowStock: any): any {
    const total = inventory?.length || 0
    const lowStockCount = lowStock?.length || 0

    return {
      totalItems: total,
      lowStockItems: lowStockCount,
      criticalPercentage: total > 0 ? ((lowStockCount / total) * 100).toFixed(2) : 0,
      status: lowStockCount === 0 ? 'excelente' : lowStockCount < 5 ? 'bom' : 'atenção'
    }
  }

  private analyzeHR(employees: any, performance: any): any {
    const total = employees?.length || 0

    return {
      totalEmployees: total,
      activeEmployees: employees?.filter((e: any) => e.is_active)?.length || 0
    }
  }

  private generateInsights(analysis: any, queryType: string): any {
    const insights: any = {
      recommendations: [],
      sources: [],
      nextActions: []
    }

    switch (queryType) {
      case 'financial':
        if (analysis.summary.margem < 20) {
          insights.recommendations.push('⚠️ Margem abaixo de 20%. Recomendo: revisar precificação e negociar com fornecedores.')
        }
        if (analysis.summary.margem > 30) {
          insights.recommendations.push('✅ Margem saudável! Considere investir em crescimento ou reserva de caixa.')
        }
        insights.sources.push('Análise de Finance Entries')
        insights.nextActions.push('Revisar maiores despesas do mês')
        break

      case 'operational':
        if (analysis.summary.taxaConclusao < 75) {
          insights.recommendations.push('⚠️ Taxa de conclusão baixa. Verificar gargalos operacionais.')
        }
        if (analysis.summary.atrasadas > 0) {
          insights.recommendations.push(`🚨 ${analysis.summary.atrasadas} OS atrasadas. Priorizar conclusão imediata.`)
        }
        insights.sources.push('Análise de Service Orders')
        insights.nextActions.push('Redistribuir OS em andamento')
        break

      case 'customer':
        if (analysis.summary.atRisk > 0) {
          insights.recommendations.push(`⚠️ ${analysis.summary.atRisk} clientes em risco. Implementar campanha de reativação.`)
        }
        insights.recommendations.push(`✅ ${analysis.summary.champions} clientes Champions. Considere programa de fidelidade.`)
        insights.sources.push('Análise RFM de Clientes')
        insights.nextActions.push('Criar campanha para clientes em risco')
        break

      case 'inventory':
        if (analysis.summary.lowStockItems > 0) {
          insights.recommendations.push(`🚨 ${analysis.summary.lowStockItems} itens com estoque baixo. Gerar ordem de compra urgente.`)
        }
        insights.sources.push('Análise de Inventário')
        insights.nextActions.push('Revisar mínimos e máximos de estoque')
        break
    }

    return insights
  }

  private synthesizeAnswer(query: string, steps: ReasoningStep[], insights: any): string {
    let answer = `**Análise Completa: ${query}**\n\n`

    answer += `**📊 Raciocínio (${steps.length} etapas):**\n`
    steps.forEach(step => {
      answer += `${step.step}. ${step.thought} (Confiança: ${(step.confidence * 100).toFixed(0)}%)\n`
    })

    answer += `\n**💡 Insights e Recomendações:**\n`
    insights.recommendations.forEach((rec: string) => {
      answer += `• ${rec}\n`
    })

    answer += `\n**📚 Fontes Consultadas:**\n`
    insights.sources.forEach((source: string) => {
      answer += `• ${source}\n`
    })

    answer += `\n**🎯 Próximas Ações:**\n`
    insights.nextActions.forEach((action: string) => {
      answer += `• ${action}\n`
    })

    return answer
  }

  private calculateOverallConfidence(steps: ReasoningStep[]): number {
    const avgConfidence = steps.reduce((sum, step) => sum + step.confidence, 0) / steps.length
    return avgConfidence
  }
}

export const reason = async (input: string, context?: AnalysisContext): Promise<ReasoningResult> => {
  const engine = new ThomazReasoningEngine()
  return engine.reason(input, context)
}

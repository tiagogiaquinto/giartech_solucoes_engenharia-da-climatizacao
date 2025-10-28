/**
 * Thomaz Data Service - Consulta de Dados Reais da Empresa
 *
 * Integra o Thomaz AI com todas as tabelas do banco de dados
 * para fornecer respostas baseadas em dados reais e atualizados.
 */

import { supabase } from '../lib/supabase'

export interface DataQueryResult {
  success: boolean
  data: any[]
  summary: string
  totalRecords: number
  insights?: string[]
  visualizationType?: 'table' | 'chart' | 'metric' | 'timeline'
}

export class ThomazDataService {
  /**
   * DASHBOARD E MÉTRICAS PRINCIPAIS
   */
  async getDashboardMetrics(): Promise<DataQueryResult> {
    try {
      // Buscar dados de múltiplas fontes
      const [orders, customers, inventory, finance] = await Promise.all([
        this.getServiceOrdersMetrics(),
        this.getCustomersMetrics(),
        this.getInventoryMetrics(),
        this.getFinancialMetrics()
      ])

      const summary = `**Dashboard Giartech - Visão Geral**

📊 **Ordens de Serviço:**
• Total: ${orders.total}
• Abertas: ${orders.open}
• Em andamento: ${orders.inProgress}
• Concluídas: ${orders.completed}
• Taxa de conclusão: ${orders.completionRate}%

👥 **Clientes:**
• Total de clientes: ${customers.total}
• Ativos no mês: ${customers.activeThisMonth}
• Novos este mês: ${customers.newThisMonth}

📦 **Estoque:**
• Total de itens: ${inventory.totalItems}
• Valor total: R$ ${inventory.totalValue.toLocaleString('pt-BR')}
• Itens em baixa: ${inventory.lowStock}

💰 **Financeiro:**
• Receita do mês: R$ ${finance.monthRevenue.toLocaleString('pt-BR')}
• Contas a receber: R$ ${finance.accountsReceivable.toLocaleString('pt-BR')}
• Margem média: ${finance.averageMargin}%`

      return {
        success: true,
        data: [{ orders, customers, inventory, finance }],
        summary,
        totalRecords: 1,
        visualizationType: 'metric',
        insights: [
          orders.completionRate > 80 ? 'Excelente taxa de conclusão de ordens!' : 'Atenção: Taxa de conclusão pode melhorar',
          inventory.lowStock > 0 ? `${inventory.lowStock} itens precisam de reposição` : 'Estoque em bons níveis',
          finance.averageMargin > 40 ? 'Margem de lucro saudável' : 'Oportunidade de melhorar a margem'
        ]
      }
    } catch (error) {
      console.error('Dashboard metrics error:', error)
      return {
        success: false,
        data: [],
        summary: 'Erro ao buscar métricas do dashboard',
        totalRecords: 0
      }
    }
  }

  /**
   * ORDENS DE SERVIÇO
   */
  async getServiceOrdersMetrics() {
    const { data: orders } = await supabase
      .from('service_orders')
      .select('id, status, final_total, created_at')

    const total = orders?.length || 0
    const open = orders?.filter(o => o.status === 'aberta').length || 0
    const inProgress = orders?.filter(o => o.status === 'em_andamento').length || 0
    const completed = orders?.filter(o => o.status === 'concluida').length || 0
    const completionRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0

    return { total, open, inProgress, completed, completionRate }
  }

  async searchServiceOrders(filters: {
    status?: string
    customerId?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
  }): Promise<DataQueryResult> {
    try {
      let query = supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(nome_razao, cnpj_cpf, email, telefone),
          items:service_order_items(*)
        `)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      query = query.limit(filters.limit || 10).order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      const summary = this.formatServiceOrdersSummary(data || [])

      return {
        success: true,
        data: data || [],
        summary,
        totalRecords: data?.length || 0,
        visualizationType: 'table'
      }
    } catch (error) {
      console.error('Service orders search error:', error)
      return {
        success: false,
        data: [],
        summary: 'Erro ao buscar ordens de serviço',
        totalRecords: 0
      }
    }
  }

  private formatServiceOrdersSummary(orders: any[]): string {
    if (orders.length === 0) {
      return 'Nenhuma ordem de serviço encontrada com os filtros especificados.'
    }

    const totalValue = orders.reduce((sum, o) => sum + (o.final_total || 0), 0)
    const byStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    let summary = `**${orders.length} Ordens de Serviço Encontradas**

💰 Valor Total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

📊 Por Status:\n`

    Object.entries(byStatus).forEach(([status, count]) => {
      const emoji = status === 'concluida' ? '✅' : status === 'em_andamento' ? '⏳' : '📋'
      summary += `${emoji} ${status}: ${count}\n`
    })

    summary += `\n**Últimas Ordens:**\n`
    orders.slice(0, 5).forEach(order => {
      summary += `\n• **OS-${order.order_number}** - ${order.customer?.nome_razao || 'Cliente não identificado'}\n`
      summary += `  Status: ${order.status} | Valor: R$ ${(order.final_total || 0).toLocaleString('pt-BR')}\n`
    })

    return summary
  }

  /**
   * CLIENTES
   */
  async getCustomersMetrics() {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, created_at')

    const total = customers?.length || 0
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const activeThisMonth = customers?.filter(c => {
      const created = new Date(c.created_at)
      return created >= thisMonth
    }).length || 0

    const newThisMonth = activeThisMonth

    return { total, activeThisMonth, newThisMonth }
  }

  async searchCustomers(filters: {
    search?: string
    limit?: number
  }): Promise<DataQueryResult> {
    try {
      let query = supabase
        .from('customers')
        .select('*')

      if (filters.search) {
        query = query.or(`nome_razao.ilike.%${filters.search}%,cnpj_cpf.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      query = query.limit(filters.limit || 10).order('nome_razao')

      const { data, error } = await query

      if (error) throw error

      const summary = this.formatCustomersSummary(data || [])

      return {
        success: true,
        data: data || [],
        summary,
        totalRecords: data?.length || 0,
        visualizationType: 'table'
      }
    } catch (error) {
      console.error('Customers search error:', error)
      return {
        success: false,
        data: [],
        summary: 'Erro ao buscar clientes',
        totalRecords: 0
      }
    }
  }

  private formatCustomersSummary(customers: any[]): string {
    if (customers.length === 0) {
      return 'Nenhum cliente encontrado.'
    }

    let summary = `**${customers.length} Clientes Encontrados**\n\n`

    customers.slice(0, 10).forEach(customer => {
      summary += `👤 **${customer.nome_razao}**\n`
      if (customer.cnpj_cpf) summary += `   CNPJ/CPF: ${customer.cnpj_cpf}\n`
      if (customer.email) summary += `   📧 ${customer.email}\n`
      if (customer.telefone) summary += `   📱 ${customer.telefone}\n`
      if (customer.cidade) summary += `   📍 ${customer.cidade}/${customer.estado}\n`
      summary += `\n`
    })

    return summary
  }

  /**
   * ESTOQUE
   */
  async getInventoryMetrics() {
    const { data: items } = await supabase
      .from('inventory_items')
      .select('id, quantidade, preco_unitario, estoque_minimo')

    const totalItems = items?.length || 0
    const totalValue = items?.reduce((sum, item) =>
      sum + (item.quantidade * item.preco_unitario), 0
    ) || 0
    const lowStock = items?.filter(item =>
      item.quantidade <= (item.estoque_minimo || 0)
    ).length || 0

    return { totalItems, totalValue, lowStock }
  }

  async searchInventory(filters: {
    search?: string
    lowStock?: boolean
    limit?: number
  }): Promise<DataQueryResult> {
    try {
      let query = supabase
        .from('inventory_items')
        .select('*')

      if (filters.search) {
        query = query.or(`nome.ilike.%${filters.search}%,codigo_sku.ilike.%${filters.search}%`)
      }

      query = query.limit(filters.limit || 10).order('nome')

      const { data, error } = await query

      if (error) throw error

      let filteredData = data || []
      if (filters.lowStock) {
        filteredData = filteredData.filter(item =>
          item.quantidade <= (item.estoque_minimo || 0)
        )
      }

      const summary = this.formatInventorySummary(filteredData)

      return {
        success: true,
        data: filteredData,
        summary,
        totalRecords: filteredData.length,
        visualizationType: 'table',
        insights: filters.lowStock && filteredData.length > 0 ? [
          `⚠️ ${filteredData.length} itens precisam de reposição urgente!`
        ] : undefined
      }
    } catch (error) {
      console.error('Inventory search error:', error)
      return {
        success: false,
        data: [],
        summary: 'Erro ao buscar estoque',
        totalRecords: 0
      }
    }
  }

  private formatInventorySummary(items: any[]): string {
    if (items.length === 0) {
      return 'Nenhum item encontrado no estoque.'
    }

    const totalValue = items.reduce((sum, item) =>
      sum + (item.quantidade * item.preco_unitario), 0
    )

    let summary = `**${items.length} Itens no Estoque**\n\n`
    summary += `💰 Valor Total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`

    items.slice(0, 10).forEach(item => {
      const lowStock = item.quantidade <= (item.estoque_minimo || 0)
      const emoji = lowStock ? '⚠️' : '📦'

      summary += `${emoji} **${item.nome}**\n`
      if (item.codigo_sku) summary += `   SKU: ${item.codigo_sku}\n`
      summary += `   Quantidade: ${item.quantidade} ${item.unidade || 'un'}\n`
      summary += `   Valor unitário: R$ ${item.preco_unitario.toLocaleString('pt-BR')}\n`
      if (lowStock) summary += `   ⚠️ Estoque abaixo do mínimo (${item.estoque_minimo})\n`
      summary += `\n`
    })

    return summary
  }

  /**
   * FINANCEIRO
   */
  async getFinancialMetrics() {
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const { data: entries } = await supabase
      .from('finance_entries')
      .select('tipo, valor, status')
      .gte('data_vencimento', thisMonth.toISOString())

    const revenue = entries?.filter(e =>
      e.tipo === 'receita' && e.status === 'pago'
    ).reduce((sum, e) => sum + e.valor, 0) || 0

    const expenses = entries?.filter(e =>
      e.tipo === 'despesa' && e.status === 'pago'
    ).reduce((sum, e) => sum + e.valor, 0) || 0

    const receivable = entries?.filter(e =>
      e.tipo === 'receita' && e.status === 'pendente'
    ).reduce((sum, e) => sum + e.valor, 0) || 0

    const margin = revenue > 0 ? (((revenue - expenses) / revenue) * 100).toFixed(1) : 0

    return {
      monthRevenue: revenue,
      monthExpenses: expenses,
      accountsReceivable: receivable,
      averageMargin: parseFloat(margin as string)
    }
  }

  async searchFinancialEntries(filters: {
    type?: 'receita' | 'despesa'
    status?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
  }): Promise<DataQueryResult> {
    try {
      let query = supabase
        .from('finance_entries')
        .select(`
          *,
          category:financial_categories(nome, tipo)
        `)

      if (filters.type) {
        query = query.eq('tipo', filters.type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.dateFrom) {
        query = query.gte('data_vencimento', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('data_vencimento', filters.dateTo)
      }

      query = query.limit(filters.limit || 10).order('data_vencimento', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      const summary = this.formatFinancialSummary(data || [])

      return {
        success: true,
        data: data || [],
        summary,
        totalRecords: data?.length || 0,
        visualizationType: 'table'
      }
    } catch (error) {
      console.error('Financial entries search error:', error)
      return {
        success: false,
        data: [],
        summary: 'Erro ao buscar lançamentos financeiros',
        totalRecords: 0
      }
    }
  }

  private formatFinancialSummary(entries: any[]): string {
    if (entries.length === 0) {
      return 'Nenhum lançamento financeiro encontrado.'
    }

    const totalReceita = entries.filter(e => e.tipo === 'receita')
      .reduce((sum, e) => sum + e.valor, 0)
    const totalDespesa = entries.filter(e => e.tipo === 'despesa')
      .reduce((sum, e) => sum + e.valor, 0)
    const balance = totalReceita - totalDespesa

    let summary = `**${entries.length} Lançamentos Financeiros**\n\n`
    summary += `💰 Receitas: R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    summary += `💸 Despesas: R$ ${totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    summary += `${balance >= 0 ? '✅' : '⚠️'} Saldo: R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`

    summary += `**Últimos Lançamentos:**\n`
    entries.slice(0, 5).forEach(entry => {
      const emoji = entry.tipo === 'receita' ? '💰' : '💸'
      const statusEmoji = entry.status === 'pago' ? '✅' : '⏳'

      summary += `\n${emoji} **${entry.descricao}**\n`
      summary += `   Valor: R$ ${entry.valor.toLocaleString('pt-BR')}\n`
      summary += `   ${statusEmoji} Status: ${entry.status}\n`
      if (entry.category) summary += `   Categoria: ${entry.category.nome}\n`
    })

    return summary
  }

  /**
   * FUNCIONÁRIOS
   */
  async searchEmployees(filters: {
    search?: string
    department?: string
    limit?: number
  }): Promise<DataQueryResult> {
    try {
      let query = supabase
        .from('employees')
        .select('*')

      if (filters.search) {
        query = query.or(`nome.ilike.%${filters.search}%,cargo.ilike.%${filters.search}%`)
      }
      if (filters.department) {
        query = query.eq('departamento', filters.department)
      }

      query = query.limit(filters.limit || 10).order('nome')

      const { data, error } = await query

      if (error) throw error

      const summary = this.formatEmployeesSummary(data || [])

      return {
        success: true,
        data: data || [],
        summary,
        totalRecords: data?.length || 0,
        visualizationType: 'table'
      }
    } catch (error) {
      console.error('Employees search error:', error)
      return {
        success: false,
        data: [],
        summary: 'Erro ao buscar funcionários',
        totalRecords: 0
      }
    }
  }

  private formatEmployeesSummary(employees: any[]): string {
    if (employees.length === 0) {
      return 'Nenhum funcionário encontrado.'
    }

    let summary = `**${employees.length} Funcionários Encontrados**\n\n`

    employees.slice(0, 10).forEach(emp => {
      summary += `👤 **${emp.nome}**\n`
      if (emp.cargo) summary += `   Cargo: ${emp.cargo}\n`
      if (emp.departamento) summary += `   Departamento: ${emp.departamento}\n`
      if (emp.email) summary += `   📧 ${emp.email}\n`
      if (emp.telefone) summary += `   📱 ${emp.telefone}\n`
      summary += `\n`
    })

    return summary
  }

  /**
   * QUERY GENÉRICA INTELIGENTE
   */
  async intelligentQuery(userQuery: string): Promise<DataQueryResult> {
    const lowerQuery = userQuery.toLowerCase()

    // Detectar tipo de consulta
    if (/dashboard|vis[aã]o.*geral|resumo.*empresa|m[eé]tricas/i.test(lowerQuery)) {
      return this.getDashboardMetrics()
    }

    if (/ordem.*servi[cç]o|os\s|projeto/i.test(lowerQuery)) {
      const filters: any = {}

      if (/aberta|pendente/i.test(lowerQuery)) filters.status = 'aberta'
      if (/andamento|execu[cç][aã]o/i.test(lowerQuery)) filters.status = 'em_andamento'
      if (/conclu[ií]da|finalizada/i.test(lowerQuery)) filters.status = 'concluida'

      return this.searchServiceOrders(filters)
    }

    if (/cliente|customer/i.test(lowerQuery)) {
      const searchMatch = lowerQuery.match(/cliente\s+(.+)/i)
      return this.searchCustomers({
        search: searchMatch ? searchMatch[1] : undefined
      })
    }

    if (/estoque|invent[aá]rio|material|produto/i.test(lowerQuery)) {
      const filters: any = {}
      if (/baixo|repor|reposi[cç][aã]o|m[ií]nimo/i.test(lowerQuery)) {
        filters.lowStock = true
      }
      return this.searchInventory(filters)
    }

    if (/financ|receita|despesa|pagamento|lan[cç]amento/i.test(lowerQuery)) {
      const filters: any = {}
      if (/receita/i.test(lowerQuery)) filters.type = 'receita'
      if (/despesa/i.test(lowerQuery)) filters.type = 'despesa'
      if (/pendente|aberto|pagar/i.test(lowerQuery)) filters.status = 'pendente'
      if (/pago|quitado/i.test(lowerQuery)) filters.status = 'pago'

      return this.searchFinancialEntries(filters)
    }

    if (/funcion[aá]rio|colaborador|equipe|time/i.test(lowerQuery)) {
      return this.searchEmployees({})
    }

    // Fallback: Dashboard geral
    return this.getDashboardMetrics()
  }
}

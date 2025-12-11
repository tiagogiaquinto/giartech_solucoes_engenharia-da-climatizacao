import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Target, Users, DollarSign, Package,
  Clock, CheckCircle, AlertCircle, BarChart3, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, Percent, Calendar
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface BusinessKPI {
  total_completed_orders: number
  orders_in_progress: number
  cancelled_orders: number
  total_revenue: number
  avg_order_value: number
  conversion_rate: number
  avg_service_time_hours: number
  total_customers: number
  active_customers: number
  materials_in_stock: number
  total_inventory_value: number
  potential_profit: number
  total_income: number
  total_expenses: number
  accounts_receivable: number
  accounts_payable: number
  active_employees: number
  total_payroll: number
  net_profit: number
  profit_margin: number
}

interface ServicePerformance {
  service_name: string
  total_orders: number
  completed_orders: number
  completion_rate: number
  total_revenue: number
  avg_revenue_per_service: number
  avg_completion_time_hours: number
  unique_customers: number
}

interface CustomerProfitability {
  customer_name: string
  company_name: string
  total_orders: number
  total_revenue: number
  avg_order_value: number
  total_material_cost: number
  gross_profit: number
  profit_margin: number
  days_since_last_order: number
}

interface TeamProductivity {
  employee_name: string
  role: string
  total_orders_assigned: number
  completed_orders: number
  completion_rate: number
  total_revenue_generated: number
  avg_completion_time_hours: number
  monthly_salary: number
  revenue_to_salary_ratio: number
}

const KPIDashboard = () => {
  const [kpis, setKpis] = useState<BusinessKPI | null>(null)
  const [servicePerf, setServicePerf] = useState<ServicePerformance[]>([])
  const [customerProf, setCustomerProf] = useState<CustomerProfitability[]>([])
  const [teamProd, setTeamProd] = useState<TeamProductivity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'customers' | 'team'>('overview')
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'semester' | 'year'>('month')
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  useEffect(() => {
    loadKPIData()
  }, [timeRange, customDateStart, customDateEnd])

  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()

    if (showCustomDatePicker && customDateStart && customDateEnd) {
      return {
        start: new Date(customDateStart).toISOString(),
        end: new Date(customDateEnd).toISOString()
      }
    }

    switch (timeRange) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
        break
      case 'semester':
        const currentSemester = now.getMonth() < 6 ? 0 : 6
        startDate = new Date(now.getFullYear(), currentSemester, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }
  }

  const loadKPIData = async () => {
    try {
      setLoading(true)

      const dateRange = getDateRange()

      const [kpisResult, serviceResult, customerResult, teamResult] = await Promise.all([
        supabase.from('v_business_kpis').select('*').maybeSingle(),
        supabase.from('service_orders')
          .select(`
            service_order_items!inner(
              service_catalog(name),
              subtotal
            ),
            created_at,
            status
          `)
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end),
        supabase.from('service_orders')
          .select(`
            customers!inner(name, company_name),
            total,
            total_cost,
            created_at
          `)
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end),
        supabase.from('service_orders')
          .select(`
            service_order_team!inner(
              employees(name, role)
            ),
            total,
            created_at,
            status
          `)
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      ])

      if (kpisResult.data) setKpis(kpisResult.data)

      if (serviceResult.data) {
        const servicesMap = new Map<string, ServicePerformance>()

        serviceResult.data.forEach((order: any) => {
          order.service_order_items?.forEach((item: any) => {
            const serviceName = item.service_catalog?.name || 'Sem Serviço'
            const existing = servicesMap.get(serviceName) || {
              service_name: serviceName,
              total_orders: 0,
              completed_orders: 0,
              completion_rate: 0,
              total_revenue: 0,
              avg_revenue_per_service: 0,
              avg_completion_time_hours: 0,
              unique_customers: 0
            }

            existing.total_orders++
            if (order.status === 'concluido') existing.completed_orders++
            existing.total_revenue += Number(item.subtotal || 0)

            servicesMap.set(serviceName, existing)
          })
        })

        const services = Array.from(servicesMap.values()).map(s => ({
          ...s,
          completion_rate: (s.completed_orders / s.total_orders) * 100,
          avg_revenue_per_service: s.total_revenue / s.total_orders
        }))

        setServicePerf(services.sort((a, b) => b.total_revenue - a.total_revenue))
      }

      if (customerResult.data) {
        const customersMap = new Map<string, CustomerProfitability>()

        customerResult.data.forEach((order: any) => {
          const customerName = order.customers?.name || 'Cliente Desconhecido'
          const existing = customersMap.get(customerName) || {
            customer_name: customerName,
            company_name: order.customers?.company_name || '',
            total_orders: 0,
            total_revenue: 0,
            avg_order_value: 0,
            total_material_cost: 0,
            gross_profit: 0,
            profit_margin: 0,
            days_since_last_order: 0
          }

          existing.total_orders++
          existing.total_revenue += Number(order.total || 0)
          existing.total_material_cost += Number(order.total_cost || 0)

          customersMap.set(customerName, existing)
        })

        const customers = Array.from(customersMap.values()).map(c => ({
          ...c,
          avg_order_value: c.total_revenue / c.total_orders,
          gross_profit: c.total_revenue - c.total_material_cost,
          profit_margin: ((c.total_revenue - c.total_material_cost) / c.total_revenue) * 100
        }))

        setCustomerProf(customers.sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 20))
      }

      if (teamResult.data) {
        const teamMap = new Map<string, TeamProductivity>()

        teamResult.data.forEach((order: any) => {
          order.service_order_team?.forEach((member: any) => {
            const employeeName = member.employees?.name || 'Funcionário'
            const existing = teamMap.get(employeeName) || {
              employee_name: employeeName,
              role: member.employees?.role || '',
              total_orders_assigned: 0,
              completed_orders: 0,
              completion_rate: 0,
              total_revenue_generated: 0,
              avg_completion_time_hours: 0,
              monthly_salary: 0,
              revenue_to_salary_ratio: 0
            }

            existing.total_orders_assigned++
            if (order.status === 'concluido') existing.completed_orders++
            existing.total_revenue_generated += Number(order.total || 0)

            teamMap.set(employeeName, existing)
          })
        })

        const team = Array.from(teamMap.values()).map(t => ({
          ...t,
          completion_rate: (t.completed_orders / t.total_orders_assigned) * 100,
          revenue_to_salary_ratio: t.monthly_salary > 0 ? t.total_revenue_generated / t.monthly_salary : 0
        }))

        setTeamProd(team.sort((a, b) => b.total_revenue_generated - a.total_revenue_generated))
      }
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '0.0%'
    return `${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const mainKPIs = [
    {
      title: 'Taxa de Conversão',
      value: formatPercent(kpis?.conversion_rate || 0),
      target: '80%',
      progress: (kpis?.conversion_rate || 0),
      icon: Target,
      color: 'blue',
      trend: (kpis?.conversion_rate || 0) >= 80 ? 'up' : 'down'
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(kpis?.avg_order_value || 0),
      target: 'R$ 5.000',
      progress: ((kpis?.avg_order_value || 0) / 5000) * 100,
      icon: DollarSign,
      color: 'green',
      trend: 'up'
    },
    {
      title: 'Margem de Lucro',
      value: formatPercent(kpis?.profit_margin || 0),
      target: '30%',
      progress: (kpis?.profit_margin || 0),
      icon: TrendingUp,
      color: 'purple',
      trend: (kpis?.profit_margin || 0) >= 30 ? 'up' : 'down'
    },
    {
      title: 'Tempo Médio Atendimento',
      value: `${((kpis?.avg_service_time_hours ?? 0) || 0).toFixed(1)}h`,
      target: '24h',
      progress: Math.min(100, ((24 - ((kpis?.avg_service_time_hours ?? 0) || 0)) / 24) * 100),
      icon: Clock,
      color: 'orange',
      trend: (kpis?.avg_service_time_hours || 0) <= 24 ? 'up' : 'down'
    }
  ]

  const operationalMetrics = [
    {
      label: 'OSs Concluídas',
      value: kpis?.total_completed_orders || 0,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50'
    },
    {
      label: 'OSs em Andamento',
      value: kpis?.orders_in_progress || 0,
      icon: Activity,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      label: 'Clientes Ativos',
      value: kpis?.active_customers || 0,
      icon: Users,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      label: 'Itens em Estoque',
      value: kpis?.materials_in_stock || 0,
      icon: Package,
      color: 'text-orange-600 bg-orange-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KPIs e OKRs</h2>
          <p className="text-gray-600 mt-1">Indicadores-chave de performance e objetivos</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Filter */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={showCustomDatePicker ? 'custom' : timeRange}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowCustomDatePicker(true)
                } else {
                  setShowCustomDatePicker(false)
                  setTimeRange(e.target.value as any)
                }
              }}
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700"
            >
              <option value="month">Mês Atual</option>
              <option value="quarter">Trimestre Atual</option>
              <option value="semester">Semestre Atual</option>
              <option value="year">Ano Atual</option>
              <option value="custom">Período Personalizado</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {showCustomDatePicker && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">até</span>
              <input
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          <button
            onClick={loadKPIData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Period Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        <span className="text-sm text-blue-900">
          {showCustomDatePicker && customDateStart && customDateEnd ? (
            <>Período: {new Date(customDateStart).toLocaleDateString('pt-BR')} até {new Date(customDateEnd).toLocaleDateString('pt-BR')}</>
          ) : (
            <>
              Análise: {
                timeRange === 'month' ? 'Mês Atual' :
                timeRange === 'quarter' ? 'Trimestre Atual' :
                timeRange === 'semester' ? 'Semestre Atual' :
                'Ano Atual'
              }
            </>
          )}
        </span>
      </div>

      {/* Main KPIs - OKRs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainKPIs.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${kpi.color}-50 rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`h-6 w-6 text-${kpi.color}-600`} />
              </div>
              {kpi.trend === 'up' ? (
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mb-2">{kpi.value}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Meta: {kpi.target}</span>
              <span className={`font-medium ${kpi.progress >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                {Math.min(100, kpi.progress || 0).toFixed(0)}%
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-${kpi.color}-600 h-2 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, kpi.progress)}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {operationalMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className={`${metric.color} rounded-xl p-4`}
          >
            <metric.icon className="h-8 w-8 mb-2" />
            <p className="text-2xl font-bold mb-1">{metric.value}</p>
            <p className="text-sm opacity-80">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'services', label: 'Serviços' },
            { id: 'customers', label: 'Clientes' },
            { id: 'team', label: 'Equipe' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Desempenho Financeiro</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Receita Total</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(kpis?.total_income || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Despesas Totais</span>
                      <span className="text-lg font-bold text-red-600">{formatCurrency(kpis?.total_expenses || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-green-300">
                      <span className="text-gray-900 font-semibold">Lucro Líquido</span>
                      <span className="text-xl font-bold text-green-700">{formatCurrency(kpis?.net_profit || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Potencial de Estoque</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Valor em Estoque</span>
                      <span className="text-lg font-bold text-purple-600">{formatCurrency(kpis?.total_inventory_value || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Lucro Potencial</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(kpis?.potential_profit || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-purple-300">
                      <span className="text-gray-900 font-semibold">Margem Potencial</span>
                      <span className="text-xl font-bold text-purple-700">
                        {formatPercent(((kpis?.potential_profit || 0) / (kpis?.total_inventory_value || 1)) * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contas a Receber e Pagar</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">A Receber</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(kpis?.accounts_receivable || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">A Pagar</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(kpis?.accounts_payable || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">OSs</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Taxa Conclusão</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receita Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ticket Médio</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tempo Médio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {servicePerf.map((service) => (
                    <tr key={service.service_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.service_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{service.total_orders}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.completion_rate >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {formatPercent(service.completion_rate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(service.total_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {formatCurrency(service.avg_revenue_per_service)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {(service.avg_completion_time_hours || 0).toFixed(1)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">OSs</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receita</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lucro Bruto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Margem</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Último Pedido</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerProf.map((customer) => (
                    <tr key={customer.customer_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.customer_name}</div>
                        {customer.company_name && (
                          <div className="text-sm text-gray-500">{customer.company_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{customer.total_orders}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(customer.total_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                        {formatCurrency(customer.gross_profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.profit_margin >= 30 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {formatPercent(customer.profit_margin)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {customer.days_since_last_order} dias
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colaborador</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">OSs</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Taxa Conclusão</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receita Gerada</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">ROI Salarial</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamProd.map((member) => (
                    <tr key={member.employee_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.employee_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {member.completed_orders}/{member.total_orders_assigned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.completion_rate >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {formatPercent(member.completion_rate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(member.total_revenue_generated)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.revenue_to_salary_ratio >= 5 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {(member.revenue_to_salary_ratio || 0).toFixed(1)}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KPIDashboard

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target, Award,
  Activity, BarChart3, PieChart as PieChartIcon, RefreshCw, Download,
  Bell, CheckCircle, XCircle, Clock, Calendar, ArrowUpRight, ArrowDownRight,
  Users, Package, FileText, Briefcase, Shield, Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface CFOKPIs {
  // Financeiro
  total_revenue: number
  total_expenses: number
  net_profit: number
  profit_margin: number
  ebitda: number
  ebitda_margin: number
  gross_margin: number
  operating_margin: number

  // Recebíveis e Pagáveis
  accounts_receivable: number
  accounts_payable: number
  net_working_capital: number

  // Clientes
  total_customers: number
  total_customers_pj: number
  total_customers_pf: number
  active_customers: number
  customer_retention_rate: number
  avg_customer_ltv: number

  // Ordens de Serviço
  total_completed_orders: number
  orders_in_progress: number
  avg_order_value: number
  total_revenue_from_orders: number
  avg_profit_per_order: number

  // Estoque
  total_inventory_cost: number
  total_inventory_value: number
  potential_profit: number
  inventory_turnover: number

  // Performance
  roi_percentage: number
  payback_period_days: number
  break_even_point: number
  operational_efficiency: number
}

interface FinancialAlert {
  id: string
  alert_type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  current_value: number
  threshold_value: number
  created_at: string
  is_active: boolean
}

interface CustomerIntelligence {
  customer_id: string
  customer_name: string
  customer_type: string
  credit_score: number
  risk_score: number
  abc_classification: string
  total_revenue: number
  total_orders: number
  avg_order_value: number
  last_purchase_date: string
  churn_probability: number
}

const CFODashboard = () => {
  const [kpis, setKpis] = useState<CFOKPIs | null>(null)
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [topCustomers, setTopCustomers] = useState<CustomerIntelligence[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    loadCFOData()

    // Refresh automático a cada 5 minutos
    const interval = setInterval(loadCFOData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedPeriod])

  const loadCFOData = async () => {
    try {
      setLoading(true)

      // Carregar KPIs do CFO
      const { data: kpisData, error: kpisError } = await supabase
        .from('v_cfo_kpis')
        .select('*')
        .maybeSingle()

      if (kpisError) throw kpisError

      // Carregar alertas ativos
      const { data: alertsData, error: alertsError } = await supabase
        .from('financial_alerts')
        .select('*')
        .eq('is_active', true)
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(10)

      if (alertsError) throw alertsError

      // Carregar inteligência de clientes (Top 10)
      const { data: customersData, error: customersError } = await supabase
        .from('v_customer_intelligence')
        .select('*')
        .order('total_revenue', { ascending: false })
        .limit(10)

      if (customersError) throw customersError

      setKpis(kpisData)
      setAlerts(alertsData || [])
      setTopCustomers(customersData || [])

    } catch (error: any) {
      console.error('Erro ao carregar dados CFO:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info': return <Bell className="h-5 w-5 text-blue-600" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getABCColor = (classification: string) => {
    switch (classification) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300'
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'C': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'Alto Risco', color: 'text-red-600' }
    if (score >= 40) return { label: 'Risco Médio', color: 'text-yellow-600' }
    return { label: 'Baixo Risco', color: 'text-green-600' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  const executiveKPIs = [
    {
      title: 'Receita Total',
      value: formatCurrency(kpis?.total_revenue || 0),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      subtitle: `Lucro: ${formatCurrency(kpis?.net_profit || 0)}`
    },
    {
      title: 'EBITDA',
      value: formatCurrency(kpis?.ebitda || 0),
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
      subtitle: `Margem: ${formatPercent(kpis?.ebitda_margin || 0)}`
    },
    {
      title: 'ROI',
      value: formatPercent(kpis?.roi_percentage || 0),
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      subtitle: `Break-even: ${formatCurrency(kpis?.break_even_point || 0)}`
    },
    {
      title: 'Capital de Giro',
      value: formatCurrency(kpis?.net_working_capital || 0),
      icon: Activity,
      color: 'from-orange-500 to-red-600',
      subtitle: `Eficiência: ${formatPercent(kpis?.operational_efficiency || 0)}`
    }
  ]

  const financialHealthMetrics = [
    {
      label: 'Margem Bruta',
      value: kpis?.gross_margin || 0,
      target: 60,
      color: 'rgb(34, 197, 94)'
    },
    {
      label: 'Margem Operacional',
      value: kpis?.operating_margin || 0,
      target: 40,
      color: 'rgb(59, 130, 246)'
    },
    {
      label: 'Margem Líquida',
      value: kpis?.profit_margin || 0,
      target: 30,
      color: 'rgb(168, 85, 247)'
    },
    {
      label: 'Margem EBITDA',
      value: kpis?.ebitda_margin || 0,
      target: 35,
      color: 'rgb(251, 146, 60)'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1800px] mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard CFO</h1>
            <p className="text-gray-600">Inteligência Financeira Executiva</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">Último Mês</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Último Ano</option>
            </select>
            <button
              onClick={loadCFOData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Executive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {executiveKPIs.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${kpi.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <kpi.icon className="h-7 w-7 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
              <p className="text-xs text-gray-500">{kpi.subtitle}</p>
            </motion.div>
          ))}
        </div>

        {/* Alertas Financeiros */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Alertas Financeiros</h2>
                  <p className="text-sm text-gray-600">{alerts.length} alertas ativos</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Ver Todos
              </button>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}
                >
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <span className="text-xs opacity-70">
                        {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm opacity-90">{alert.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <span>Atual: {formatCurrency(alert.current_value)}</span>
                      <span>Limite: {formatCurrency(alert.threshold_value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Análise de Margens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Margens Financeiras */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Análise de Margens</h2>
                <p className="text-sm text-gray-600">Indicadores de rentabilidade</p>
              </div>
              <BarChart3 className="h-6 w-6 text-gray-400" />
            </div>
            <div className="space-y-4">
              {financialHealthMetrics.map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                    <span className="text-sm font-bold" style={{ color: metric.color }}>
                      {formatPercent(metric.value)}
                    </span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min((metric.value / metric.target) * 100, 100)}%`,
                        backgroundColor: metric.color
                      }}
                    />
                    <div
                      className="absolute h-full border-r-2 border-gray-400"
                      style={{ left: `${(metric.target / 100) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Meta: {metric.target}%</span>
                    <span className={`text-xs font-medium ${
                      metric.value >= metric.target ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {metric.value >= metric.target ? 'Acima da meta' : 'Abaixo da meta'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Radar Chart - Saúde Financeira */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Saúde Financeira</h2>
                <p className="text-sm text-gray-600">Indicadores comparativos</p>
              </div>
              <Shield className="h-6 w-6 text-gray-400" />
            </div>
            <div className="h-80">
              <Radar
                data={{
                  labels: financialHealthMetrics.map(m => m.label),
                  datasets: [
                    {
                      label: 'Atual',
                      data: financialHealthMetrics.map(m => m.value),
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 2,
                      pointBackgroundColor: 'rgb(59, 130, 246)',
                      pointBorderColor: '#fff',
                      pointHoverBackgroundColor: '#fff',
                      pointHoverBorderColor: 'rgb(59, 130, 246)'
                    },
                    {
                      label: 'Meta',
                      data: financialHealthMetrics.map(m => m.target),
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      borderColor: 'rgb(34, 197, 94)',
                      borderWidth: 2,
                      pointBackgroundColor: 'rgb(34, 197, 94)',
                      pointBorderColor: '#fff',
                      pointHoverBackgroundColor: '#fff',
                      pointHoverBorderColor: 'rgb(34, 197, 94)'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 70,
                      ticks: {
                        stepSize: 10
                      }
                    }
                  }
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Inteligência de Clientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Inteligência de Clientes</h2>
                <p className="text-sm text-gray-600">Top 10 clientes por receita</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
              Ver Análise Completa
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Classificação</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Receita</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Pedidos</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Ticket Médio</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Risco</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer, index) => {
                  const riskLevel = getRiskLevel(customer.risk_score)
                  return (
                    <tr key={customer.customer_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{customer.customer_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{customer.customer_type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getABCColor(customer.abc_classification)}`}>
                          {customer.abc_classification}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(customer.total_revenue)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-gray-900">{customer.total_orders}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-gray-900">
                          {formatCurrency(customer.avg_order_value)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-blue-600"
                              style={{ width: `${(customer.credit_score / 1000) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{customer.credit_score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium ${riskLevel.color}`}>
                          {riskLevel.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Métricas Operacionais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 shadow-lg text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 text-green-200" />
              <span className="text-sm font-medium text-green-100">Estoque</span>
            </div>
            <h3 className="text-3xl font-bold mb-2">
              {formatCurrency(kpis?.total_inventory_value || 0)}
            </h3>
            <p className="text-green-100 text-sm mb-4">Valor Total</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-green-100 mb-1">Lucro Potencial</p>
                <p className="text-lg font-bold">{formatCurrency(kpis?.potential_profit || 0)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-green-100 mb-1">Giro</p>
                <p className="text-lg font-bold">{(kpis?.inventory_turnover || 0).toFixed(1)}x</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-2xl p-6 shadow-lg text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-200" />
              <span className="text-sm font-medium text-blue-100">Clientes</span>
            </div>
            <h3 className="text-3xl font-bold mb-2">{kpis?.total_customers || 0}</h3>
            <p className="text-blue-100 text-sm mb-4">Total de Clientes</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-blue-100 mb-1">Pessoa Jurídica</p>
                <p className="text-lg font-bold">{kpis?.total_customers_pj || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-blue-100 mb-1">Pessoa Física</p>
                <p className="text-lg font-bold">{kpis?.total_customers_pf || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl p-6 shadow-lg text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-purple-200" />
              <span className="text-sm font-medium text-purple-100">Ordens de Serviço</span>
            </div>
            <h3 className="text-3xl font-bold mb-2">{kpis?.total_completed_orders || 0}</h3>
            <p className="text-purple-100 text-sm mb-4">Concluídas</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-purple-100 mb-1">Ticket Médio</p>
                <p className="text-lg font-bold">{formatCurrency(kpis?.avg_order_value || 0)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-purple-100 mb-1">Em Progresso</p>
                <p className="text-lg font-bold">{kpis?.orders_in_progress || 0}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default CFODashboard

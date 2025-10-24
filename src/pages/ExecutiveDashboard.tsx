import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Users, Package, Clock,
  Target, AlertCircle, CheckCircle, ArrowUpRight, ArrowDownRight,
  Calendar, FileText, Activity, BarChart3, PieChart as PieChartIcon,
  RefreshCw, Download, Filter, ChevronDown
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ExecutiveMetrics {
  revenue: {
    current: number
    previous: number
    growth: number
  }
  profit: {
    amount: number
    margin: number
    trend: number
  }
  orders: {
    total: number
    completed: number
    conversionRate: number
  }
  customers: {
    total: number
    active: number
    new: number
  }
  inventory: {
    value: number
    profit: number
    turnover: number
  }
}

interface ChartData {
  revenueByMonth: { labels: string[]; data: number[] }
  profitByMonth: { labels: string[]; data: number[] }
  topServices: { labels: string[]; data: number[] }
  topCustomers: { labels: string[]; data: number[] }
  orderStatus: { labels: string[]; data: number[] }
}

const ExecutiveDashboard = () => {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    loadExecutiveData()
  }, [timeRange])

  const loadExecutiveData = async () => {
    try {
      setLoading(true)

      const [metricsData, chartsData] = await Promise.all([
        loadMetrics(),
        loadChartData()
      ])

      setMetrics(metricsData)
      setChartData(chartsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async (): Promise<ExecutiveMetrics> => {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [financialSummary, kpis, customers, inventory] = await Promise.all([
      supabase
        .from('v_monthly_financial_summary')
        .select('*')
        .order('month', { ascending: false })
        .limit(2),
      supabase.from('v_business_kpis').select('*').maybeSingle(),
      supabase.from('customers').select('id, created_at'),
      supabase.from('materials').select('unit_cost, unit_price, quantity')
    ])

    const currentMonth = financialSummary.data?.[0] || { total_revenue: 0, net_profit: 0, profit_margin: 0 }
    const previousMonth = financialSummary.data?.[1] || { total_revenue: 0 }

    const currentRev = Number(currentMonth.total_revenue) || 0
    const previousRev = Number(previousMonth.total_revenue) || 0
    const revenueGrowth = previousRev > 0 ? ((currentRev - previousRev) / previousRev) * 100 : 0

    const newCustomers = customers.data?.filter(c =>
      new Date(c.created_at) >= currentMonthStart
    ).length || 0

    const inventoryValue = inventory.data?.reduce((sum, m) =>
      sum + (m.unit_cost * m.quantity), 0
    ) || 0

    const inventoryProfit = inventory.data?.reduce((sum, m) =>
      sum + ((m.unit_price - m.unit_cost) * m.quantity), 0
    ) || 0

    return {
      revenue: {
        current: currentRev,
        previous: previousRev,
        growth: revenueGrowth
      },
      profit: {
        amount: Number(currentMonth.net_profit) || 0,
        margin: Number(currentMonth.profit_margin) || 0,
        trend: revenueGrowth
      },
      orders: {
        total: kpis.data?.total_completed_orders || 0,
        completed: kpis.data?.total_completed_orders || 0,
        conversionRate: kpis.data?.conversion_rate || 0
      },
      customers: {
        total: kpis.data?.total_customers || 0,
        active: kpis.data?.active_customers || 0,
        new: newCustomers
      },
      inventory: {
        value: inventoryValue,
        profit: inventoryProfit,
        turnover: 0
      }
    }
  }

  const loadChartData = async (): Promise<ChartData> => {
    const [financialSummary, servicesData, customersData, ordersData] = await Promise.all([
      supabase
        .from('v_monthly_financial_summary')
        .select('*')
        .order('month', { ascending: true })
        .limit(6),
      supabase.from('v_top_services_by_revenue').select('*').limit(5),
      supabase.from('v_top_customers_by_revenue').select('*').limit(5),
      supabase.from('service_orders').select('status')
    ])

    const months = financialSummary.data?.map(m => m.month_label) || []
    const revenues = financialSummary.data?.map(m => Number(m.total_revenue)) || []
    const profits = financialSummary.data?.map(m => Number(m.net_profit)) || []

    const statusCount = new Map<string, number>()
    ordersData.data?.forEach(o => {
      statusCount.set(o.status, (statusCount.get(o.status) || 0) + 1)
    })

    return {
      revenueByMonth: {
        labels: months,
        data: revenues
      },
      profitByMonth: {
        labels: months,
        data: profits
      },
      topServices: {
        labels: servicesData.data?.map(s => s.service_name || 'Sem nome') || [],
        data: servicesData.data?.map(s => Number(s.total_revenue)) || []
      },
      topCustomers: {
        labels: customersData.data?.map(c => c.customer_name || 'Sem nome') || [],
        data: customersData.data?.map(c => Number(c.total_revenue)) || []
      },
      orderStatus: {
        labels: Array.from(statusCount.keys()),
        data: Array.from(statusCount.values())
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '0.0%'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  const kpiCards = [
    {
      title: 'Receita do Mês',
      value: formatCurrency(metrics?.revenue.current || 0),
      change: formatPercent(metrics?.revenue.growth || 0),
      trend: (metrics?.revenue.growth || 0) >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      previous: formatCurrency(metrics?.revenue.previous || 0)
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(metrics?.profit.amount || 0),
      change: `${((metrics?.profit.margin ?? 0) || 0).toFixed(1)}% margem`,
      trend: (metrics?.profit.amount || 0) >= 0 ? 'up' : 'down',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
      previous: `Margem ${((metrics?.profit.margin ?? 0) || 0).toFixed(1)}%`
    },
    {
      title: 'Taxa de Conversão',
      value: `${((metrics?.orders.conversionRate ?? 0) || 0).toFixed(1)}%`,
      change: `${metrics?.orders.completed || 0} OSs concluídas`,
      trend: (metrics?.orders.conversionRate || 0) >= 80 ? 'up' : 'down',
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      previous: `${metrics?.orders.total || 0} OSs totais`
    },
    {
      title: 'Clientes Ativos',
      value: metrics?.customers.active.toString() || '0',
      change: `+${metrics?.customers.new || 0} novos`,
      trend: 'up',
      icon: Users,
      color: 'from-orange-500 to-red-600',
      previous: `${metrics?.customers.total || 0} total`
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1800px] mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Executivo</h1>
            <p className="text-gray-600">Visão estratégica para tomada de decisões</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="month">Último Mês</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Último Ano</option>
            </select>
            <button
              onClick={loadExecutiveData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((kpi, index) => (
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
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  kpi.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {kpi.change}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
              <p className="text-xs text-gray-500">{kpi.previous}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Evolução da Receita</h2>
                <p className="text-sm text-gray-600">Últimos 6 meses</p>
              </div>
              <BarChart3 className="h-6 w-6 text-gray-400" />
            </div>
            <div className="h-80">
              {chartData && (
                <Line
                  data={{
                    labels: chartData.revenueByMonth.labels,
                    datasets: [
                      {
                        label: 'Receita',
                        data: chartData.revenueByMonth.data,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        callbacks: {
                          label: (context) => formatCurrency(context.parsed.y)
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatCurrency(Number(value))
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          </motion.div>

          {/* Profit Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Lucro Mensal</h2>
                <p className="text-sm text-gray-600">Receita - Despesas</p>
              </div>
              <TrendingUp className="h-6 w-6 text-gray-400" />
            </div>
            <div className="h-80">
              {chartData && (
                <Bar
                  data={{
                    labels: chartData.profitByMonth.labels,
                    datasets: [
                      {
                        label: 'Lucro',
                        data: chartData.profitByMonth.data,
                        backgroundColor: chartData.profitByMonth.data.map(v =>
                          v >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                        ),
                        borderRadius: 8,
                        borderWidth: 0
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                          label: (context) => formatCurrency(context.parsed.y)
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatCurrency(Number(value))
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Top 5 Serviços</h2>
                <p className="text-sm text-gray-600">Por receita</p>
              </div>
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <div className="space-y-4">
              {chartData?.topServices.labels.map((service, index) => (
                <div key={service} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">{service}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {formatCurrency(chartData.topServices.data[index])}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Customers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Top 5 Clientes</h2>
                <p className="text-sm text-gray-600">Maior receita</p>
              </div>
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <div className="space-y-4">
              {chartData?.topCustomers.labels.map((customer, index) => (
                <div key={customer} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">{customer}</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">
                    {formatCurrency(chartData.topCustomers.data[index])}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Order Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Status das OSs</h2>
                <p className="text-sm text-gray-600">Distribuição atual</p>
              </div>
              <Activity className="h-6 w-6 text-gray-400" />
            </div>
            <div className="h-64">
              {chartData && chartData.orderStatus.data.length > 0 && (
                <Doughnut
                  data={{
                    labels: chartData.orderStatus.labels,
                    datasets: [
                      {
                        data: chartData.orderStatus.data,
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.8)',
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(251, 146, 60, 0.8)',
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(168, 85, 247, 0.8)'
                        ],
                        borderWidth: 0
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 15,
                          font: { size: 12 }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12
                      }
                    }
                  }}
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* Inventory & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-2xl p-6 shadow-lg text-white"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Análise de Estoque</h2>
                <p className="text-blue-100">Potencial de lucro imobilizado</p>
              </div>
              <Package className="h-8 w-8 text-blue-200" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-blue-100 text-sm mb-1">Valor em Estoque</p>
                <p className="text-3xl font-bold">{formatCurrency(metrics?.inventory.value || 0)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-blue-100 text-sm mb-1">Lucro Potencial</p>
                <p className="text-3xl font-bold">{formatCurrency(metrics?.inventory.profit || 0)}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-sm text-blue-100 mb-2">Margem Potencial</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold">
                  {(((metrics?.inventory.profit ?? 0) || 0) / ((metrics?.inventory.value ?? 1) || 1) * 100).toFixed(1)}%
                </p>
                <p className="text-blue-100 pb-2">de rentabilidade</p>
              </div>
            </div>
          </motion.div>

          {/* Key Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Insights Estratégicos</h2>
                <p className="text-sm text-gray-600">Pontos de atenção</p>
              </div>
              <AlertCircle className="h-6 w-6 text-gray-400" />
            </div>
            <div className="space-y-4">
              {(metrics?.revenue.growth || 0) >= 10 && (
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">Crescimento Acelerado</p>
                    <p className="text-sm text-green-700">
                      Receita cresceu {formatPercent(metrics.revenue.growth)} este mês
                    </p>
                  </div>
                </div>
              )}

              {(metrics?.orders.conversionRate || 0) >= 80 && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900">Alta Conversão</p>
                    <p className="text-sm text-blue-700">
                      Taxa de {((metrics.orders.conversionRate ?? 0) || 0).toFixed(1)}% supera meta de 80%
                    </p>
                  </div>
                </div>
              )}

              {(metrics?.profit.margin || 0) >= 30 && (
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-purple-900">Margem Saudável</p>
                    <p className="text-sm text-purple-700">
                      Margem de lucro de {((metrics.profit.margin ?? 0) || 0).toFixed(1)}% acima da meta
                    </p>
                  </div>
                </div>
              )}

              {(metrics?.customers.new || 0) > 0 && (
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-orange-900">Expansão da Base</p>
                    <p className="text-sm text-orange-700">
                      {metrics.customers.new} novos clientes este mês
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ExecutiveDashboard
